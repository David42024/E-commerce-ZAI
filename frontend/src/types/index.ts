export interface Usuario {
  id: string;
  correo: string;
  roles: string[];
}

export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  slug: string;
  descripcionCorta: string | null;
  precioVenta: number;
  precioOferta: number | null;
  imagenes: { id: string; url: string; orden: number }[];
  stock: { stockFisico: number; stockReservado: number } | null;
  descripcionLarga?: string | null;
  categoria?: {
    id: string;
    nombre: string;
  } | null;
  marca?: {
    id: string;
    nombre: string;
  } | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginacionResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ItemCarrito {
  productoId: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  imagenUrl: string;
  stockDisponible?: number;
}

export interface Orden {
  id: string;
  numeroOrden: string;
  totalFinal: number;
  estado: { nombre: string };
  created_at: string;
  items?: Array<{
    id: string;
    nombreProducto: string;
    sku: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }>;
  cliente?: {
    nombres: string;
    apellidos: string;
    telefono?: string | null;
    usuario?: Usuario | null;
  } | null;
}

export interface DashboardKpis {
  ventasTotales: number;
  cantidadOrdenes: number;
  ticketPromedio: number;
  clientesNuevos: number;
}