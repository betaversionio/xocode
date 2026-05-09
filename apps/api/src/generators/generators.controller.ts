import { Controller, Get, Post, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { GeneratorsService } from "./generators.service";
import { registerGeneratorSchema, paginationSchema } from "@xo/shared";
import { JwtAuthGuard, type JwtPayload } from "../auth/jwt.guard";
import { CurrentUser } from "../auth/current-user.decorator";

class RegisterGeneratorDto extends createZodDto(registerGeneratorSchema) {}
class PaginationDto extends createZodDto(paginationSchema) {}

@ApiTags("generators")
@Controller("generators")
export class GeneratorsController {
  constructor(private readonly generatorsService: GeneratorsService) {}

  @Get()
  @ApiOperation({ summary: "List all generators" })
  findAll(@Query() query: PaginationDto) {
    return this.generatorsService.findAll(query);
  }

  @Get("*name")
  @ApiOperation({ summary: "Get a generator by name (e.g. ui/button)" })
  findOne(@Param("name") name: string | string[]) {
    const generatorName = Array.isArray(name) ? name.join("/") : name;
    return this.generatorsService.findOne(generatorName);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Register a new generator" })
  register(@Body() dto: RegisterGeneratorDto, @CurrentUser() user: JwtPayload) {
    return this.generatorsService.register(dto, user.sub);
  }
}
