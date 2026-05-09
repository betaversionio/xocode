import { Controller, Post, Get, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { AuthService } from "./auth.service";
import { loginSchema, registerSchema } from "@xo/shared";
import { JwtAuthGuard, type JwtPayload } from "./jwt.guard";
import { CurrentUser } from "./current-user.decorator";
import { prisma } from "@xo/database";

class RegisterDto extends createZodDto(registerSchema) {}
class LoginDto extends createZodDto(loginSchema) {}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @ApiOperation({ summary: "Login" })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  async me(@CurrentUser() user: JwtPayload) {
    const found = await prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, email: true, name: true, githubUrl: true, createdAt: true },
    });
    return found;
  }
}
