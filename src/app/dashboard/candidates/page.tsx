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
import { LoaderCircle, UserPlus, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const candidateSchema = z.object({
  electionId: z.string().min(1, 'Veuillez sélectionner une élection.'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères.'),
  party: z.string().min(2, 'Le parti doit contenir au moins 2 caractères.'),
  photo: z.any().optional(),
});

type CandidateFormValues = z.infer<typeof candidateSchema>;

export default function CandidatesPage() {
  const { candidates, addCandidate, loading, elections } = useData();
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'Super Admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);
  
  const form = useForm<CandidateFormValues>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      electionId: '',
      name: '',
      party: '',
    },
  });

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const onSubmit = (data: CandidateFormValues) => {
    const photoUrl = photoPreview || `https://picsum.photos/seed/${data.name.replace(/\s/g, '')}/200/200`;

    try {
      addCandidate({ ...data, photoUrl });
      toast({
        title: 'Succès !',
        description: 'Le candidat a été ajouté.',
      });
      form.reset();
      setPhotoPreview(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Échec de l\'ajout',
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
      <h1 className="text-3xl font-bold font-headline">Gérer les candidats</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle>Ajouter un nouveau candidat</CardTitle>
            <CardDescription>
              Remplissez le formulaire pour enregistrer un nouveau candidat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="electionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Élection</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet du candidat</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Jean Dupont" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="party"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parti politique</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Parti de l'Avenir" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo du candidat</FormLabel>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          {photoPreview ? (
                            <AvatarImage src={photoPreview} alt="Aperçu" />
                          ) : (
                             <AvatarFallback>
                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                             </AvatarFallback>
                          )}
                           <AvatarFallback>{form.watch('name')?.charAt(0) || 'C'}</AvatarFallback>
                        </Avatar>
                        <FormControl>
                            <Input
                                type="file"
                                accept="image/*"
                                className='cursor-pointer'
                                onChange={(e) => {
                                field.onChange(e.target.files);
                                handlePhotoChange(e);
                                }}
                            />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2" />
                    )}
                    Ajouter le candidat
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Liste des candidats</CardTitle>
            <CardDescription>
               Liste de tous les candidats enregistrés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                     <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                ))
              ) : candidates.length > 0 ? (
                candidates.map((candidate) => (
                  <div key={candidate.id} className="flex items-center gap-4 text-left p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={candidate.photoUrl} alt={candidate.name} />
                        <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-bold text-lg">{candidate.name}</p>
                        <p className="text-sm text-muted-foreground">{candidate.party}</p>
                         <p className="text-xs text-muted-foreground mt-1">
                            {elections.find(e => e.id === candidate.electionId)?.name}
                        </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center h-24 flex items-center justify-center text-muted-foreground">
                  Aucun candidat trouvé.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
