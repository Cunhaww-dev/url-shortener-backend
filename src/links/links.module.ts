import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClicksSyncService } from './clicks-sync.service.js';
import { Link } from './link.entity.js';
import { LinksController } from './links.controller.js';
import { LinksService } from './links.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Link])],
  controllers: [LinksController],
  providers: [LinksService, ClicksSyncService],
})
export class LinksModule {}
