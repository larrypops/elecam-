-- Schéma SQL complet pour Élections Camer avec RLS
-- À exécuter dans l'éditeur SQL de Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des élections
CREATE TABLE elections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des bureaux de vote
CREATE TABLE stations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des candidats
CREATE TABLE candidates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  party TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des résultats électoraux
CREATE TABLE results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  election_id UUID REFERENCES elections(id) ON DELETE CASCADE,
  polling_station TEXT NOT NULL,
  registered_voters INTEGER NOT NULL,
  turnout INTEGER NOT NULL,
  candidate_results JSONB NOT NULL, -- Stocke les résultats par candidat
  invalid_ballots INTEGER DEFAULT 0,
  blank_ballots INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_by TEXT NOT NULL,
  report_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des utilisateurs (liée à Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Admin', 'Bureau de Vote', 'Observateur')),
  avatar TEXT,
  polling_station_id UUID REFERENCES stations(id),
  election_id UUID REFERENCES elections(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour elections
CREATE POLICY "Tout le monde peut voir les élections" ON elections
  FOR SELECT USING (true);

CREATE POLICY "Seuls les admins peuvent créer des élections" ON elections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Super Admin', 'Admin')
    )
  );

CREATE POLICY "Seuls les admins peuvent modifier les élections" ON elections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Super Admin', 'Admin')
    )
  );

-- Politiques RLS pour stations
CREATE POLICY "Tout le monde peut voir les bureaux de vote" ON stations
  FOR SELECT USING (true);

CREATE POLICY "Seuls les admins peuvent gérer les bureaux de vote" ON stations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Super Admin', 'Admin')
    )
  );

-- Politiques RLS pour candidates
CREATE POLICY "Tout le monde peut voir les candidats" ON candidates
  FOR SELECT USING (true);

CREATE POLICY "Seuls les admins peuvent gérer les candidats" ON candidates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Super Admin', 'Admin')
    )
  );

-- Politiques RLS pour results
CREATE POLICY "Tout le monde peut voir les résultats" ON results
  FOR SELECT USING (true);

CREATE POLICY "Les agents de bureau peuvent soumettre des résultats" ON results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Super Admin', 'Admin', 'Bureau de Vote')
    )
  );

CREATE POLICY "Seuls les admins peuvent modifier les résultats" ON results
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Super Admin', 'Admin')
    )
  );

-- Politiques RLS pour users
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Les admins peuvent voir tous les utilisateurs" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('Super Admin', 'Admin')
    )
  );

CREATE POLICY "Seuls les super admins peuvent créer des utilisateurs" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Super Admin'
    )
  );

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Index pour améliorer les performances
CREATE INDEX idx_candidates_election_id ON candidates(election_id);
CREATE INDEX idx_results_election_id ON results(election_id);
CREATE INDEX idx_results_timestamp ON results(timestamp DESC);
CREATE INDEX idx_users_role ON users(role);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion des données initiales (à exécuter après avoir créé les utilisateurs dans Auth)
-- Note: Les utilisateurs doivent d'abord être créés dans Supabase Auth
-- puis leurs IDs doivent être utilisés ici

-- Exemple d'insertion (remplacer les UUID par les vrais IDs des utilisateurs Auth):
/*
INSERT INTO elections (id, name, date) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Présidentielle 2025', '2025-10-12T00:00:00Z');

INSERT INTO stations (id, name, city, district) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Bureau de vote central de Yaoundé', 'Yaoundé', 'Yaoundé I'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Bureau portuaire de Douala', 'Douala', 'Douala IV');

INSERT INTO candidates (election_id, name, party, photo_url) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Candidat A', 'Parti Démocratique', 'https://picsum.photos/seed/1/200/200'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Candidat B', 'Parti de l''Union', 'https://picsum.photos/seed/2/200/200');
*/
