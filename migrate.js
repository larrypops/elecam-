// Script de migration pour insérer les données initiales dans Supabase
// Usage: node migrate.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement depuis .env.local
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      envLines.forEach(line => {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split('=');
          if (key && value) {
            process.env[key.trim()] = value.trim();
          }
        }
      });
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement de .env.local:', error.message);
  }
}

// Charger les variables d'environnement
loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Assurez-vous d\'avoir configuré dans .env.local:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Vérifiez que le fichier .env.local existe et contient ces variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Données initiales
const initialElections = [
  { name: 'Présidentielle 2025', date: '2025-10-12T00:00:00.000Z' },
];

const initialStations = [
  { name: 'Bureau de vote central de Yaoundé', city: 'Yaoundé', district: 'Yaoundé I' },
  { name: 'Bureau portuaire de Douala', city: 'Douala', district: 'Douala IV' },
  { name: 'Bureau des hauts plateaux de Bamenda', city: 'Bamenda', district: 'Bamenda II' },
  { name: 'Poste nord de Garoua', city: 'Garoua', district: 'Garoua III' },
];

const initialUsers = [
  { 
    name: 'Super Administrateur', 
    email: 'superadmin@elections.com', 
    role: 'Super Admin',
    password: 'Password123!' // À changer après la première connexion
  },
  { 
    name: 'Larry Effa', 
    email: 'larryeffa17@gmail.com', 
    role: 'Super Admin',
    password: 'Password123!'
  },
  { 
    name: 'Admin', 
    email: 'admin@admin.com', 
    role: 'Super Admin',
    password: 'Pops2356/'
  },
  { 
    name: 'Agent de Bureau Yaoundé', 
    email: 'station@elections.com', 
    role: 'Bureau de Vote',
    password: 'Password123!'
  },
  { 
    name: 'Admin Douala', 
    email: 'admin@elections.com', 
    role: 'Admin',
    password: 'Password123!'
  },
  { 
    name: 'Observateur National', 
    email: 'viewer@elections.com', 
    role: 'Observateur',
    password: 'Password123!'
  },
];

async function migrate() {
  console.log('🚀 Début de la migration...');

  try {
    // 1. Créer les élections
    console.log('📋 Création des élections...');
    const { data: elections, error: electionsError } = await supabase
      .from('elections')
      .insert(initialElections)
      .select();

    if (electionsError) {
      console.error('❌ Erreur création élections:', electionsError);
      return;
    }

    console.log(`✅ ${elections.length} élection(s) créée(s)`);

    // 2. Créer les bureaux de vote
    console.log('🏛️ Création des bureaux de vote...');
    const { data: stations, error: stationsError } = await supabase
      .from('stations')
      .insert(initialStations)
      .select();

    if (stationsError) {
      console.error('❌ Erreur création stations:', stationsError);
      return;
    }

    console.log(`✅ ${stations.length} bureau(x) de vote créé(s)`);

    // 3. Créer les utilisateurs dans Auth et dans la table users
    console.log('👥 Création des utilisateurs...');
    
    for (const userData of initialUsers) {
      console.log(`   Création de ${userData.name}...`);
      
      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role
        }
      });

      if (authError) {
        console.error(`   ❌ Erreur création auth pour ${userData.name}:`, authError.message);
        continue;
      }

      // Créer l'utilisateur dans la table users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          avatar: `https://i.pravatar.cc/150?u=${authData.user.id}`
        });

      if (userError) {
        console.error(`   ❌ Erreur création user pour ${userData.name}:`, userError.message);
      } else {
        console.log(`   ✅ ${userData.name} créé avec succès`);
      }
    }

    // 4. Créer les candidats (après avoir les IDs des élections)
    if (elections.length > 0) {
      const electionId = elections[0].id;
      console.log('🎭 Création des candidats...');
      
      const initialCandidates = [
        { election_id: electionId, name: 'Candidat A', party: "Parti Démocratique", photo_url: 'https://picsum.photos/seed/1/200/200' },
        { election_id: electionId, name: 'Candidat B', party: "Parti de l'Union", photo_url: 'https://picsum.photos/seed/2/200/200' },
        { election_id: electionId, name: 'Candidat C', party: 'Mouvement du Peuple', photo_url: 'https://picsum.photos/seed/3/200/200' },
      ];

      const { data: candidates, error: candidatesError } = await supabase
        .from('candidates')
        .insert(initialCandidates)
        .select();

      if (candidatesError) {
        console.error('❌ Erreur création candidats:', candidatesError);
      } else {
        console.log(`✅ ${candidates.length} candidat(s) créé(s)`);
      }
    }

    console.log('\n🎉 Migration terminée avec succès!');
    console.log('\n📋 Identifiants de test:');
    console.log('   Super Admin: superadmin@elections.com / Password123!');
    console.log('   Larry Effa: larryeffa17@gmail.com / Password123!');
    console.log('   Admin: admin@admin.com / Pops2356/');
    console.log('\n⚠️  IMPORTANT: Changez les mots de passe après la première connexion!');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}

migrate();
