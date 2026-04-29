import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { appRouter } from './routes';
import { ThemeProvider } from './components/theme/theme-provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="zai-theme">
        <RouterProvider router={appRouter} />
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            className: 'dark:bg-zinc-900 dark:text-white dark:border-zinc-800',
            style: { background: '#18181b', color: '#fafafa', border: '1px solid #27272a' }
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}