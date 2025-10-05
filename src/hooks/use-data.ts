'use client';

import { useContext } from 'react';
import { DataContext } from '@/contexts/data-context';

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
