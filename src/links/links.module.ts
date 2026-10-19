import { Module } from '@nestjs/common';
import { LinksController } from './links.controller.js';
import { LinksService } from './links.service.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Link } from './link.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Link])],
  controllers: [LinksController],
  providers: [LinksService],
})
export class LinksModule {}
