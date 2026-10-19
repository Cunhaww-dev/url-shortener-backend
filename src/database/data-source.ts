import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Link } from '../links/link.entity.js';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Link],
  migrations: ['dist/database/migrations/*.js'],
});
