#!/bin/bash

# Script de configuration automatique pour VPS
# Usage: ./setup_vps.sh

echo "🚀 Configuration automatique du VPS pour Élections Camer"

# Vérifier si le fichier .env.local existe déjà
if [ -f ".env.local" ]; then
    echo "⚠️  Le fichier .env.local existe déjà"
    read -p "Voulez-vous le remplacer? (y/n): " replace_env
    if [ "$replace_env" != "y" ]; then
        echo "❌ Arrêt du script"
        exit 1
    fi
fi

# Créer le fichier .env.local
cat > .env.local << EOF
# Configuration Supabase Cloud
NEXT_PUBLIC_SUPABASE_URL=https://loemzeqcmxchkpxfqwpl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZW16ZXFjbXhjaGtweGZxd3BsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0OTU2MjcsImV4cCI6MjA3NTA3MTYyN30.h-oBxIua33uIBPUWKEf8Jlr9gEThAYaKk-_lp7kDQHg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZW16ZXFjbXhjaGtweGZxd3BsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQ5NTYyNywiZXhwIjoyMDc1MDcxNjI3fQ.KdTIfvom0t8gzugf-gDUWUOpuaZfWw7wt3L-dWVHheE
EOF

echo "✅ Fichier .env.local créé avec succès"

# Installation des dépendances
echo "📦 Installation des dépendances Node.js..."
npm install

# Vérifier si la migration peut être exécutée
echo "🔍 Vérification de la configuration..."
if [ -f ".env.local" ]; then
    echo "✅ Fichier .env.local trouvé"
    echo "🚀 Lancement de la migration..."
    node migrate.js
else
    echo "❌ Erreur: Fichier .env.local non trouvé"
    exit 1
fi

echo "🎉 Configuration terminée!"
echo "📋 Prochaines étapes:"
echo "   1. npm run build"
echo "   2. pm2 start ecosystem.config.js"
echo "   3. Configurer Nginx"
