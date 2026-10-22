import { Body, Controller, Get, Param, Post, Redirect, UseGuards } from '@nestjs/common';
import { ApiFoundResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CreateLinkDto } from './dto/create-link.dto.js';
import { LinksService } from './links.service.js';

@ApiTags('links')
@Controller()
export class LinksController {
  constructor(private readonly links: LinksService) {}

  @Post('links')
  @UseGuards(ThrottlerGuard)
  create(@Body() dto: CreateLinkDto) {
    return this.links.create(dto.url);
  }

  @Get('links/:code/stats')
  @ApiOkResponse({ description: 'Estatísticas do link' })
  @ApiNotFoundResponse({ description: 'Link não encontrado' })
  stats(@Param('code') code: string) {
    return this.links.stats(code);
  }

  @Get(':code')
  @Redirect()
  @ApiFoundResponse({ description: 'Redireciona para o link original' })
  @ApiNotFoundResponse({ description: 'Link não encontrado' })
  async redirect(@Param('code') code: string) {
    return { url: await this.links.resolve(code), statusCode: 302 };
  }
}