import "reflect-metadata";
import cookieParser from "cookie-parser";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app.module.js";
import { applyHttpSecurity, validateSecurityConfig } from "./modules/security.js";

async function bootstrap() {
  validateSecurityConfig();
  const app = await NestFactory.create(AppModule);
  const origin = process.env.WEB_ORIGIN ?? "http://localhost:5173";

  app.enableCors({ origin, credentials: true });
  applyHttpSecurity(app);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
