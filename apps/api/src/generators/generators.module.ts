import { Module } from "@nestjs/common";
import { GeneratorsController } from "./generators.controller";
import { GeneratorsService } from "./generators.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [GeneratorsController],
  providers: [GeneratorsService],
})
export class GeneratorsModule {}
