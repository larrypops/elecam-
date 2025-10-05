export type Role = 'Super Admin' | 'Admin' | 'Bureau de Vote' | 'Observateur';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  password?: string;
  pollingStationId?: string;
  electionId?: string;
};

export type Election = {
  id: string;
  name: string;
  date: string; // ISO date string
};

export type Candidate = {
  id: string;
  electionId: string;
  name: string;
  party: string;
  photoUrl: string;
};

export type CandidateResult = {
  name: string;
  votes: number;
};

export type ReportInfo = {
    name: string;
    type: string;
    dataUri: string;
}

export type ElectionResult = {
  id:string;
  electionId: string;
  pollingStation: string;
  registeredVoters: number;
  turnout: number;
  candidateResults: CandidateResult[];
  invalidBallots: number;
  blankBallots: number;
  timestamp: string;
  submittedBy: string;
  reportInfo?: ReportInfo;
};

export type PollingStation = {
  id: string;
  name: string;
  city: string;
  district: string;
};
