# Guide de Déploiement sur o2switch - Cuistot Family

Ce guide explique comment déployer l'application Cuistot Family sur un hébergement o2switch.

## 1. Préparation du Backend (NestJS)

o2switch utilise l'outil "Sélecteur de version Node.js" dans le cPanel.

1.  **Build local** :
    ```bash
    cd backend
    npm run build
    ```
2.  **Transfert** : Copiez les dossiers `dist`, `node_modules` (ou faites un `npm install` sur le serveur), `package.json` et le fichier `.env` dans un dossier sur votre hébergement (ex: `~/api.cuistot.family`).
3.  **Configuration cPanel** :
    *   Allez dans "Sélecteur de version Node.js".
    *   Créez une nouvelle application.
    *   **Version Node** : 20.x ou plus.
    *   **Application mode** : Production.
    *   **Application root** : Le chemin de votre dossier backend.
    *   **Application URL** : L'URL de votre API (ex: `api.cuistot.family`).
    *   **Application startup file** : `dist/main.js`.
4.  **Base de données** :
    *   Créez une base de données PostgreSQL (ou MySQL si vous avez adapté TypeORM) via cPanel.
    *   Mettez à jour le fichier `.env` avec les accès fournis par o2switch.

## 2. Préparation du Frontend (Angular)

1.  **Configuration de l'URL API** :
    Assurez-vous que `frontend/src/app/core/services/recipes.ts` (et les autres services) pointent vers l'URL de production de votre API.
2.  **Build** :
    ```bash
    cd frontend
    npm run build
    ```
3.  **Transfert** : Copiez le contenu du dossier `frontend/dist/frontend/browser` dans le dossier `public_html` (ou un sous-domaine) de votre hébergement.
4.  **Fichier .htaccess** :
    Pour que le routage Angular fonctionne, créez un fichier `.htaccess` dans le dossier du frontend :
    ```apache
    <IfModule mod_rewrite.c>
      RewriteEngine On
      RewriteBase /
      RewriteRule ^index\.html$ - [L]
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteRule . /index.html [L]
    </IfModule>
    ```

## 3. Service Lia (IA)

L'erreur 500 actuelle est probablement due à l'absence de clé API ou à une restriction réseau sur votre environnement local.
*   Sur o2switch, assurez-vous que les variables d'environnement (comme `OPENAI_API_KEY`) sont bien définies dans le sélecteur Node.js.
*   Vérifiez les logs de l'application dans le cPanel pour identifier la cause exacte de la 500.

## 4. Envoi d'Emails

Pour que l'envoi d'emails fonctionne sur o2switch :
*   Utilisez le serveur SMTP de votre hébergement (ex: `mail.votre-domaine.com`).
*   Configurez les variables SMTP dans le `.env` du backend.
