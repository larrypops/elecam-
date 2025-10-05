'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, Upload, Paperclip } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import type { ElectionResult } from '@/lib/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const candidateSchema = z.object({
  name: z.string().min(1, 'Le nom du candidat est requis'),
  votes: z.preprocess((val) => val === '' ? null : Number(String(val)), z.number().min(0, 'Les votes ne peuvent pas être négatifs').nullable()),
});

const reportInfoSchema = z.object({
  name: z.string(),
  type: z.string(),
  dataUri: z.string().url(),
}).optional();

const resultsSchema = z
  .object({
    electionId: z.string().min(1, 'Veuillez sélectionner une élection.'),
    pollingStation: z.string().min(1, 'Veuillez sélectionner un bureau de vote.'),
    registeredVoters: z.preprocess((val) => val === '' ? 0 : Number(String(val)), z.number().int().min(1, "Le nombre d'électeurs inscrits doit être d'au moins 1.")),
    turnout: z.preprocess((val) => val === '' ? 0 : Number(String(val)), z.number().int().min(0, 'La participation ne peut pas être négative.')),
    candidateResults: z.array(candidateSchema).min(1, 'Au moins un candidat est requis.'),
    invalidBallots: z.preprocess((val) => val === '' ? 0 : Number(String(val)), z.number().int().min(0, 'Les bulletins nuls ne peuvent pas être négatifs.')),
    blankBallots: z.preprocess((val) => val === '' ? 0 : Number(String(val)), z.number().int().min(0, 'Les bulletins blancs ne peuvent pas être négatifs.')),
    reportFile: z
      .any()
      .refine((files) => !files || files.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `La taille maximale du fichier est de 5 Mo.`)
      .refine(
        (files) => !files || files.length === 0 || ALLOWED_FILE_TYPES.includes(files?.[0]?.type),
        'Formats de fichiers autorisés : PDF, JPG, PNG, WEBP.'
      )
      .optional(),
    reportInfo: reportInfoSchema,
  })
  .refine((data) => data.turnout <= data.registeredVoters, {
    message: 'La participation ne peut pas dépasser le nombre d\'électeurs inscrits.',
    path: ['turnout'],
  })
  .refine(
    (data) => {
      const totalVotesCast =
        data.candidateResults.reduce((sum, candidate) => sum + (candidate.votes || 0), 0) +
        data.invalidBallots +
        data.blankBallots;
      return totalVotesCast === data.turnout;
    },
    {
      message: 'La somme de tous les votes (candidats, nuls, blancs) doit être égale à la participation.',
      path: ['blankBallots'], // Assign error to the last field in the group
    }
  );

type ResultsFormValues = z.infer<typeof resultsSchema>;

