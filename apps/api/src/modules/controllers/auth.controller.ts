import { Body, Controller, Get, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { IsEmail, IsString, MinLength } from "class-validator";
import { CurrentUser } from "../decorators/current-user.decorator.js";
import { SessionGuard, type SessionUser } from "../guards/session.guard.js";
import { clientIdentifier, SESSION_COOKIE_NAME, sessionCookieClearOptions, sessionCookieOptions } from "../security.js";
import { AuthService } from "../services/auth.service.js";

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  async login(@Body() body: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const session = await this.auth.login(body.email, body.password, clientIdentifier(request));
    response.cookie(SESSION_COOKIE_NAME, session.token, sessionCookieOptions());
    return session.user;
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(SESSION_COOKIE_NAME, sessionCookieClearOptions());
    return { ok: true };
  }

  @Get("me")
  @UseGuards(SessionGuard)
  me(@CurrentUser() user: SessionUser) {
    return { authenticated: true, user };
  }
}
