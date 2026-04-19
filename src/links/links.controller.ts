import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LinksService } from './links.service';
import { Throttle } from '@nestjs/throttler';
import { CreateLinkDTO } from './dto/create-link.dto';

@Controller()
export class LinksController {
  constructor(private readonly service: LinksService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 4 } })
  async createLink(@Body() dto: CreateLinkDTO) {
    const shortCode = await this.service.create(dto);
    return { shortUrl: shortCode };
  }

  @Get(':code')
  async getOriginalLink(@Param('code') shortCode: string) {
    const url = await this.service.findOriginalLink(shortCode);
    return { url };
  }
}
