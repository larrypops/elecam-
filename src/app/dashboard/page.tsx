'use client';

import { useMemo, useState, useEffect } from 'react';
import { useData } from '@/hooks/use-data';
import { KpiCard } from '@/components/kpi-card';
import { ResultsAnalysis } from '@/components/results-analysis';
import { Users, Percent, CheckSquare, Vote, FileX, FileQuestion } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailedResultsTable } from '@/components/detailed-results-table';
import type { ElectionResult } from '@/lib/types';

type AggregatedCandidate = {
  name: string;
  party: string;
  photoUrl: string;
  votes: number;
};

type DashboardMetrics = {
  totalRegistered: number;
  totalTurnout: number;
  turnoutPercentage: string;
  totalSubmissions: number;
  candidateTotals: AggregatedCandidate[];
  totalInvalidBallots: number;
  totalBlankBallots: number;
  totalValidVotes: number;
  filteredResultsForTable: ElectionResult[];
};

export default function DashboardPage() {
  const { results, elections, loading, candidates, stations } = useData();
  const [selectedElectionId, setSelectedElectionId] = useState<string>('all');
  
  useEffect(() => {
    if (elections.length > 0 && selectedElectionId === 'all') {
      if (elections.length === 1) {
        setSelectedElectionId(elections[0].id);
      }
    } else if (elections.length > 0 && !elections.find(e => e.id === selectedElectionId)) {
      setSelectedElectionId('all');
    }
  }, [elections, selectedElectionId]);

  const { 
    totalRegistered, 
    totalTurnout, 
    turnoutPercentage, 
    totalSubmissions, 
    candidateTotals,
    totalInvalidBallots,
    totalBlankBallots,
    totalValidVotes,
    filteredResultsForTable,
  }: DashboardMetrics = useMemo(() => {
    const filteredResults = selectedElectionId === 'all'
      ? results
      : results.filter(r => r.electionId === selectedElectionId);

    // Deduplicate results, keeping only the latest submission per polling station
    const latestResultsMap = new Map<string, ElectionResult>();
    for (const result of filteredResults) {
      const key = result.pollingStation;
      const existing = latestResultsMap.get(key);
      if (!existing || new Date(result.timestamp) > new Date(existing.timestamp)) {
        latestResultsMap.set(key, result);
      }
    }
    const latestResults = Array.from(latestResultsMap.values());
    const filteredResultsForTable = latestResults;

    const metrics = latestResults.reduce(
      (acc, r) => {
        acc.totalRegistered += r.registeredVoters;
        acc.totalTurnout += r.turnout;
        acc.totalInvalidBallots += r.invalidBallots;
        acc.totalBlankBallots += r.blankBallots;
        
        r.candidateResults.forEach(cr => {
          acc.candidateVoteMap.set(cr.name, (acc.candidateVoteMap.get(cr.name) || 0) + cr.votes);
        });

        return acc;
      },
      {
        totalRegistered: 0,
        totalTurnout: 0,
        totalInvalidBallots: 0,
        totalBlankBallots: 0,
        candidateVoteMap: new Map<string, number>(),
      }
    );

    const turnoutPercentage = metrics.totalRegistered > 0 
      ? ((metrics.totalTurnout / metrics.totalRegistered) * 100).toFixed(2) 
      : '0.00';
      
    const totalValidVotes = Math.max(0, metrics.totalTurnout - metrics.totalInvalidBallots - metrics.totalBlankBallots);

    const relevantCandidates = selectedElectionId === 'all' 
      ? candidates 
      : candidates.filter(c => c.electionId === selectedElectionId);
      
    const candidateTotals = relevantCandidates
      .map(c => ({
        name: c.name,
        party: c.party,
        photoUrl: c.photoUrl,
        votes: metrics.candidateVoteMap.get(c.name) || 0,
      }))
      .sort((a, b) => b.votes - a.votes);

    return {
      totalRegistered: metrics.totalRegistered,
      totalTurnout: metrics.totalTurnout,
      turnoutPercentage,
      totalSubmissions: latestResultsMap.size,
      candidateTotals,
      totalInvalidBallots: metrics.totalInvalidBallots,
      totalBlankBallots: metrics.totalBlankBallots,
      totalValidVotes,
      filteredResultsForTable,
    };
  }, [results, selectedElectionId, candidates, stations]);


  const handleElectionChange = (electionId: string) => {
    setSelectedElectionId(electionId);
  };
  
  const getElectionName = (electionId: string) => {
    if (electionId === 'all') return 'Toutes les élections';
    return elections.find(e => e.id === electionId)?.name || 'Élection inconnue';
  };
  
  const candidatesForTable = useMemo(() => {
    return selectedElectionId === 'all'
      ? []
      : candidates.filter(c => c.electionId === selectedElectionId);
  }, [selectedElectionId, candidates]);


  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  const totalStations = stations.length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Affichage des résultats pour : <span className="font-semibold text-primary">{getElectionName(selectedElectionId)}</span>
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Select onValueChange={handleElectionChange} value={selectedElectionId}>
            <SelectTrigger className="w-full sm:w-72">
              <SelectValue placeholder="Filtrer par élection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les élections</SelectItem>
              {elections.map((election) => (
                <SelectItem key={election.id} value={election.id}>
                  {election.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          title="Électeurs inscrits"
          value={totalRegistered.toLocaleString()}
          description="Total des électeurs pour la sélection"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Participation"
          value={totalTurnout.toLocaleString()}
          description="Nombre total de votants"
          icon={<Vote className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Taux de participation"
          value={`${turnoutPercentage}%`}
          description="Pourcentage d'électeurs ayant voté"
          icon={<Percent className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Bureaux rapportés"
          value={`${totalSubmissions.toLocaleString()} / ${totalStations.toLocaleString()}`}
          description="Bureaux ayant soumis leurs résultats"
          icon={<CheckSquare className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Bulletins nuls"
          value={totalInvalidBallots.toLocaleString()}
          description="Total des bulletins déclarés nuls"
          icon={<FileX className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Bulletins blancs"
          value={totalBlankBallots.toLocaleString()}
          description="Total des bulletins blancs"
          icon={<FileQuestion className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {selectedElectionId !== 'all' && candidateTotals.length > 0 ? (
        <ResultsAnalysis 
          candidateData={candidateTotals} 
          totalValidVotes={totalValidVotes} 
        />
      ) : (
        <Card className="flex items-center justify-center min-h-[400px] shadow-sm">
          <p className="text-muted-foreground text-center">
            {selectedElectionId === 'all' 
              ? 'Veuillez sélectionner une élection pour voir l\'analyse des candidats.' 
              : 'Aucune donnée de candidat disponible pour l\'élection sélectionnée.'}
          </p>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Résultats Détaillés par Bureau de Vote</CardTitle>
          <CardDescription>
            Analyse approfondie pour l'élection sélectionnée. Cliquez sur les en-têtes de colonne pour trier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredResultsForTable.length > 0 && selectedElectionId !== 'all' ? (
            <DetailedResultsTable
              results={filteredResultsForTable}
              stations={stations}
              candidates={candidatesForTable}
            />
          ) : (
            <div className="text-center h-48 flex items-center justify-center">
              <p className="text-muted-foreground">
                {selectedElectionId === 'all' 
                  ? 'Veuillez sélectionner une élection pour voir les résultats détaillés.' 
                  : 'Aucune donnée de résultat pour la sélection actuelle.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
