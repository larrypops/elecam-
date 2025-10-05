'use client';

import type { ReactNode } from 'react';
import { createContext, useState, useEffect } from 'react';
import type { ElectionResult, PollingStation, Candidate, Election, User } from '@/lib/types';
import { supabase } from '@/lib/supabase';  // Nouveau

interface DataContextType {
  results: ElectionResult[];
  stations: PollingStation[];
  candidates: Candidate[];
  elections: Election[];
  users: User[];
  addResult: (newResult: Omit<ElectionResult, 'id' | 'timestamp' | 'submittedBy'>, submittedBy: string) => void;
  addStation: (newStation: Omit<PollingStation, 'id'>) => void;
  addCandidate: (newCandidate: Omit<Candidate, 'id'>) => void;
  addElection: (newElection: Omit<Election, 'id'>) => void;
  addUser: (newUser: Omit<User, 'id' | 'avatar' | 'password'> & { password?: string }) => void;
  loading: boolean;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial data (Omit id pour insert)
const initialElections: Omit<Election, 'id'>[] = [
  { name: 'Présidentielle 2025', date: '2025-10-12T00:00:00.000Z' },
];

const initialStations: Omit<PollingStation, 'id'>[] = [
  { name: 'Bureau de vote central de Yaoundé', city: 'Yaoundé', district: 'Yaoundé I' },
  { name: 'Bureau portuaire de Douala', city: 'Douala', district: 'Douala IV' },
  { name: 'Bureau des hauts plateaux de Bamenda', city: 'Bamenda', district: 'Bamenda II' },
  { name: 'Poste nord de Garoua', city: 'Garoua', district: 'Garoua III' },
];

const initialCandidates: Omit<Candidate, 'id'>[] = [
  { electionId: 'elec-1', name: 'Candidat A', party: "Parti Démocratique", photoUrl: 'https://picsum.photos/seed/1/200/200' },
  { electionId: 'elec-1', name: 'Candidat B', party: "Parti de l'Union", photoUrl: 'https://picsum.photos/seed/2/200/200' },
  { electionId: 'elec-1', name: 'Candidat C', party: 'Mouvement du Peuple', photoUrl: 'https://picsum.photos/seed/3/200/200' },
];

const initialResults: Omit<ElectionResult, 'id' | 'timestamp' | 'submittedBy'>[] = [];

const initialUsers: Omit<User, 'id' | 'avatar'>[] = [
  { name: 'Super Administrateur', email: 'superadmin@elections.com', role: 'Super Admin', password: 'password123' },
  { name: 'Larry Effa', email: 'larryeffa17@gmail.com', role: 'Super Admin', password: 'password123' },
  { name: 'Admin', email: 'admin@admin.com', role: 'Super Admin', password: 'Pops2356/' },
  { name: 'Agent de Bureau Yaoundé', email: 'station@elections.com', role: 'Bureau de Vote', password: 'password123', pollingStationId: 'ps-1' },
  { name: 'Admin Douala', email: 'admin@elections.com', role: 'Admin', password: 'password123', pollingStationId: 'ps-2' },
  { name: 'Observateur National', email: 'viewer@elections.com', role: 'Observateur', password: 'password123' },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<ElectionResult[]>([]);
  const [stations, setStations] = useState<PollingStation[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();

    // Realtime pour auto-refresh (équiv. onSnapshot)
    const tables = ['elections', 'stations', 'candidates', 'results', 'users'];
    const channels = tables.map(table => {
      return supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => loadAllData())
        .subscribe();
    });

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Users
      let { data: fetchedUsers } = await supabase.from('users').select('*');
      if (!fetchedUsers?.length) {
        const { error } = await supabase.from('users').insert(initialUsers.map(u => ({ ...u, id: `user-${Date.now() + Math.random()}` })));
        if (error) console.error('Erreur insert users:', error);
        else ({ data: fetchedUsers } = await supabase.from('users').select('*'));
      }
      setUsers((fetchedUsers || []).map(u => ({ ...u, avatar: u.avatar || `https://i.pravatar.cc/150?u=${u.id}` })));

      // Elections
      let { data: fetchedElections } = await supabase.from('elections').select('*');
      if (!fetchedElections?.length) {
        const { error } = await supabase.from('elections').insert(initialElections.map(e => ({ ...e, id: `elec-${Date.now() + Math.random()}` })));
        if (error) console.error('Erreur insert elections:', error);
        else ({ data: fetchedElections } = await supabase.from('elections').select('*'));
      }
      setElections(fetchedElections || []);

      // Stations
      let { data: fetchedStations } = await supabase.from('stations').select('*');
      if (!fetchedStations?.length) {
        const { error } = await supabase.from('stations').insert(initialStations.map(s => ({ ...s, id: `ps-${Date.now() + Math.random()}` })));
        if (error) console.error('Erreur insert stations:', error);
        else ({ data: fetchedStations } = await supabase.from('stations').select('*'));
      }
      setStations(fetchedStations || []);

      // Candidates
      let { data: fetchedCandidates } = await supabase.from('candidates').select('*');
      if (!fetchedCandidates?.length) {
        const { error } = await supabase.from('candidates').insert(initialCandidates.map(c => ({ ...c, id: `cand-${Date.now() + Math.random()}` })));
        if (error) console.error('Erreur insert candidates:', error);
        else ({ data: fetchedCandidates } = await supabase.from('candidates').select('*'));
      }
      setCandidates(fetchedCandidates || []);

      // Results
      let { data: fetchedResults } = await supabase.from('results').select('*').order('timestamp', { ascending: false });
      if (!fetchedResults?.length) {
        const mockData = initialResults.map((r, i) => ({
          ...r,
          id: `result-${i+1}`,
          timestamp: new Date(Date.now() - (i * 1000 * 60 * 60 * 24)).toISOString(),
          submittedBy: 'Système'
        }));
        const { error } = await supabase.from('results').insert(mockData.map((m, index) => ({ ...m, id: `result-mock-${index}` })));
        if (error) console.error('Erreur insert results:', error);
        else ({ data: fetchedResults } = await supabase.from('results').select('*').order('timestamp', { ascending: false }));
      }
      setResults(fetchedResults || []);
    } catch (error) {
      console.error('Erreur load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (newUser: Omit<User, 'id' | 'avatar' | 'password'> & { password?: string }) => {
    const fullUser = {
      ...newUser,
      password: newUser.password || 'password123',
      id: `user-${Date.now()}`,
    };
    const { data, error } = await supabase.from('users').insert(fullUser).select().single();
    if (error) console.error('Erreur add user:', error);
    else setUsers(prev => [...prev, { ...data, avatar: `https://i.pravatar.cc/150?u=${data.id}` }]);
  };

  const addResult = async (newResult: Omit<ElectionResult, 'id' | 'timestamp' | 'submittedBy'>, submittedBy: string) => {
    const fullResult = {
      ...newResult,
      id: `result-${Date.now()}`,
      timestamp: new Date().toISOString(),
      submittedBy,
    };
    const { data, error } = await supabase.from('results').insert(fullResult).select().single();
    if (error) console.error('Erreur add result:', error);
    else setResults(prev => [...prev, data]);
  };

  const addStation = async (newStation: Omit<PollingStation, 'id'>) => {
    const fullStation = { ...newStation, id: `ps-${Date.now()}` };
    const { data, error } = await supabase.from('stations').insert(fullStation).select().single();
    if (error) console.error('Erreur add station:', error);
    else setStations(prev => [...prev, data]);
  };

  const addCandidate = async (newCandidate: Omit<Candidate, 'id'>) => {
    const fullCandidate = { ...newCandidate, id: `cand-${Date.now()}` };
    const { data, error } = await supabase.from('candidates').insert(fullCandidate).select().single();
    if (error) console.error('Erreur add candidate:', error);
    else setCandidates(prev => [...prev, data]);
  };

  const addElection = async (newElection: Omit<Election, 'id'>) => {
    const fullElection = { ...newElection, id: `elec-${Date.now()}` };
    const { data, error } = await supabase.from('elections').insert(fullElection).select().single();
    if (error) console.error('Erreur add election:', error);
    else setElections(prev => [...prev, data]);
  };

  const value = { results, stations, candidates, elections, users, addUser, addResult, addStation, addCandidate, addElection, loading };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
