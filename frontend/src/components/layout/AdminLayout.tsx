import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { AdminSidebar } from './AdminSidebar';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

export const AdminLayout = () => {
  const { sidebarOpen } = useUiStore();
  
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/10 selection:text-primary">
      <Navbar />
      <div className="flex">
        <AdminSidebar />
        <main 
          className={cn(
            "flex-1 p-8 transition-all duration-300 ease-in-out min-h-[calc(100vh-4rem)]",
            sidebarOpen ? "ml-64" : "ml-16"
          )}
        >
          <div className="max-w-7xl mx-auto space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};