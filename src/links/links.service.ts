import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CreateLinkDTO } from './dto/create-link.dto';
import Redis from 'ioredis';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

const CHARSET =
  '6plCWYq0iuerzvwEDQ5yGS7LJ2KA3VIXbfHP8RgaNmcd4knhoMxBj9st1TUZFO-.';

const MAX_CREATE_ATTEMPTS = 3;
const CACHE_PREFIX = 'link:';
const CACHE_TTL_SECONDS = 60 * 60 * 24;
const NOT_FOUND_TTL_SECONDS = 60;
const NOT_FOUND_MARKER = '__not_found__';

@Injectable()
export class LinksService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateLinkDTO): Promise<string> {
    if (dto.path) {
      try {
        await this.prisma.link.create({
          data: { shortCode: dto.path, originalUrl: dto.originalUrl },
        });
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          throw new ConflictException('Esse caminho já está em uso!');
        }
        throw error;
      }
      await this.cacheSet(dto.path, dto.originalUrl);
      return dto.path;
    }

    for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt++) {
      const id = await this.redis.incr('url_id_counter');
      const shortCode = this.generateShortCode(id);

      try {
        await this.prisma.link.create({
          data: { shortCode, originalUrl: dto.originalUrl },
        });
        await this.cacheSet(shortCode, dto.originalUrl);
        return shortCode;
      } catch (error) {
        // Só repete em colisão de shortCode (ex.: path customizado igual);
        // qualquer outro erro (banco fora, pool esgotado) sobe imediatamente.
        if (!this.isUniqueViolation(error)) throw error;
      }
    }

    throw new ServiceUnavailableException(
      'Não foi possível gerar um código único. Tente novamente.',
    );
  }

  async findOriginalLink(shortCode: string) {
    const cacheKey = `${CACHE_PREFIX}${shortCode}`;

    const cached = await this.cacheGet(cacheKey);
    if (cached === NOT_FOUND_MARKER) {
      throw new NotFoundException('Link não encontrado');
    }
    if (cached) return cached;

    const original = await this.prisma.link.findFirst({
      where: { shortCode, expireAt: { gt: new Date() } },
      select: { originalUrl: true },
    });

    if (!original) {
      await this.redis
        .set(cacheKey, NOT_FOUND_MARKER, 'EX', NOT_FOUND_TTL_SECONDS)
        .catch(() => undefined);
      throw new NotFoundException('Link não encontrado');
    }

    await this.cacheSet(shortCode, original.originalUrl);
    return original.originalUrl;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: string }).code === 'P2002'
    );
  }

  // Cache é best-effort: falha no Redis nunca deve derrubar a requisição.
  private async cacheGet(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch {
      return null;
    }
  }

  private async cacheSet(shortCode: string, url: string): Promise<void> {
    await this.redis
      .set(`${CACHE_PREFIX}${shortCode}`, url, 'EX', CACHE_TTL_SECONDS)
      .catch(() => undefined);
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
