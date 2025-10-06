'use client';

import { useMemo, useState, useCallback } from 'react';
import type { ElectionResult, PollingStation, Candidate } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Assuming standard path; adjust if needed

type SortableKeys = 'pollingStation' | 'turnoutRate' | 'turnout' | 'registeredVoters' | string;

interface EnrichedResult extends ElectionResult {
  city: string;
  district: string;
  turnoutRate: number;
  validVotes: number;
  nullAndBlankPercentage: number;
  candidateScores: Record<string, { votes: number; percentage: number }>;
}

interface DetailedResultsTableProps {
  results: ElectionResult[];
  stations: PollingStation[];
  candidates: Candidate[];
}

function getTurnoutBadgeVariant(rate: number): 'default' | 'secondary' | 'destructive' {
  if (rate < 60) return 'destructive';
  if (rate < 70) return 'secondary';
  return 'default';
}

function compareValues(a: any, b: any, direction: 'ascending' | 'descending'): number {
  if (a < b) return direction === 'ascending' ? -1 : 1;
  if (a > b) return direction === 'ascending' ? 1 : -1;
  return 0;
}

function lexicalCompare(a: string, b: string, direction: 'ascending' | 'descending'): number {
  return direction === 'ascending'
    ? a.localeCompare(b)
    : b.localeCompare(a);
}

export function DetailedResultsTable({ results, stations, candidates }: DetailedResultsTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' }>({
    key: 'turnoutRate',
    direction: 'descending',
  });

  const candidateNames = useMemo(() => new Set(candidates.map(c => c.name)), [candidates]);

  const stationMap = useMemo(() => {
    const map = new Map<string, { city: string; district: string }>();
    stations.forEach(s => map.set(s.name, { city: s.city, district: s.district }));
    return map;
  }, [stations]);

  const enrichedResults = useMemo<EnrichedResult[]>(() => {
    return results.map(result => {
      const stationInfo = stationMap.get(result.pollingStation) ?? { city: 'N/A', district: 'N/A' };
      const turnoutRate = result.registeredVoters > 0 ? (result.turnout / result.registeredVoters) * 100 : 0;
      const validVotes = result.candidateResults.reduce((sum, c) => sum + (c.votes ?? 0), 0);
      const nullAndBlankPercentage = result.turnout > 0 
        ? ((result.invalidBallots + result.blankBallots) / result.turnout) * 100 
        : 0;
      
      const candidateScores: Record<string, { votes: number; percentage: number }> = {};
      candidates.forEach(c => {
        const candidateResult = result.candidateResults.find(cr => cr.name === c.name);
        const votes = candidateResult?.votes ?? 0;
        candidateScores[c.name] = {
          votes,
          percentage: validVotes > 0 ? (votes / validVotes) * 100 : 0,
        };
      });

      return {
        ...result,
        ...stationInfo,
        turnoutRate,
        validVotes,
        nullAndBlankPercentage,
        candidateScores,
      };
    });
  }, [results, stationMap, candidates]);

  const sortedResults = useMemo(() => {
    const isCandidateKey = candidateNames.has(sortConfig.key);

    return [...enrichedResults].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      if (isCandidateKey) {
        aValue = a.candidateScores[sortConfig.key]?.votes ?? 0;
        bValue = b.candidateScores[sortConfig.key]?.votes ?? 0;
      } else {
        aValue = a[sortConfig.key as keyof EnrichedResult] as number | string;
        bValue = b[sortConfig.key as keyof EnrichedResult] as number | string;
      }

      // Handle string comparison for pollingStation
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return lexicalCompare(aValue, bValue, sortConfig.direction);
      }

      // Numeric comparison otherwise
      return compareValues(aValue, bValue, sortConfig.direction);
    });
  }, [enrichedResults, sortConfig, candidateNames]);

  const requestSort = useCallback((key: SortableKeys) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  }, []);

  const getSortIndicator = useCallback((key: SortableKeys) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'descending' ? '▼' : '▲';
  }, [sortConfig]);

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => requestSort('pollingStation')}
                className="h-8 px-2"
                aria-label={`Trier par bureau de vote, ${sortConfig.key === 'pollingStation' ? (sortConfig.direction === 'ascending' ? 'croissant' : 'décroissant') : 'non trié'}`}
              >
                Bureau de Vote {getSortIndicator('pollingStation')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Localisation</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => requestSort('registeredVoters')}
                className="h-8 px-2 justify-end"
                aria-label={`Trier par inscrits, ${sortConfig.key === 'registeredVoters' ? (sortConfig.direction === 'ascending' ? 'croissant' : 'décroissant') : 'non trié'}`}
              >
                Inscrits {getSortIndicator('registeredVoters')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => requestSort('turnout')}
                className="h-8 px-2 justify-end"
                aria-label={`Trier par exprimés, ${sortConfig.key === 'turnout' ? (sortConfig.direction === 'ascending' ? 'croissant' : 'décroissant') : 'non trié'}`}
              >
                Exprimés {getSortIndicator('turnout')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => requestSort('turnoutRate')}
                className="h-8 px-2 justify-end"
                aria-label={`Trier par taux de participation, ${sortConfig.key === 'turnoutRate' ? (sortConfig.direction === 'ascending' ? 'croissant' : 'décroissant') : 'non trié'}`}
              >
                Taux Part. {getSortIndicator('turnoutRate')}
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Nuls/Blancs</TableHead>
            {candidates.map(candidate => (
              <TableHead key={candidate.id}>
                <Button
                  variant="ghost"
                  onClick={() => requestSort(candidate.name)}
                  className="h-8 px-2 justify-end"
                  aria-label={`Trier par ${candidate.name}, ${sortConfig.key === candidate.name ? (sortConfig.direction === 'ascending' ? 'croissant' : 'décroissant') : 'non trié'}`}
                >
                  {candidate.name} {getSortIndicator(candidate.name)}
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedResults.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.pollingStation}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {item.city}, {item.district}
              </TableCell>
              <TableCell className="text-right">{item.registeredVoters.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.turnout.toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <Badge 
                  variant={getTurnoutBadgeVariant(item.turnoutRate)} 
                  className="font-bold"
                >
                  {item.turnoutRate.toFixed(1)}%
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div>{(item.invalidBallots + item.blankBallots).toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">
                  ({item.nullAndBlankPercentage.toFixed(1)}%)
                </div>
              </TableCell>
              {candidates.map(candidate => {
                const score = item.candidateScores[candidate.name] ?? { votes: 0, percentage: 0 };
                return (
                  <TableCell key={candidate.id} className="text-right">
                    <div>{score.votes.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">({score.percentage.toFixed(1)}%)</div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
