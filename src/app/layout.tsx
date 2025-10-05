import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { DataProvider } from '@/contexts/data-context';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Élections Camer',
  description: 'Application de gestion des résultats électoraux',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={cn('font-sans antialiased', inter.variable)}>
        <DataProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </DataProvider>
      </body>
    </html>
  );
}
