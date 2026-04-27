import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { ShoppingCart, LogOut, LogIn, User, LayoutDashboard, Package } from 'lucide-react';

export const Navbar = () => {
  const { usuario, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.getCount());

  const isStaff = usuario?.roles?.some(role => ['ADMIN', 'MANAGER', 'SUPER_ADMIN'].includes(role));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-xl transition-transform group-hover:scale-105">Z</div>
            <span className="text-lg font-bold tracking-tight hidden sm:block">ZAI Commerce</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/catalogo" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Catálogo</Link>
            {usuario && (
              <Link to="/mis-ordenes" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">Mis Órdenes</Link>
            )}
            {isStaff && (
              <Link to="/admin" className="text-sm font-bold text-primary flex items-center gap-1.5 transition-colors hover:opacity-80">
                <LayoutDashboard className="h-4 w-4" />
                Administrar
              </Link>
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          {usuario && (
            <Link to="/mis-ordenes" className="md:hidden">
              <Button variant="ghost" size="icon" className="hover:bg-accent transition-colors" aria-label="Ver mis órdenes">
                <Package className="h-5 w-5" />
              </Button>
            </Link>
          )}

          <Link to="/carrito">
            <Button variant="ghost" size="icon" className="relative hover:bg-accent transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground ring-2 ring-background">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          <div className="h-6 w-px bg-border mx-2 hidden sm:block" />

          {usuario ? (
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden lg:flex flex-col items-end leading-none">
                <span className="text-xs font-medium">{usuario.correo.split('@')[0]}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {isStaff ? 'Administrador' : 'Cliente'}
                </span>
              </div>
              <Link to={isStaff ? "/admin/perfil" : "/perfil"}>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-2 border-muted hover:border-primary transition-all" aria-label="Ir a perfil">
                  <User className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="default" size="sm" className="h-9 px-4 font-medium shadow-sm active:scale-95 transition-all">
                <LogIn className="mr-2 h-4 w-4" /> 
                Acceder
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};