'use client';

import { useData } from '@/hooks/use-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { fr } from 'date-fns/locale';
import { Paperclip } from 'lucide-react';


export default function HistoryPage() {
  const { results, elections, loading, stations } = useData();
  const { user } = useAuth();
  
  const displayedResults = useMemo(() => {
    if ((user?.role === 'Admin' || user?.role === 'Bureau de Vote') && user.pollingStationId) {
        const userStation = stations.find(s => s.id === user.pollingStationId);
        if (userStation) {
            return results.filter(r => r.pollingStation === userStation.name);
        }
        return [];
    }
    return results;
  }, [user, results, stations]);
  
  const sortedResults = [...displayedResults].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getElectionName = (electionId: string) => {
    return elections.find(e => e.id === electionId)?.name || 'Inconnue';
  };
  
  const enrichedResults = useMemo(() => {
    return sortedResults.map(result => {
        const validVotes = result.candidateResults.reduce((sum, c) => sum + c.votes, 0);
        const turnoutRate = result.registeredVoters > 0 ? (result.turnout / result.registeredVoters) * 100 : 0;
        return {
            ...result,
            validVotes,
            turnoutRate
        }
    })
  }, [sortedResults])

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Historique des entrées</h1>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Piste d'audit</CardTitle>
          <CardDescription>
             {user?.role === 'Admin' || user?.role === 'Bureau de Vote'
              ? 'Un journal de toutes les soumissions de données pour votre bureau de vote.'
              : 'Un journal de toutes les soumissions de données électorales avec horodatage.'
             }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bureau de vote / Élection</TableHead>
                  <TableHead>Inscrits</TableHead>
                  <TableHead>Participation</TableHead>
                  <TableHead>Votes Valides</TableHead>
                  <TableHead>Nuls & Blancs</TableHead>
                  <TableHead>Procès-verbal</TableHead>
                  <TableHead>Soumis par</TableHead>
                  <TableHead className="text-right">Horodatage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-32 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : enrichedResults.length > 0 ? (
                  enrichedResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className='font-medium'>
                        <div>{result.pollingStation}</div>
                        <div className='text-xs text-muted-foreground'>{getElectionName(result.electionId)}</div>
                      </TableCell>
                      <TableCell>{result.registeredVoters.toLocaleString()}</TableCell>
                      <TableCell>
                        <div>{result.turnout.toLocaleString()}</div>
                        <Badge variant={result.turnoutRate < 60 ? 'destructive' : 'secondary'}>{result.turnoutRate.toFixed(1)}%</Badge>
                      </TableCell>
                      <TableCell>{result.validVotes.toLocaleString()}</TableCell>
                      <TableCell>{(result.invalidBallots + result.blankBallots).toLocaleString()}</TableCell>
                      <TableCell>
                        {result.reportInfo?.dataUri ? (
                          <a 
                            href={result.reportInfo.dataUri} 
                            download={result.reportInfo.name}
                            className="flex items-center gap-2 text-sm text-primary hover:underline" 
                            title={result.reportInfo.name}
                          >
                            <Paperclip className="h-4 w-4" />
                            <span className="truncate max-w-24">{result.reportInfo.name}</span>
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{result.submittedBy}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {format(new Date(result.timestamp), "PPp", { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      Aucun résultat n'a encore été soumis.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
