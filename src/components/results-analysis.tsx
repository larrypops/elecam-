'use client';

import * as React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface CandidateData {
  name: string;
  party: string;
  votes: number;
  photoUrl: string;
}

interface ResultsAnalysisProps {
  candidateData: CandidateData[];
  totalValidVotes: number;
}

const formatPercentage = (value: number, total: number) => {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
                <AvatarImage src={data.photoUrl} alt={data.name} />
                <AvatarFallback>{data.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-bold">{`${data.name} (${data.party})`}</p>
                <p className="text-sm text-muted-foreground">{`${data.votes.toLocaleString()} votes (${formatPercentage(data.votes, data.totalValidVotes)})`}</p>
            </div>
        </div>
      </div>
    );
  }
  return null;
};


export function ResultsAnalysis({ candidateData, totalValidVotes }: ResultsAnalysisProps) {
  const chartData = candidateData.slice(0, 5).map(c => ({ ...c, totalValidVotes })).reverse();

  return (
    <Card className="shadow-sm h-full flex flex-col">
      <CardHeader>
        <CardTitle>Analyse des Résultats</CardTitle>
        <CardDescription>Répartition des votes valides par candidat</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow space-y-6">
        {chartData.length > 0 ? (
          <>
            <div>
              <h3 className="text-lg font-medium mb-2">Classement des candidats (Top 5)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 40, left: 50, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                      width={100}
                      interval={0}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="votes" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                      <LabelList
                        dataKey="votes"
                        position="right"
                        formatter={(value: number) => value.toLocaleString()}
                        className="fill-foreground font-semibold"
                        fontSize={12}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex-grow">
              <h3 className="text-lg font-medium mb-2">Tableau Détaillé</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidat/Parti</TableHead>
                      <TableHead className="text-right">Votes</TableHead>
                      <TableHead className="text-right">% des Votes Valides</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidateData.map((candidate) => (
                      <TableRow key={candidate.name}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                  <AvatarImage src={candidate.photoUrl} alt={candidate.name} />
                                  <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                  <div className="font-medium">{candidate.name}</div>
                                  <div className="text-sm text-muted-foreground">{candidate.party}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">{candidate.votes.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{formatPercentage(candidate.votes, totalValidVotes)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-muted-foreground text-center">Aucune donnée de candidat à afficher.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
