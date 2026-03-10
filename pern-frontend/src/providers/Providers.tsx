import { useState, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './ThemeProvider';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: '500',
              backdropFilter: 'blur(20px)',
            },
            success: {
              style: {
                background: 'rgba(16,185,129,0.95)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
              },
              iconTheme: { primary: '#fff', secondary: 'rgba(16,185,129,0.95)' },
            },
            error: {
              style: {
                background: 'rgba(239,68,68,0.95)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
              },
              iconTheme: { primary: '#fff', secondary: 'rgba(239,68,68,0.95)' },
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
