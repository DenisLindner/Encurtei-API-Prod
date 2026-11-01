import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Necessário atrás de proxy reverso: usa o IP real do cliente no rate limit
  app.set('trust proxy', 1);
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const originString = process.env.ORIGIN || '';

  const originsArray = originString.split(',').map((item) => item.trim());

  app.enableCors({
    origin: originsArray,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.use(helmet());

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
