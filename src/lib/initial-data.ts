import type { User, Election, Candidate, ElectionResult, PollingStation } from './types';

export const initialElections: Election[] = [
  {
    id: 'elec-pres-2025',
    name: 'Élection Présidentielle 2025',
    date: '2025-10-12T00:00:00.000Z',
  },
  {
    id: 'elec-leg-2025',
    name: 'Élections Législatives 2025',
    date: '2025-02-09T00:00:00.000Z',
  }
];

export const initialPollingStations: PollingStation[] = [
  {
    id: 'station-1',
    name: 'Bureau de vote central de Yaoundé',
    city: 'Yaoundé',
    district: 'Yaoundé I',
  },
  {
    id: 'station-2',
    name: 'Bureau portuaire de Douala',
    city: 'Douala',
    district: 'Douala I',
  },
  {
    id: 'station-3',
    name: 'Bureau des hauts plateaux de Bamenda',
    city: 'Bamenda',
    district: 'Bamenda II',
  },
  {
    id: 'station-4',
    name: 'Poste nord de Garoua',
    city: 'Garoua',
    district: 'Garoua III',
  },
];

export const initialUsers: User[] = [
  {
    id: 'user-superadmin',
    name: 'Super Admin',
    email: 'superadmin@elections.com',
    password: 'superpassword',
    role: 'Super Admin',
    avatar: 'https://i.pravatar.cc/150?u=superadmin',
  },
  {
    id: 'user-admin-yde',
    name: 'Admin Yaoundé',
    email: 'admin.yde@elections.com',
    password: 'adminpassword',
    role: 'Admin',
    avatar: 'https://i.pravatar.cc/150?u=admin.yde',
    pollingStationId: 'station-1',
  },
  {
    id: 'user-bv-yde',
    name: 'Agent Yaoundé',
    email: 'bv.yde@elections.com',
    password: 'bvpassword',
    role: 'Bureau de Vote',
    avatar: 'https://i.pravatar.cc/150?u=bv.yde',
    pollingStationId: 'station-1',
    electionId: 'elec-pres-2025',
  },
   {
    id: 'user-obs-yde',
    name: 'Observateur Yaoundé',
    email: 'obs.yde@elections.com',
    password: 'obspassword',
    role: 'Observateur',
    avatar: 'https://i.pravatar.cc/150?u=obs.yde',
    pollingStationId: 'station-1',
  },
   {
    id: 'user-bv-dla',
    name: 'Agent Douala',
    email: 'bv.dla@elections.com',
    password: 'bvpassword',
    role: 'Bureau de Vote',
    avatar: 'https://i.pravatar.cc/150?u=bv.dla',
    pollingStationId: 'station-2',
    electionId: 'elec-pres-2025',
  },
];

export const initialCandidates: Candidate[] = [
  {
    id: 'cand-1',
    electionId: 'elec-pres-2025',
    name: 'Aboubakar Kamara',
    party: 'Parti de l\'Unité Nationale (PUN)',
    photoUrl: `https://picsum.photos/seed/AboubakarKamara/200/200`
  },
  {
    id: 'cand-2',
    electionId: 'elec-pres-2025',
    name: 'Béatrice Komo',
    party: 'Rassemblement Démocratique (RD)',
     photoUrl: `https://picsum.photos/seed/BeatriceKomo/200/200`
  },
  {
    id: 'cand-3',
    electionId: 'elec-pres-2025',
    name: 'Charles N\'Goran',
    party: 'Mouvement pour le Progrès Social (MPS)',
     photoUrl: `https://picsum.photos/seed/CharlesNGoran/200/200`
  },
  {
    id: 'cand-leg-1',
    electionId: 'elec-leg-2025',
    name: 'Issa Traoré',
    party: 'Alliance des Patriotes (AP)',
    photoUrl: `https://picsum.photos/seed/IssaTraore/200/200`
  },
  {
    id: 'cand-leg-2',
    electionId: 'elec-leg-2025',
    name: 'Fatoumata Diop',
    party: 'Convergence Citoyenne (CC)',
    photoUrl: `https://picsum.photos/seed/FatoumataDiop/200/200`
  }
];

export const initialResults: ElectionResult[] = [
  {
    id: 'res-1',
    electionId: 'elec-pres-2025',
    pollingStation: 'Bureau de vote central de Yaoundé',
    registeredVoters: 7500,
    turnout: 5250,
    candidateResults: [
      { name: 'Aboubakar Kamara', votes: 2100 },
      { name: 'Béatrice Komo', votes: 1800 },
      { name: 'Charles N\'Goran', votes: 1250 },
    ],
    invalidBallots: 75,
    blankBallots: 25,
    timestamp: '2025-10-12T19:30:00.000Z',
    submittedBy: 'Admin Yaoundé',
  },
  {
    id: 'res-2',
    electionId: 'elec-pres-2025',
    pollingStation: 'Bureau portuaire de Douala',
    registeredVoters: 12000,
    turnout: 8400,
    candidateResults: [
      { name: 'Aboubakar Kamara', votes: 3200 },
      { name: 'Béatrice Komo', votes: 3800 },
      { name: 'Charles N\'Goran', votes: 1300 },
    ],
    invalidBallots: 80,
    blankBallots: 20,
    timestamp: '2025-10-12T20:00:00.000Z',
    submittedBy: 'Super Admin',
  },
];
