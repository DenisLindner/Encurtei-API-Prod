import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateLinkDTO } from './dto/create-link.dto';
import Redis from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

const CHARSET =
  '6plCWYq0iuerzvwEDQ5yGS7LJ2KA3VIXbfHP8RgaNmcd4knhoMxBj9st1TUZFO-.';

@Injectable()
export class LinksService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateLinkDTO): Promise<string> {
    if (dto.path) {
      const exists = await this.prisma.link.findUnique({
        where: { shortCode: dto.path },
      });
      if (exists) {
        throw new ConflictException('Esse caminho já está em uso!');
      }

      await this.prisma.link.create({
        data: {
          shortCode: dto.path,
          originalUrl: dto.originalUrl,
        },
      });

      return dto.path;
    }

    while (true) {
      const id = await this.redis.incr('url_id_counter');
      const shortCode = this.generateShortCode(id);

      try {
        await this.prisma.link.create({
          data: {
            shortCode,
            originalUrl: dto.originalUrl,
          },
        });

        return shortCode;

        // eslint-disable-next-line no-empty
      } catch {}
    }
  }

  async findOriginalLink(shortCode: string) {
    const original = await this.prisma.link.findUnique({
      where: {
        shortCode,
      },
      select: {
        originalUrl: true,
      },
    });

    if (!original) {
      throw new NotFoundException('Link não encontrado');
    }

    return original.originalUrl;
  }

  private generateShortCode(id: number | bigint): string {
    let n = BigInt(id);
    if (n === 0n) {
      return CHARSET[0];
    }

    let shortCode = '';
    while (n > 0n) {
      shortCode = CHARSET[Number(n % 64n)] + shortCode;
      n = n / 64n;
    }

    return shortCode;
  }

  @Cron('0 30 23 * * 7', { timeZone: 'America/Sao_Paulo' })
  async deleteSchedule() {
    await this.deleteExpireLinks();
  }

  private async deleteExpireLinks() {
    const now = new Date();
    await this.prisma.link.deleteMany({
      where: { expireAt: { lt: now } },
    });
  }
}
