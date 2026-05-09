import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { JwtPayload } from "./jwt.guard";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const req = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    return req.user;
  },
);
