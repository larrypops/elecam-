'use client';

import { cn } from '@/lib/utils';

type StrengthLevel = 'Faible' | 'Moyen' | 'Fort' | 'Très Fort';

const getPasswordStrength = (password: string): { level: StrengthLevel; score: number } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score < 3) return { level: 'Faible', score: (score / 5) * 100 };
  if (score === 3) return { level: 'Moyen', score: (score / 5) * 100 };
  if (score === 4) return { level: 'Fort', score: (score / 5) * 100 };
  return { level: 'Très Fort', score: 100 };
};

const strengthColors: Record<StrengthLevel, string> = {
  'Faible': 'bg-red-500',
  'Moyen': 'bg-yellow-500',
  'Fort': 'bg-blue-500',
  'Très Fort': 'bg-green-500',
};

export function PasswordStrength({ password }: { password?: string }) {
  if (!password) {
    return null;
  }

  const { level, score } = getPasswordStrength(password);

  return (
    <div className="space-y-1">
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={cn('h-1.5 rounded-full transition-all', strengthColors[level])}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Force: <span className="font-semibold">{level}</span>
      </p>
    </div>
  );
}
