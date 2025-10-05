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
import { LoaderCircle, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PasswordStrength } from '@/components/password-strength';
import type { Role } from '@/lib/types';

const userSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères.'),
  email: z.string().email('Veuillez entrer une adresse e-mail valide.'),
  password: z.string().min(8, 'Le mot de passe doit comporter au moins 8 caractères.'),
  role: z.enum(['Super Admin', 'Admin', 'Bureau de Vote', 'Observateur'], { required_error: 'Veuillez sélectionner un rôle.' }),
  pollingStationId: z.string().optional(),
  electionId: z.string().optional(),
}).refine(data => data.role === 'Super Admin' || data.role === 'Observateur' || !!data.pollingStationId, {
  message: 'Veuillez assigner un bureau de vote pour les rôles Admin et Bureau de vote.',
  path: ['pollingStationId'],
});

type UserFormValues = z.infer<typeof userSchema>;

export default function UsersPage() {
  const { users, stations, elections, addUser, loading } = useData();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (currentUser && currentUser.role !== 'Super Admin' && currentUser.role !== 'Admin') {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      pollingStationId: currentUser?.role === 'Admin' ? currentUser.pollingStationId : '',
    },
  });

  const role = form.watch('role');

  useEffect(() => {
    if (currentUser?.role === 'Admin') {
      form.setValue('pollingStationId', currentUser.pollingStationId);
    }
  }, [currentUser, form]);

  const displayedUsers = useMemo(() => {
    if (currentUser?.role === 'Admin' && currentUser.pollingStationId) {
      return users.filter(u => u.pollingStationId === currentUser.pollingStationId);
    }
    return users;
  }, [currentUser, users]);

  const onSubmit = (data: UserFormValues) => {
    try {
      const newUser: Parameters<typeof addUser>[0] = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role as Role,
      };
      if ((data.role === 'Admin' || data.role === 'Bureau de Vote') && data.pollingStationId) {
        newUser.pollingStationId = data.pollingStationId;
      }
      
      if (data.role === 'Bureau de Vote' && data.electionId) {
        newUser.electionId = data.electionId;
      }

      addUser(newUser);

      toast({
        title: 'Succès !',
        description: "L'utilisateur a été ajouté.",
      });
      form.reset();
      setPassword('');
      if (currentUser?.role === 'Admin') {
        form.setValue('pollingStationId', currentUser.pollingStationId);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Échec de l\'ajout',
        description: error instanceof Error ? error.message : 'Une erreur inattendue est survenue.',
      });
    }
  };

  if (!currentUser || (currentUser.role !== 'Super Admin' && currentUser.role !== 'Admin')) {
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
  
  const getUserStationName = (stationId?: string) => {
    if (!stationId) return 'N/A';
    return stations.find(s => s.id === stationId)?.name || 'Inconnu';
  }
  
  const getUserElectionName = (electionId?: string) => {
    if (!electionId) return 'Toutes';
    return elections.find(e => e.id === electionId)?.name || 'Inconnue';
  };


  const roleOptions = useMemo(() => {
    if (currentUser?.role === 'Super Admin') {
      return ['Super Admin', 'Admin', 'Bureau de Vote', 'Observateur'];
    }
    if (currentUser?.role === 'Admin') {
      return ['Bureau de Vote', 'Observateur'];
    }
    return [];
  }, [currentUser]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Gérer les utilisateurs</h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle>Ajouter un nouvel utilisateur</CardTitle>
            <CardDescription>
             Remplissez le formulaire pour créer un nouveau compte.
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
                      <FormLabel>Nom complet</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Jean Dupont" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse e-mail</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: utilisateur@elections.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <Input
                            type="password"
                            placeholder="********"
                            {...field}
                            onChange={(e) => {
                            field.onChange(e);
                            setPassword(e.target.value);
                            }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <PasswordStrength password={password} />
                 <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rôle</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez un rôle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roleOptions.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(role === 'Admin' || role === 'Bureau de Vote') && currentUser?.role === 'Super Admin' && (
                   <FormField
                    control={form.control}
                    name="pollingStationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bureau de vote</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Assigner un bureau de vote" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stations.map(station => (
                              <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                 {currentUser?.role === 'Admin' && (role === 'Bureau de Vote' || role === 'Observateur') && (
                  <FormItem>
                    <FormLabel>Bureau de vote</FormLabel>
                    <Input value={getUserStationName(currentUser.pollingStationId)} readOnly className="bg-muted"/>
                  </FormItem>
                )}
                
                {(role === 'Bureau de Vote' && (currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin')) && (
                   <FormField
                    control={form.control}
                    name="electionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restreindre à une élection (Optionnel)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Toutes les élections" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             <SelectItem value="">Toutes les élections</SelectItem>
                            {elections.map(election => (
                              <SelectItem key={election.id} value={election.id}>{election.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}


                <div className="flex justify-end">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2" />
                    )}
                    Ajouter l'utilisateur
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
            <CardDescription>
               {currentUser?.role === 'Admin' 
                ? 'Liste des utilisateurs de votre bureau de vote.'
                : 'Liste de tous les utilisateurs enregistrés.'
               }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex flex-col space-y-2 p-4 border rounded-lg">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-2/3 mt-1" />
                  </div>
                ))
              ) : displayedUsers.length > 0 ? (
                displayedUsers.map((user) => (
                  <div key={user.id} className="text-left p-4 border rounded-lg bg-card hover:shadow-sm transition-shadow">
                    <p className="font-bold text-lg">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs font-semibold text-primary mt-1">{user.role}</p>
                    {(user.role === 'Admin' || user.role === 'Bureau de Vote') && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Bureau : {getUserStationName(user.pollingStationId)}
                        </p>
                    )}
                    {user.role === 'Bureau de Vote' && user.electionId && (
                         <p className="text-xs text-muted-foreground mt-1">
                            Élection: {getUserElectionName(user.electionId)}
                        </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center h-24 flex items-center justify-center text-muted-foreground">
                  Aucun utilisateur trouvé.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
