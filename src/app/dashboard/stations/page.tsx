'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, PlusCircle, Upload } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';

const stationSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères.'),
  city: z.string().min(2, 'La ville doit contenir au moins 2 caractères.'),
  district: z.string().min(2, 'La commune doit contenir au moins 2 caractères.'),
});

type StationFormValues = z.infer<typeof stationSchema>;

export default function StationsPage() {
  const { stations, addStation, loading } = useData();
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'Super Admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);
  
  const form = useForm<StationFormValues>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      name: '',
      city: '',
      district: '',
    },
  });

  const onSubmit = (data: StationFormValues) => {
    try {
      addStation(data);
      toast({
        title: 'Succès !',
        description: 'Le bureau de vote a été ajouté.',
      });
      form.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Échec de l\'ajout',
        description: error instanceof Error ? error.message : 'Une erreur inattendue est survenue.',
      });
    }
  };
  
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      const header = lines.shift()?.split(',').map(h => h.trim());

      if (!header || header.join(',') !== 'name,city,district') {
         toast({ variant: 'destructive', title: 'Format de fichier invalide', description: "L'en-tête du CSV doit être 'name,city,district'." });
         setIsImporting(false);
         return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (const line of lines) {
        const [name, city, district] = line.split(',').map(field => field.trim());
        const parseResult = stationSchema.safeParse({ name, city, district });

        if (parseResult.success) {
          try {
            addStation(parseResult.data);
            successCount++;
          } catch (e) {
            errorCount++;
          }
        } else {
          errorCount++;
        }
      }
      
      toast({
        title: 'Importation terminée',
        description: `${successCount} bureaux ajoutés, ${errorCount} erreurs.`,
      });

      setIsImporting(false);
      setIsDialogOpen(false);
    };

    reader.onerror = () => {
       toast({ variant: 'destructive', title: 'Erreur de lecture', description: 'Une erreur s\'est produite lors de la lecture du fichier.' });
       setIsImporting(false);
    };

    reader.readAsText(file);
    
    // Reset file input
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };


  if (user?.role !== 'Super Admin') {
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
        <h1 className="text-3xl font-bold font-headline">Gérer les bureaux de vote</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Upload className="mr-2" />
              Importer un CSV
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Importer des bureaux de vote</DialogTitle>
              <DialogDescription>
                Sélectionnez un fichier CSV à importer. Le fichier doit avoir les colonnes : 
                <code className="font-mono bg-muted p-1 rounded-sm text-sm">name,city,district</code>.
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
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Ajouter un nouveau bureau de vote</CardTitle>
            <CardDescription>
              Remplissez le formulaire pour enregistrer un nouveau bureau.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom du bureau de vote</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: École Publique de Bonamoussadi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Douala" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commune</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Douala V" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="mr-2" />
                    )}
                    Ajouter le bureau
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Bureaux de vote existants</CardTitle>
            <CardDescription>
               Liste de tous les bureaux de vote enregistrés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead className="text-right">Commune</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">Chargement...</TableCell>
                    </TableRow>
                  ) : stations.length > 0 ? (
                    stations.map((station) => (
                      <TableRow key={station.id}>
                        <TableCell className="font-medium">
                          {station.name}
                        </TableCell>
                        <TableCell>{station.city}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {station.district}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">Aucun bureau de vote trouvé.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
