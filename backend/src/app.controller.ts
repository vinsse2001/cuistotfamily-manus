import { Controller, Get } from '@nestjs/common';
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
        'GET /api',
        'GET /api/debug/routes',
        'POST /api/auth/register',
        'POST /api/auth/verify-email',
        'POST /api/auth/login',
        'GET /api/users/admin/list (Admin only)',
        'PATCH /api/users/profile (Authenticated)',
        'PATCH /api/users/admin/status/:id (Admin only)',
        'DELETE /api/users/admin/:id (Admin only)',
        'GET /api/users/aliases (Authenticated)',
        'POST /api/users/alias (Authenticated)',
        'GET /api/recipes',
        'GET /api/recipes/:id',
        'POST /api/recipes',
        'PATCH /api/recipes/:id',
        'DELETE /api/recipes/:id',
        'POST /api/recipes/:id/fork',
        'POST /api/recipes/:id/favorite',
        'POST /api/recipes/:id/rate',
      ]
    };
  }
}
