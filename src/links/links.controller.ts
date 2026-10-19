import { Body, Controller, Get, Param, Post, Redirect } from '@nestjs/common';
import { LinksService } from './links.service.js';
import { CreateLinkDto } from './dto/create-link.dto.js';

@Controller()
export class LinksController {
  constructor(private readonly links: LinksService) {}

  @Post('links')
  create(@Body() dto: CreateLinkDto) {
    return this.links.create(dto.url);
  }

  @Get('links/:code/stats')
  stats(@Param('code') code: string) {
    return this.links.stats(code);
  }

  @Get(':code')
  @Redirect()
  async redirect(@Param('code') code: string) {
    return { url: await this.links.resolve(code), statusCode: 302 };
  }
}
