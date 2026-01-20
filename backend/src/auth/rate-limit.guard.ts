import { Injectable, BadRequestException } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private readonly maxAttempts = 20; // Augmenté à 20 pour plus de souplesse en dev
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const identifier = request.ip || request.connection.remoteAddress || 'unknown';
    const endpoint = request.path;
    const key = `${identifier}:${endpoint}`;

    const now = Date.now();
    const entry = this.attempts.get(key);

    if (!entry) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (now > entry.resetTime) {
      // Window expired, reset
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    entry.count++;
    if (entry.count > this.maxAttempts) {
      const minutesLeft = Math.ceil((entry.resetTime - now) / 1000 / 60);
      throw new BadRequestException(
        `Trop de tentatives. Veuillez réessayer dans ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`
      );
    }

    return true;
  }
}
