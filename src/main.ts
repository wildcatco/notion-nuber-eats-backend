import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      enableDebugMessages: true,
      whitelist: true,
      ...(process.env.NODE_ENV === 'prod' && { disableErrorMessages: true }),
    }),
  );

  const port = process.env.SERVER_PORT || 4000;
  await app.listen(port, () => {
    console.log(`Server is running on ${port}`);
  });
}

bootstrap();