export default function InputResultsPage() {
  const { addResult, stations, candidates, elections } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedElectionId, setSelectedElectionId] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reportFileRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const userStation = useMemo(() => {
    if (user?.role !== 'Super Admin' && user?.pollingStationId) {
      return stations.find(s => s.id === user.pollingStationId);
    }
    return null;
  }, [user, stations]);
  
  const userElection = useMemo(() => {
    if (user?.electionId) {
        return elections.find(e => e.id === user.electionId);
    }
    return null;
  }, [user, elections]);

  const form = useForm<ResultsFormValues>({
    resolver: zodResolver(resultsSchema),
    defaultValues: {
      electionId: '',
      pollingStation: '',
      registeredVoters: 0,
      turnout: 0,
      candidateResults: [],
      invalidBallots: 0,
      blankBallots: 0,
    },
  });

  useEffect(() => {
    if (userStation) {
      form.setValue('pollingStation', userStation.name);
    }
    if (userElection) {
        form.setValue('electionId', userElection.id);
        setSelectedElectionId(userElection.id);
    }
  }, [userStation, userElection, form]);

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'candidateResults',
  });
  
  const candidatesForSelectedElection = useMemo(() => {
    return candidates.filter(c => c.electionId === selectedElectionId);
  }, [candidates, selectedElectionId]);

  useEffect(() => {
    if (selectedElectionId) {
      const candidateFields = candidatesForSelectedElection.map(c => ({ name: c.name, votes: 0 }));
      replace(candidateFields);
    } else {
      replace([]);
    }
  }, [selectedElectionId, candidatesForSelectedElection, replace]);


  const onSubmit = async (data: ResultsFormValues) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Utilisateur non authentifié.' });
        return;
    }
    
    const submissionData: Omit<ElectionResult, 'id' | 'timestamp' | 'submittedBy'> = {
      electionId: data.electionId,
      pollingStation: data.pollingStation,
      registeredVoters: data.registeredVoters,
      turnout: data.turnout,
      candidateResults: data.candidateResults.map(c => ({...c, votes: c.votes || 0})),
      invalidBallots: data.invalidBallots,
      blankBallots: data.blankBallots,
    };

    const file = data.reportFile?.[0];
    
    if (file) {
      try {
        const dataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });

        const election = elections.find(e => e.id === data.electionId);
        const sanitize = (text: string) => text.replace(/[^a-zA-Z0-9]/g, '_');
        const extension = file.name.split('.').pop() || 'file';
        const newName = `PV_${sanitize(election?.name || 'election')}_${sanitize(data.pollingStation)}.${extension}`;
        
        submissionData.reportInfo = { name: newName, type: file.type, dataUri };

      } catch (error) {
        toast({ variant: 'destructive', title: 'Erreur de lecture', description: 'Une erreur s\'est produite lors de la lecture du fichier.' });
        return;
      }
    }
    
    try {
      addResult(submissionData, user.name);

      toast({
        title: 'Succès !',
        description: 'Les résultats des élections ont été soumis.',
      });
      form.reset({
        electionId: '',
        pollingStation: '',
        registeredVoters: 0,
        turnout: 0,
        candidateResults: [],
        invalidBallots: 0,
        blankBallots: 0,
        reportFile: undefined,
      });

      if (reportFileRef.current) {
        reportFileRef.current.value = '';
      }

      if (userStation) {
        form.setValue('pollingStation', userStation.name);
      }
      if (userElection) {
          form.setValue('electionId', userElection.id);
          setSelectedElectionId(userElection.id);
      } else {
          setSelectedElectionId('');
      }
      replace([]);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'La soumission a échoué',
        description: error instanceof Error ? error.message : 'Une erreur inattendue est survenue.',
      });
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Erreur', description: 'Utilisateur non authentifié pour l\'importation.' });
        return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') {
            toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de lire le fichier.' });
            setIsImporting(false);
            return;
        }

        const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
        const headerLine = lines.shift();
        if (!headerLine) {
            toast({ variant: 'destructive', title: 'Fichier vide', description: "Le fichier CSV ne contient pas d'en-tête." });
            setIsImporting(false);
            return;
        }

        const header = headerLine.split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        
        const requiredHeaders = ['electionid', 'pollingstation', 'registeredvoters', 'turnout', 'invalidballots', 'blankballots'];
        const hasRequiredHeaders = requiredHeaders.every(h => header.includes(h));

        if (!hasRequiredHeaders) {
            toast({ variant: 'destructive', title: 'Format de fichier invalide', description: `L'en-tête du CSV est incorrect. Requis: ${requiredHeaders.join(', ')}` });
            setIsImporting(false);
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const line of lines) {
            const values = line.split(',').map(field => field.trim().replace(/"/g, ''));
            const rowData: { [key: string]: string } = header.reduce((obj, h, i) => {
                obj[h] = values[i];
                return obj;
            }, {} as { [key: string]: string });

            const candidateResults: { name: string, votes: number }[] = [];
            header.forEach((h, i) => {
                if (h.startsWith('candidate_') && h.endsWith('_votes')) {
                    const nameKey = h.replace('_votes', '_name');
                    const candidateName = rowData[nameKey];
                    const votes = parseInt(rowData[h], 10);
                    if (candidateName && !isNaN(votes)) {
                        candidateResults.push({ name: candidateName, votes: votes });
                    }
                }
            });
            
            let reportInfo: z.infer<typeof reportInfoSchema>;
            if (rowData.reportdatauri && rowData.reportdatauri.startsWith('data:')) {
                try {
                  const election = elections.find(e => e.id === rowData.electionid);
                  const sanitize = (text: string) => text.replace(/[^a-zA-Z0-9]/g, '_');
                  const type = rowData.reportdatauri.split(';')[0].split(':')[1];
                  const extension = type.split('/')[1] || 'bin';
                  const newName = `PV_${sanitize(election?.name || 'election')}_${sanitize(rowData.pollingstation)}.${extension}`;
                  
                  reportInfo = {
                      name: newName,
                      type: type,
                      dataUri: rowData.reportdatauri
                  };
                } catch(e) {
                   console.error('Error creating report info from CSV', e);
                }
            }

            const parsedData = {
                electionId: rowData.electionid,
                pollingStation: rowData.pollingstation,
                registeredVoters: rowData.registeredvoters,
                turnout: rowData.turnout,
                invalidBallots: rowData.invalidballots,
                blankBallots: rowData.blankballots,
                candidateResults: candidateResults,
                reportInfo: reportInfo,
            };

            const parseResult = resultsSchema.safeParse(parsedData);
            

            if (parseResult.success) {
                try {
                    const { reportFile, ...submissionData } = parseResult.data;
                    const finalSubmissionData = {
                      ...submissionData,
                      candidateResults: submissionData.candidateResults.map(c => ({...c, votes: c.votes || 0})),
                    };

                    addResult(finalSubmissionData, user.name);
                    successCount++;
                } catch (e) {
                    console.error("CSV import submission error:", e);
                    errorCount++;
                }
            } else {
                console.error("CSV line validation error:", parseResult.error.flatten().fieldErrors);
                errorCount++;
            }
        }
        
        toast({
            title: 'Importation terminée',
            description: `${successCount} résultats ajoutés, ${errorCount} erreurs.`,
        });

        setIsImporting(false);
        setIsDialogOpen(false);
    };

    reader.onerror = () => {
       toast({ variant: 'destructive', title: 'Erreur de lecture', description: 'Une erreur s\'est produite lors de la lecture du fichier.' });
       setIsImporting(false);
    };

    reader.readAsText(file);
    
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold font-headline">Saisir les résultats</h1>
        {user?.role === 'Super Admin' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2" />
                Importer un CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importer les résultats</DialogTitle>
                <DialogDescription>
                  <p>Sélectionnez un fichier CSV. Colonnes requises : </p>
                  <code className="font-mono bg-muted p-1 rounded-sm text-sm break-all my-2 block">
                    electionId,pollingStation,registeredVoters,turnout,invalidBallots,blankBallots,candidate_1_name,candidate_1_votes,...
                  </code>
                   <p>Colonne optionnelle pour le procès-verbal :</p>
                   <code className="font-mono bg-muted p-1 rounded-sm text-sm break-all block">
                    reportDataUri
                  </code>
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input 
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  onChange={handleFileImport}
                  disabled={isImporting}
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" disabled={isImporting}>Annuler</Button>
                </DialogClose>
                {isImporting && <LoaderCircle className="h-4 w-4 animate-spin" />}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Nouvelle entrée de résultat</CardTitle>
          <CardDescription>Remplissez le formulaire ci-dessous pour soumettre les résultats d'un bureau de vote.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                 <FormField
                  control={form.control}
                  name="electionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Élection</FormLabel>
                       <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedElectionId(value);
                          }} 
                          value={field.value}
                          disabled={!!userElection}
                        >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une élection" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {elections.map(election => (
                            <SelectItem key={election.id} value={election.id}>{election.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pollingStation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bureau de vote</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value} disabled={!!userStation}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un bureau de vote" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stations.map(station => (
                            <SelectItem key={station.id} value={station.name}>{station.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="registeredVoters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Électeurs inscrits</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="ex: 5000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="turnout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participation électorale</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="ex: 3500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Votes par candidat</h3>
                 {fields.length > 0 ? (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-[1fr_auto] items-end gap-4">
                        <FormField
                          control={form.control}
                          name={`candidateResults.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">Nom du candidat</FormLabel>
                              <FormControl>
                                <Input {...field} readOnly className="font-medium bg-muted" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`candidateResults.${index}.votes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">Votes</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="Votes" {...field} value={field.value === null ? '' : field.value} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                   <p className="text-sm text-muted-foreground">
                    Veuillez d'abord sélectionner une élection pour voir les candidats.
                  </p>
                )}
              </div>

              <Separator />
                
               <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="invalidBallots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bulletins nuls</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="ex: 40" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="blankBallots"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bulletins blancs</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="ex: 10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="reportFile"
                render={({ field: { onChange, onBlur, name, ref } }) => (
                  <FormItem>
                    <FormLabel>Téléverser le procès-verbal (optionnel)</FormLabel>
                     <FormControl>
                        <Input
                            type="file"
                            className='cursor-pointer'
                            accept={ALLOWED_FILE_TYPES.join(',')}
                            onChange={(e) => onChange(e.target.files)}
                            onBlur={onBlur}
                            name={name}
                            ref={reportFileRef}
                        />
                    </FormControl>
                    <FormDescription>
                      Fichiers PDF, JPG, PNG, WEBP. Taille max : 5Mo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={!selectedElectionId || form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                  Soumettre les résultats
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
