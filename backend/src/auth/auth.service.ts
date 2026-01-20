import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, pass: string, nickname: string) {
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    
    // On simplifie : pas de code de vérification par email pour l'instant
    // On met isEmailVerified à true par défaut pour ne dépendre que de isActive (admin)
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      nickname,
      isEmailVerified: true, 
      isActive: false,
      role: 'user'
    });

    const { password, ...result } = user;
    return result;
  }

  async login(email: string, pass: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Identifiants incorrects');
    }

    // Seul le contrôle admin (isActive) est conservé pour la validation
    if (!user.isActive) {
      throw new UnauthorizedException('Votre compte est en attente de validation par un administrateur');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role
      },
    };
  }
}
