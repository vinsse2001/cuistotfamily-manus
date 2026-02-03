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
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      nickname,
      verificationCode,
      isEmailVerified: false,
      isActive: false,
      role: 'user'
    });

    // Simulation d'envoi d'email dans les logs
    console.log(`[EMAIL SIMULATION] Code de vérification pour ${user.email} : ${verificationCode}`);
    
    const { password, ...result } = user;
    return result;
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user || user.verificationCode !== code) {
      throw new UnauthorizedException('Code de vérification incorrect');
    }

    await this.usersService.updateProfile(user.id, { 
      isEmailVerified: true, 
      verificationCode: null 
    });

    return { message: 'Email vérifié avec succès. Votre compte doit maintenant être validé par un administrateur.' };
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

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Veuillez vérifier votre email avant de vous connecter. Un code vous a été envoyé lors de l\'inscription.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Votre compte est en attente de validation par un administrateur');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, nickname: user.nickname };
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
