import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { DataSource } from 'typeorm';

dotenv.config();

async function bootstrap() {
  const logger = WinstonModule.createLogger({
    transports: [new winston.transports.Console({ format: winston.format.simple() })],
  });
  const app = await NestFactory.create(AppModule, { logger });
  if (process.env.RUN_MIGRATIONS === 'true') {
    try {
      const ds = app.get(DataSource);
      if (ds && !ds.isInitialized) await ds.initialize();
      if (ds) await ds.runMigrations();
      logger.log('Migrations applied (RUN_MIGRATIONS=true)');
    } catch (err) {
      logger.error('Error running migrations on startup', err as any);
      process.exit(1);
    }
  }
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  const config = new DocumentBuilder()
    .setTitle('Users API')
    .setDescription('CRUD de usuários')
    .setVersion('1.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      }, 'access-token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application listening on port ${port}`);
}
bootstrap();
