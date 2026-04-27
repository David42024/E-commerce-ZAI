import { Link, useLocation } from 'react-router-dom';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, ShoppingCart, Warehouse, Users, FileBarChart, History, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/productos', label: 'Productos', icon: Package },
  { path: '/admin/ordenes', label: 'Órdenes', icon: ShoppingCart },
  { path: '/admin/inventario', label: 'Inventario', icon: Warehouse },
  { path: '/admin/clientes', label: 'Clientes', icon: Users },
  { path: '/admin/reportes', label: 'Reportes', icon: FileBarChart },
  { path: '/admin/actividad', label: 'Actividad', icon: History },
];

export const AdminSidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const location = useLocation();

  return (
    <aside 
      className={cn(
        "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-full flex-col justify-between py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                  isActive 
                    ? "bg-primary/5 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                {sidebarOpen && <span className="text-sm truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="w-full flex justify-center hover:bg-accent"
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </aside>
  );
};