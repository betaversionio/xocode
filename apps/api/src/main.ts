import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import morgan from "morgan";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.use(morgan("dev"));
  app.enableCors({ origin: process.env.WEB_URL ?? "http://localhost:3000", credentials: true });
  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle("xo API")
    .setDescription("xo generator registry API")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`xo API running on http://localhost:${port}`);
}

bootstrap();
