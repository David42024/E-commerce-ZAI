import { createBrowserRouter } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { lazy, Suspense } from 'react';

const Perfil = lazy(() => import('@/pages/shop/Perfil'));
const PerfilAdmin = lazy(() => import('@/pages/admin/PerfilAdmin'));

const Home = lazy(() => import('@/pages/shop/Home'));
const Login = lazy(() => import('@/pages/shop/Login'));
const Catalogo = lazy(() => import('@/pages/shop/Catalogo'));
const ProductoDetalle = lazy(() => import('@/pages/shop/ProductoDetalle'));
const Carrito = lazy(() => import('@/pages/shop/Carrito'));
const Checkout = lazy(() => import('@/pages/shop/Checkout'));
const MisOrdenes = lazy(() => import('@/pages/shop/MisOrdenes'));

const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const ProductosAdmin = lazy(() => import('@/pages/admin/ProductosAdmin'));
const OrdenesAdmin = lazy(() => import('@/pages/admin/OrdenesAdmin'));
const InventarioAdmin = lazy(() => import('@/pages/admin/InventarioAdmin'));
const ClientesAdmin = lazy(() => import('@/pages/admin/ClientesAdmin'));
const Reportes = lazy(() => import('@/pages/admin/Reportes'));
const Estadisticas = lazy(() => import('@/pages/admin/Estadisticas'));
const ActividadAdmin = lazy(() => import('@/pages/admin/ActividadAdmin'));

const Loading = () => <div className="flex h-screen items-center justify-center">Cargando...</div>;

export const appRouter = createBrowserRouter([
  { path: '/', element: <><Navbar /><Suspense fallback={<Loading/>}><Home /></Suspense></> },
  { path: '/login', element: <Suspense fallback={<Loading/>}><Login /></Suspense> },
  { path: '/catalogo', element: <><Navbar /><Suspense fallback={<Loading/>}><Catalogo /></Suspense></> },
  { path: '/producto/:id', element: <><Navbar /><Suspense fallback={<Loading/>}><ProductoDetalle /></Suspense></> },
  { path: '/carrito', element: <><Navbar /><Suspense fallback={<Loading/>}><Carrito /></Suspense></> },
  { path: '/checkout', element: <ProtectedRoute><><Navbar /><Suspense fallback={<Loading/>}><Checkout /></Suspense></></ProtectedRoute> },
  { path: '/mis-ordenes', element: <ProtectedRoute><><Navbar /><Suspense fallback={<Loading/>}><MisOrdenes /></Suspense></></ProtectedRoute> },
  { path: '/perfil', element: <ProtectedRoute><><Navbar /><Suspense fallback={<Loading/>}><Perfil /></Suspense></></ProtectedRoute> },
  
  // Rutas Agrupadas de Admin (Comparten el layout con Sidebar)
  { 
    path: '/admin', 
    element: <ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>,
    children: [
      { path: '', element: <Suspense fallback={<Loading/>}><Dashboard /></Suspense> },
      { path: 'productos', element: <Suspense fallback={<Loading/>}><ProductosAdmin /></Suspense> },
      { path: 'ordenes', element: <Suspense fallback={<Loading/>}><OrdenesAdmin /></Suspense> },
      { path: 'inventario', element: <Suspense fallback={<Loading/>}><InventarioAdmin /></Suspense> },
      { path: 'clientes', element: <Suspense fallback={<Loading/>}><ClientesAdmin /></Suspense> },
      { path: 'reportes', element: <Suspense fallback={<Loading/>}><Reportes /></Suspense> },
      { path: 'estadisticas', element: <Suspense fallback={<Loading/>}><Estadisticas /></Suspense> },
      { path: 'actividad', element: <Suspense fallback={<Loading/>}><ActividadAdmin /></Suspense> },
      { path: 'perfil', element: <Suspense fallback={<Loading/>}><PerfilAdmin /></Suspense> },
    ]
  }
]);