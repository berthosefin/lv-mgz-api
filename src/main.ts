import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const port = process.env.PORT || 3001;
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
  });

  app.setGlobalPrefix('api');

  const options = new DocumentBuilder()
    .setTitle('LV MGZ')
    .setDescription('This is the API documentation')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer' })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(port, () => {
    console.log(
      `[Nest] ${process.pid}  - ${new Date().toLocaleString()}     LOG [NestApplication] Nest application running on http://localhost:${port}`,
    );
  });
}
bootstrap();
