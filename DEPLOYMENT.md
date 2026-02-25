# Guide de Déploiement de Cuistot Family

Ce document fournit des instructions détaillées pour déployer l'application Cuistot Family, à la fois en environnement local (Linux Mint) et sur un hébergement o2switch.

## 1. Déploiement Local (Linux Mint)

### Prérequis

Assurez-vous d'avoir les outils suivants installés sur votre système Linux Mint :

*   **Git** : Pour cloner le dépôt.

```bash
sudo apt update
sudo apt install git
```

*   **Node.js et npm/pnpm** : Pour le frontend (Angular) et le backend (NestJS).

    Il est recommandé d'utiliser `nvm` (Node Version Manager) pour gérer les versions de Node.js.
    
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc # ou ~/.zshrc
nvm install 22 # Installe la dernière version LTS de Node.js 22
nvm use 22
curl -fsSL https://get.pnpm.io/install.sh | bash - # Installe pnpm à partir du script officiel
```
*   **PostgreSQL** : La base de données utilisée par l'application.

```bash
sudo apt install postgresql postgresql-contrib
sudo -i -u postgres
createuser --interactive # Suivez les instructions pour créer un utilisateur (ex: cuistot_user)
createdb cuistotfamilymanus # Crée la base de données
psql
ALTER USER cuistot_user WITH PASSWORD 'votre_mot_de_passe';
\q
exit
```

### Étapes de Déploiement

1.  **Cloner le dépôt**
   
```bash
git clone https://github.com/vinsse2001/cuistotfamily-manus.git
cd cuistotfamily-manus
```

2.  **Configuration du Backend (NestJS)**

a. **Installer les dépendances**

```bash
cd backend
pnpm install
```

b. **Fichier d'environnement (.env)**

Créez un fichier `.env` à la racine du dossier `backend` avec les informations de votre base de données et autres configurations.

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=cuistot
DB_PASSWORD=cuistot_password
DB_DATABASE=cuistotfamilymanus
DB_SYNCHRONIZE=true
JWT_SECRET=super-secret-key-change-me-in-production
OPENAI_API_KEY=sk-proj-dglkdfjgdgkljetoizutzeotiuz
```

c. **Démarrer le serveur backend**

```bash
pnpm run start:dev
```
(à noter, cela va initialiser automatiquement la base de données)
Le backend devrait être accessible sur `http://localhost:3000`.

3.  **Configuration du Frontend (Angular)**

a.  **Installer les dépendances**

Dans un nouveau terminal :
```bash
cd frontend
pnpm install
```

b.  **Fichier d'environnement**

Angular utilise des fichiers d'environnement TypeScript. Modifiez `src/environments/environment.ts` et `src/environments/environment.development.ts` pour pointer vers votre backend local.

```typescript
// src/environments/environment.development.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  // ... autres variables
};
```

c.  **Démarrer le serveur de développement frontend**

```bash
pnpm run start
```

Le frontend devrait être accessible sur `http://localhost:4200`.

## 2. Déploiement sur o2switch

Le déploiement sur o2switch implique généralement l'utilisation de SSH pour accéder à votre espace d'hébergement et la configuration de Node.js, d'une base de données (souvent MySQL/MariaDB sur o2switch, mais PostgreSQL est aussi possible via des installations personnalisées ou des services managés) et d'un serveur web (Apache/Nginx).

### Prérequis o2switch

*   **Accès SSH** : Activez et configurez l'accès SSH à votre compte o2switch.
*   **Node.js** : Assurez-vous que Node.js est disponible et à jour sur votre environnement o2switch. Si ce n'est pas le cas, vous devrez peut-être l'installer manuellement ou utiliser une version fournie par l'hébergeur.
*   **Base de données** : Créez une base de données (PostgreSQL si possible, sinon MySQL/MariaDB nécessitera des ajustements dans le backend) et un utilisateur via l'interface cPanel d'o2switch.
*   **Domaine/Sous-domaine** : Configurez un domaine ou un sous-domaine pointant vers le dossier de votre application.

### Étapes de Déploiement

1.  **Connexion SSH**
```bash
ssh votre_utilisateur@votre_domaine.com
```

2.  **Cloner le dépôt**
    Naviguez vers le répertoire de votre site web (ex: `public_html` ou un sous-dossier) et clonez le dépôt.
```bash
cd public_html/cuistot-family
git clone https://github.com/vinsse2001/cuistotfamily-manus.git .
```

3.  **Configuration du Backend**

    a.  **Installer les dépendances**
```bash
cd backend
pnpm install --prod # Installe uniquement les dépendances de production
```

    b.  **Fichier d'environnement (`.env`)**
        Créez un fichier `.env` avec les informations de votre base de données o2switch et les secrets JWT.
```env
DATABASE_URL="postgresql://o2_user:o2_password@localhost:5432/o2_database"
JWT_SECRET="votre_secret_jwt_tres_long_et_complexe"
# Assurez-vous que l'URL de la base de données est correcte pour o2switch
```

    c.  **Exécuter les migrations de base de données**
```bash
pnpm run typeorm migration:run
```

    d.  **Construire le backend pour la production**
```bash
pnpm run build
```

    e.  **Démarrer le processus backend**
        Vous devrez utiliser un gestionnaire de processus comme `PM2` pour maintenir votre application Node.js en ligne.
```bash
npm install -g pm2 # Si PM2 n'est pas déjà installé
pm2 start dist/main.js --name 
`cuistot-family-backend`
pm2 save
```

4.  **Configuration du Frontend**

    a.  **Installer les dépendances**
```bash
cd ../frontend
pnpm install --prod
```

    b.  **Fichier d'environnement**
        Modifiez `src/environments/environment.ts` et `src/environments/environment.production.ts` pour pointer vers l'URL de votre backend déployé sur o2switch.
```typescript
// src/environments/environment.production.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.votre_domaine.com',
  // ... autres variables
};
```

    c.  **Construire le frontend pour la production**
```bash
pnpm run build
```
        Les fichiers statiques seront générés dans le dossier `dist/browser`.

    d.  **Configuration du serveur web (Apache/Nginx)**
        Vous devrez configurer votre serveur web (via `.htaccess` pour Apache ou la configuration Nginx) pour servir les fichiers statiques du frontend et rediriger les requêtes API vers votre backend Node.js (qui tourne sur un port spécifique via PM2).

        **Exemple pour Apache (.htaccess dans `public_html/cuistot-family/frontend/dist/browser`) :**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Redirection des requêtes API vers le backend Node.js
RewriteRule ^api/(.*)$ http://localhost:3000/$1 [P,L]
```
        *Note : L'utilisation de `localhost:3000` pour la redirection API dépendra de la configuration interne d'o2switch et du port sur lequel votre application Node.js est accessible. Vous devrez peut-être utiliser un port spécifique ou un socket Unix.* 

5.  **Accès à l'application**
    Une fois toutes les étapes complétées, votre application devrait être accessible via votre domaine ou sous-domaine configuré sur o2switch.

---
