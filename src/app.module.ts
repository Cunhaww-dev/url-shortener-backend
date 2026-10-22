import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from './redis/redis.module.js';
import { LinksModule } from './links/links.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: true,
      }),
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    LinksModule,
  ],
})
export class AppModule {}
