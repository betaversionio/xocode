import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { prisma } from "@xo/database";
import type { LoginInput, RegisterInput } from "@xo/shared";

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  async register(dto: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("Email already registered");

    const hash = await argon2.hash(dto.password);
    const user = await prisma.user.create({
      data: { email: dto.email, name: dto.name, password: hash },
    });

    const { password: _, ...safe } = user;
    return { user: safe, token: this.signToken(user.id, user.email) };
  }

  async login(dto: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.password) throw new UnauthorizedException("Invalid credentials");

    const valid = await argon2.verify(user.password, dto.password);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    const { password: _, ...safe } = user;
    return { user: safe, token: this.signToken(user.id, user.email) };
  }

  private signToken(sub: string, email: string) {
    return this.jwt.sign({ sub, email });
  }
}
