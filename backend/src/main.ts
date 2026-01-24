import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Activer CORS
  app.enableCors();
  
  // Créer les dossiers d'upload s'ils n'existent pas
  const uploadDirs = ['./uploads/temp', './uploads/recipes'];
  uploadDirs.forEach(dir => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });

  // Servir les fichiers statiques (images uploadées)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Suppression du logger de routes intrusif qui causait des erreurs de compilation
  // Les routes sont visibles dans les contrôleurs respectifs
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`✅ Application démarrée sur http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
