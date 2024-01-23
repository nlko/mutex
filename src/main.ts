import { LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: [
      'error',
      'warn',
      'log',
      ...(process.env.VERBOSE_TRACE ? ['verbose' as LogLevel] : []),
      ...(process.env.DEBUG_TRACE ? ['debug' as LogLevel] : []),
    ],
  });
  await app.listen(3000);
}
bootstrap();
