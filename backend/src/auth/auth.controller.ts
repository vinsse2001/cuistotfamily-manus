import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: any) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.nickname,
    );
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() body: { email: string; code: string }) {
    return this.authService.verifyEmail(body.email, body.code);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() loginDto: any) {
    return this.authService.login(loginDto.email, loginDto.password);
  }
}
