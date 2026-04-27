import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { appRouter } from './routes';

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
      <RouterProvider router={appRouter} />
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: { background: '#18181b', color: '#fafafa', border: '1px solid #27272a' }
        }}
      />
    </QueryClientProvider>
  );
}