import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Activer CORS
  app.enableCors();
  
  // Logger les routes disponibles en développement (version sécurisée)
  if (process.env.NODE_ENV !== 'production') {
    try {
      const server = app.getHttpServer();
      const router = server._events?.request?._router;
      
      if (router && router.stack) {
        console.log('\n=== ROUTES DISPONIBLES ===');
        router.stack.forEach((middleware: any) => {
          if (middleware.route) {
            const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase()).join(', ');
            console.log(`${methods.padEnd(10)} ${middleware.route.path}`);
          } else if (middleware.name === 'router' && middleware.handle?.stack) {
            middleware.handle.stack.forEach((handler: any) => {
              const route = handler.route;
              if (route) {
                const methods = Object.keys(route.methods).map(m => m.toUpperCase()).join(', ');
                console.log(`${methods.padEnd(10)} ${handler.route.path}`);
              }
            });
          }
        });
        console.log('========================\n');
      }
    } catch (e) {
      console.log('Note: Impossible de lister les routes automatiquement au démarrage.');
    }
  }
  
  await app.listen(process.env.PORT ?? 3000);
  console.log(`✅ Application démarrée sur http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
