import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ZodValidationPipe } from "nestjs-zod";
import { APP_PIPE } from "@nestjs/core";
import { GeneratorsModule } from "./generators/generators.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GeneratorsModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class AppModule {}
