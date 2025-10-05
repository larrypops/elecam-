# Guide de Déploiement VPS - Élections Camer

## 📋 Prérequis

- VPS avec Ubuntu 20.04+ (2GB RAM minimum)
- Accès SSH au VPS
- Node.js 18+ installé
- Nginx installé
- PM2 installé
- Projet Supabase Cloud configuré

## 🚀 Étapes de Déploiement

### 1. Préparation du VPS

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation des dépendances
sudo apt install -y curl git nginx

# Installation de Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation de PM2
sudo npm install -g pm2
```

### 2. Clonage du Projet

```bash
# Se connecter au VPS via SSH
ssh root@votre-ip-vps

# Cloner le repository
git clone https://github.com/larrypops/elecam-.git
cd elecam-

# Installation des dépendances
npm install
```

### 3. Configuration de l'Environnement

```bash
# Créer le fichier .env.local
nano .env.local
```

Contenu du fichier `.env.local` :
```env
# Configuration Supabase Cloud
NEXT_PUBLIC_SUPABASE_URL=https://loemzeqcmxchkpxfqwpl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZW16ZXFjbXhjaGtweGZxd3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTU2MjcsImV4cCI6MjA3NTA3MTYyN30.h-oBxIua33uIBPUWKEf8Jlr9gEThAYaKk-_lp7kDQHg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZW16ZXFjbXhjaGtweGZxd3BsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5NTYyNywiZXhwIjoyMDc1MDcxNjI3fQ.KdTIfvom0t8gzugf-gDUWUOpuaZfWw7wt3L-dWVHheE
```

### 4. Configuration de la Base de Données

1. **Accéder à Supabase Dashboard** : https://supabase.com/dashboard
2. **Exécuter le schéma SQL** :
   - Aller dans l'éditeur SQL
   - Copier le contenu de `supabase_schema.sql`
   - Exécuter le script

3. **Migration des données** :
```bash
# Sur le VPS
node migrate.js
```

### 5. Build de Production

```bash
# Build de l'application
npm run build
```

### 6. Démarrage avec PM2

```bash
# Créer le fichier de configuration PM2
nano ecosystem.config.js
```

Contenu de `ecosystem.config.js` :
```javascript
module.exports = {
  apps: [{
    name: 'elections-camer',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 9002
    },
    instances: 1,
    exec_mode: 'fork'
  }]
}
```

```bash
# Démarrer avec PM2
pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
pm2 save

# Configurer PM2 pour démarrer au boot
pm2 startup
```

### 7. Configuration Nginx

```bash
# Créer le fichier de configuration Nginx
sudo nano /etc/nginx/sites-available/elections-camer
```

Contenu du fichier Nginx :
```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    location / {
        proxy_pass http://localhost:9002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/elections-camer /etc/nginx/sites-enabled/

# Tester la configuration Nginx
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

### 8. Configuration SSL (Optionnel mais Recommandé)

```bash
# Installation de Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtenir un certificat SSL
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

### 9. Configuration Supabase Auth

1. **Aller dans Supabase Dashboard** → **Authentication** → **URL Configuration**
2. **Ajouter les URLs autorisées** :
   - `http://votre-domaine.com`
   - `https://votre-domaine.com`
   - `http://votre-domaine.com/dashboard`
   - `https://votre-domaine.com/dashboard`

### 10. Test Final

1. **Accéder à l'application** : `https://votre-domaine.com`
2. **Tester la connexion** avec :
   - Email: `superadmin@elections.com`
   - Mot de passe: `Password123!`

## 🔧 Maintenance

### Mises à Jour

```bash
# Se connecter au VPS
ssh root@votre-ip-vps

# Aller dans le dossier du projet
cd elecam-

# Pull des dernières modifications
git pull origin main

# Réinstaller les dépendances si nécessaire
npm install

# Rebuild
npm run build

# Redémarrer PM2
pm2 restart elections-camer
```

### Monitoring

```bash
# Voir les logs
pm2 logs elections-camer

# Statut des applications
pm2 status

# Monitoring en temps réel
pm2 monit
```

## 🛠️ Dépannage

### Problèmes Courants

1. **Application ne démarre pas** :
   ```bash
   pm2 logs elections-camer
   # Vérifier les logs pour les erreurs
   ```

2. **Erreurs de base de données** :
   - Vérifier les variables d'environnement
   - Vérifier la connexion à Supabase

3. **Problèmes Nginx** :
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

### Sécurité

1. **Mettre à jour régulièrement** :
   ```bash
   sudo apt update && sudo apt upgrade
   ```

2. **Configurer le firewall** :
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 'Nginx Full'
   ```

## 📞 Support

En cas de problème, vérifiez :
1. Les logs PM2 : `pm2 logs elections-camer`
2. Les logs Nginx : `sudo journalctl -u nginx`
3. La configuration Supabase
