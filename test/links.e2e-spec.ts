import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { App } from 'supertest/types.js';

describe('Links (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('cria, redireciona e conta o clique', async () => {
    const created = await request(app.getHttpServer())
      .post('/links')
      .send({ url: 'https://github.com' })
      .expect(201);

    const { code } = created.body;

    await request(app.getHttpServer())
      .get(`/${code}`)
      .expect(302)
      .expect('Location', 'https://github.com');

    const stats = await request(app.getHttpServer())
      .get(`/links/${code}/stats`)
      .expect(200);
    expect(stats.body.clicks).toBe(1);
  });

  it('recusa uma URL inválida', () => {
    return request(app.getHttpServer())
      .post('/links')
      .send({ url: 'nao-e-url' })
      .expect(400);
  });

  it('devolve 404 para código que não existe', () => {
    return request(app.getHttpServer()).get('/naoexiste').expect(404);
  });

  it('responde o health check', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
  });
});
