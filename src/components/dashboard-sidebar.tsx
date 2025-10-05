'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PenSquare,
  History,
  LogOut,
  Building,
  Users,
  Vote,
  UserCog,
  FileArchive,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/logo';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord', roles: ['Super Admin', 'Admin', 'Bureau de Vote', 'Observateur'] },
  { href: '/dashboard/input-results', icon: PenSquare, label: 'Saisir les résultats', roles: ['Super Admin', 'Admin', 'Bureau de Vote'] },
  { href: '/dashboard/elections', icon: Vote, label: 'Gérer les élections', roles: ['Super Admin'] },
  { href: '/dashboard/stations', icon: Building, label: 'Gérer les bureaux', roles: ['Super Admin'] },
  { href: '/dashboard/candidates', icon: Users, label: 'Gérer les candidats', roles: ['Super Admin'] },
  { href: '/dashboard/reports', icon: FileArchive, label: 'Procès-verbaux', roles: ['Super Admin'] },
  { href: '/dashboard/users', icon: UserCog, label: 'Gérer les utilisateurs', roles: ['Super Admin', 'Admin'] },
  { href: '/dashboard/history', icon: History, label: 'Historique des saisies', roles: ['Super Admin', 'Admin', 'Bureau de Vote', 'Observateur'] },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Logo className="size-7 text-primary" />
          <span className="text-lg font-semibold font-headline">Élections Camer</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) =>
            item.roles.includes(user.role) ? (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label }}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ) : null
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} tooltip={{ children: 'Déconnexion' }}>
              <LogOut />
              <span>Déconnexion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
