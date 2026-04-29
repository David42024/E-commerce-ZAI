import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ArrowRight, ShieldCheck, Zap, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-b from-background to-muted/50 dark:to-muted/10">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center gap-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs font-bold tracking-wider uppercase mb-4 animate-fade-in shadow-sm">
              <Zap className="h-3 w-3" />
              Nuevo: Modo Oscuro Disponible
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl text-foreground dark:text-foreground">
              Tu tienda online con <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">Experiencia Premium</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground dark:text-muted-foreground/80 max-w-[700px] leading-relaxed">
              Explora un catálogo moderno, gestiona tus compras con facilidad y disfruta de una interfaz intuitiva diseñada para tu comodidad.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
              <Link to="/catalogo">
                <Button size="lg" className="px-8 font-bold h-14 text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Ir al Catálogo
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" size="lg" className="px-8 font-bold h-14 text-base group dark:text-muted-foreground dark:hover:text-foreground">
                  Panel de Control
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center p-8 rounded-2xl border dark:border-primary/10 bg-card/50 dark:bg-card/20 hover:bg-card dark:hover:bg-card/40 transition-all shadow-sm hover:shadow-xl dark:hover:shadow-primary/5">
              <div className="h-14 w-14 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-6">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Seguridad Garantizada</h3>
              <p className="text-muted-foreground dark:text-muted-foreground/80">Tus transacciones y datos están protegidos con los más altos estándares de seguridad.</p>
            </div>
            <div className="flex flex-col items-center text-center p-8 rounded-2xl border dark:border-primary/10 bg-card/50 dark:bg-card/20 hover:bg-card dark:hover:bg-card/40 transition-all shadow-sm hover:shadow-xl dark:hover:shadow-primary/5">
              <div className="h-14 w-14 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-6">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Rendimiento Ultra Rápido</h3>
              <p className="text-muted-foreground dark:text-muted-foreground/80">Una experiencia fluida sin tiempos de espera, optimizada para todos los dispositivos.</p>
            </div>
            <div className="flex flex-col items-center text-center p-8 rounded-2xl border dark:border-primary/10 bg-card/50 dark:bg-card/20 hover:bg-card dark:hover:bg-card/40 transition-all shadow-sm hover:shadow-xl dark:hover:shadow-primary/5">
              <div className="h-14 w-14 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary mb-6">
                <BarChart3 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Gestión Inteligente</h3>
              <p className="text-muted-foreground dark:text-muted-foreground/80">Herramientas avanzadas de Business Intelligence para administradores y clientes.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}