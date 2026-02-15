import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('debug/routes')
  getRoutes(): any {
    return {
      message: 'Routes disponibles',
      endpoints: [
        'GET /',
        'GET /debug/routes',
        'POST /contact',
        'POST /auth/register',
        'POST /auth/verify-email',
        'POST /auth/login',
        'GET /users/admin/list (Admin only)',
        'PATCH /users/profile (Authenticated)',
        'PATCH /users/admin/status/:id (Admin only)',
        'DELETE /users/admin/:id (Admin only)',
        'GET /users/aliases (Authenticated)',
        'POST /users/alias (Authenticated)',
        'GET /recipes',
        'GET /recipes/:id',
        'POST /recipes',
        'PATCH /recipes/:id',
        'DELETE /recipes/:id',
        'POST /recipes/:id/fork',
        'POST /recipes/:id/favorite',
        'POST /recipes/:id/rate',
      ]
    };
  }

  @Post('contact')
  async contact(@Body() contactData: { name: string; email: string; subject: string; message: string }) {





    
    // TODO: Intégrer un service d'envoi d'email (Nodemailer, SendGrid, etc.)
    return { success: true, message: 'Message reçu' };
  }
}
