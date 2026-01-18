import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RateLimitGuard } from './rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(RateLimitGuard)
  @Post('register')
  register(@Body() registerDto: any) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.nickname,
    );
  }

  @UseGuards(RateLimitGuard)
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() body: { email: string; code: string }) {
    return this.authService.verifyEmail(body.email, body.code);
  }

  @UseGuards(RateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: any) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
