import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
      <div className="flex flex-col items-center text-center gap-8 py-24">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Bienvenido a <span className="text-primary">ZAI Commerce</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-[700px] leading-relaxed">
          La plataforma definitiva para gestionar tu catálogo, carrito de compras y órdenes con una experiencia minimalista y de alto rendimiento.
        </p>
        <div className="flex items-center gap-4 mt-4">
          <Link to="/catalogo">
            <Button size="lg" className="px-8 font-bold h-12 shadow-lg shadow-primary/20 transition-all active:scale-95">
              Explorar Catálogo
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" className="px-8 font-bold h-12 transition-all active:scale-95">
              Administración
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}