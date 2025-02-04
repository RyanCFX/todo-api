import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as requestIp from 'request-ip';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // LEER COOKIES
  app.use(cookieParser());
  app.use(requestIp.mw());

  // LIMITE DE TAMAÑO DEL BODY
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

  app.enableCors({
    origin: [''],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization', // Agrega Content-Type y otros headers necesarios
    credentials: true, // Si necesitas cookies o autenticación
  });

  await app.listen(process.env.PORT || 9876);
  // await app.listen(3005);
}
bootstrap();
