'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

import { api, createQueryClient, createTRPCClient } from '@v-edfinance/api/client';

interface TRPCProviderProps {
  children: React.ReactNode;
  baseUrl?: string;
}

export function TRPCProvider({ children, baseUrl }: TRPCProviderProps) {
  const [queryClient] = useState(() => createQueryClient());
  const [trpcClient] = useState(() =>
    createTRPCClient(baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}
