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
import { LoaderCircle, PlusCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const electionSchema = z.object({
  name: z.string().min(5, 'Le nom doit contenir au moins 5 caractères.'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Veuillez entrer une date valide.',
  }),
});

type ElectionFormValues = z.infer<typeof electionSchema>;

export default function ElectionsPage() {
  const { elections, addElection, loading } = useData();
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'Super Admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const form = useForm<ElectionFormValues>({
    resolver: zodResolver(electionSchema),
    defaultValues: {
      name: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = (data: ElectionFormValues) => {
    try {
      addElection({ name: data.name, date: new Date(data.date).toISOString() });
      toast({
        title: 'Succès !',
        description: "L'élection a été ajoutée.",
      });
      form.reset();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Échec de l'ajout",
        description: error instanceof Error ? error.message : 'Une erreur inattendue est survenue.',
      });
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
      <h1 className="text-3xl font-bold font-headline">Gérer les élections</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Ajouter une nouvelle élection</CardTitle>
            <CardDescription>
              Remplissez le formulaire pour enregistrer une nouvelle élection.
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
                      <FormLabel>Nom de l'élection</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Élection Présidentielle 2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de l'élection</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="mr-2" />
                    )}
                    Ajouter l'élection
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Élections existantes</CardTitle>
            <CardDescription>
              Liste de toutes les élections enregistrées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">Chargement...</TableCell>
                  </TableRow>
                ) : elections.length > 0 ? (
                  elections.map((election) => (
                    <TableRow key={election.id}>
                      <TableCell className="font-medium">
                        {election.name}
                      </TableCell>
                       <TableCell className="text-right text-sm text-muted-foreground">
                        {format(new Date(election.date), "PPP", { locale: fr })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">Aucune élection trouvée.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
