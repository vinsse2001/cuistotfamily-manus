import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const adminEmail = 'admin@cuistotfamily.com';
  const existingAdmin = await usersService.findOneByEmail(adminEmail);

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await usersService.create({
      email: adminEmail,
      password: hashedPassword,
      nickname: 'Administrateur',
      isActive: true,
      isEmailVerified: true,
      role: 'admin',
    });
    console.log('Compte administrateur créé : admin@cuistotfamily.com / admin123');
  } else {
    // S'assurer que l'admin existant est actif et vérifié
    await usersService.update(existingAdmin.id, {
      isActive: true,
      isEmailVerified: true,
      role: 'admin'
    });
    console.log('Le compte administrateur a été mis à jour (actif et vérifié).');
  }

  await app.close();
}
bootstrap();
