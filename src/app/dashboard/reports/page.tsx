'use client';

import { useData } from '@/hooks/use-data';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { ElectionResult } from '@/lib/types';

type ProcessedReport = ElectionResult & {
  electionName: string;
};

export default function ReportsPage() {
  const { results, elections, loading } = useData();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user && user.role !== 'Super Admin') {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const reports: ProcessedReport[] = useMemo(() => {
    const reportsWithInfo = results.filter((result): result is ElectionResult & { reportInfo: NonNullable<ElectionResult['reportInfo']> } => 
      Boolean(result.reportInfo)
    );

    // Deduplicate by latest per election-station key
    const latestReportsMap = new Map<string, ElectionResult>();
    for (const result of reportsWithInfo) {
      const key = `${result.electionId}-${result.pollingStation}`;
      const existing = latestReportsMap.get(key);
      if (!existing || new Date(result.timestamp) > new Date(existing.timestamp)) {
        latestReportsMap.set(key, result);
      }
    }

    return Array.from(latestReportsMap.values())
      .map((report) => ({
        ...report,
        electionName: elections.find((e) => e.id === report.electionId)?.name || 'Inconnue',
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [results, elections]);

  const getElectionName = useCallback((electionId: string) => {
    return elections.find((e) => e.id === electionId)?.name || 'Inconnue';
  }, [elections]);

  const handleExport = useCallback(() => {
    if (reports.length === 0) return;

    // Properly escape CSV fields
    const escapeCsvField = (field: string) => `"${String(field).replace(/"/g, '""')}"`;

    const csvHeader = 'Nom du fichier,Bureau de vote,Élection,Soumis par,Date de soumission\n';
    const csvRows = reports
      .map((r) => {
        const fileName = r.reportInfo?.name ?? 'Sans nom';
        return [
          escapeCsvField(fileName),
          escapeCsvField(r.pollingStation),
          escapeCsvField(r.electionName),
          escapeCsvField(r.submittedBy),
          escapeCsvField(format(new Date(r.timestamp), 'yyyy-MM-dd HH:mm:ss')),
        ].join(',');
      })
      .join('\n');

    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `proces-verbaux-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Exportation réussie',
      description: 'La liste des procès-verbaux a été téléchargée au format CSV.',
    });
  }, [reports, toast]);

  const isPageLoading = loading || authLoading;

  if (!isPageLoading && (!user || user.role !== 'Super Admin')) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Accès non autorisé</CardTitle>
            <CardDescription>
              Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">Gestion des Procès-verbaux</h1>
        <Button onClick={handleExport} disabled={reports.length === 0 || isPageLoading}>
          <Download className="mr-2 h-4 w-4" />
          Exporter la liste (CSV)
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Liste des procès-verbaux soumis</CardTitle>
          <CardDescription>
            Retrouvez ici la version la plus récente de chaque procès-verbal téléversé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier du Procès-verbal</TableHead>
                  <TableHead>Bureau de vote</TableHead>
                  <TableHead>Élection</TableHead>
                  <TableHead>Soumis par</TableHead>
                  <TableHead className="text-right">Date de soumission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPageLoading ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-32 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : reports.length > 0 ? (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        {report.reportInfo?.dataUri ? (
                          <a
                            href={report.reportInfo.dataUri}
                            download={report.reportInfo.name}
                            className="flex items-center gap-2 text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            title={`Télécharger ${report.reportInfo.name}`}
                            rel="noopener noreferrer"
                          >
                            <Paperclip className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                            <span className="truncate font-medium max-w-[200px]">{report.reportInfo.name}</span>
                          </a>
                        ) : (
                          <span className="font-medium text-muted-foreground" title={report.reportInfo?.name}>
                            {report.reportInfo?.name ?? 'Sans nom'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{report.pollingStation}</TableCell>
                      <TableCell className="text-muted-foreground">{report.electionName}</TableCell>
                      <TableCell className="text-muted-foreground">{report.submittedBy}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        <time dateTime={report.timestamp}>
                          {format(new Date(report.timestamp), 'PPp', { locale: fr })}
                        </time>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <span className="text-muted-foreground">Aucun procès-verbal trouvé.</span>
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