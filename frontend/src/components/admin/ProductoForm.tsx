import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriaService, Categoria } from '@/services/categoria.service';
import { unidadMedidaService, UnidadMedida } from '@/services/unidad-medida.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X } from 'lucide-react';

interface ProductoFormProps {
  producto?: any;
  onSave: (data: any) => Promise<unknown>;
  onCancel: () => void;
  isSaving: boolean;
}

const DEFAULT_PRODUCT_IMAGE_URL = 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg';

export function ProductoForm({ producto, onSave, onCancel, isSaving }: ProductoFormProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    sku: '',
    descripcionCorta: '',
    precioVenta: 0,
    precioCosto: 0,
    precioOferta: 0,
    categoriaId: '',
    unidadMedidaId: '',
    stockFisico: 0,
    stockMinimo: 5,
    imagenes: [{ url: DEFAULT_PRODUCT_IMAGE_URL, orden: 0 }] as { url: string; orden: number }[],
    estado: 'ACTIVO',
  });

  const [newImageUrl, setNewImageUrl] = useState('');

const { data: categoriasData } = useQuery({
    queryKey: ['categorias'],
    queryFn: () => categoriaService.listar(),
  });

  const { data: unidadesData } = useQuery({
    queryKey: ['unidades-medida'],
    queryFn: () => unidadMedidaService.listar(),
  });

  const categorias = categoriasData?.data || [];
  const unidades = unidadesData?.data || [];

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        sku: producto.sku || '',
        descripcionCorta: producto.descripcionCorta || '',
        precioVenta: Number(producto.precioVenta) || 0,
        precioCosto: Number(producto.precioCosto) || 0,
        precioOferta: Number(producto.precioOferta) || 0,
        categoriaId: producto.categoriaId || '',
        unidadMedidaId: producto.unidadMedidaId || '',
        stockFisico: Number(producto.stock?.stockFisico) || 0,
        stockMinimo: Number(producto.stock?.stockMinimo) || 5,
        imagenes: (producto.imagenes || []).map((img: any) => ({ url: img.url, orden: img.orden })),
        estado: producto.estado || 'ACTIVO',
      });
    } else {
      setFormData({
        nombre: '',
        sku: '',
        descripcionCorta: '',
        precioVenta: 0,
        precioCosto: 0,
        precioOferta: 0,
        categoriaId: '',
        unidadMedidaId: '',
        stockFisico: 0,
        stockMinimo: 5,
        imagenes: [{ url: DEFAULT_PRODUCT_IMAGE_URL, orden: 0 }],
        estado: 'ACTIVO',
      });
    }
  }, [producto]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('precio') || name.includes('stock') ? Number(value) : value
    }));
  };

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      imagenes: [...prev.imagenes, { url: newImageUrl, orden: prev.imagenes.length }]
    }));
    setNewImageUrl('');
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index).map((img, i) => ({ ...img, orden: i }))
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.imagenes.length === 0) {
      alert('Al menos una imagen es requerida');
      return;
    }
    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nombre del Producto</label>
          <Input 
            name="nombre" 
            value={formData.nombre} 
            onChange={handleChange} 
            placeholder="Ej. Laptop Gamer Pro" 
            required 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">SKU</label>
          <Input 
            name="sku" 
            value={formData.sku} 
            onChange={handleChange} 
            placeholder="Ej. LPT-001" 
            required 
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Descripción Corta</label>
          <textarea 
            name="descripcionCorta" 
            value={formData.descripcionCorta} 
            onChange={handleChange} 
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Breve descripción del producto..."
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Categoría</label>
          <select 
            name="categoriaId" 
            value={formData.categoriaId} 
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map((cat: Categoria) => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Unidad de Medida</label>
          <select 
            name="unidadMedidaId" 
            value={formData.unidadMedidaId} 
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            required
          >
            <option value="">Selecciona una unidad</option>
            {unidades.map((un: UnidadMedida) => (
              <option key={un.id} value={un.id}>{un.nombre} ({un.abreviatura})</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Precio de Compra</label>
          <Input 
            name="precioCosto" 
            type="number" 
            step="0.01" 
            value={formData.precioCosto} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Precio de Venta</label>
          <Input 
            name="precioVenta" 
            type="number" 
            step="0.01" 
            value={formData.precioVenta} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Precio de Oferta (Opcional)</label>
          <Input 
            name="precioOferta" 
            type="number" 
            step="0.01" 
            value={formData.precioOferta} 
            onChange={handleChange} 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock Físico</label>
          <Input 
            name="stockFisico" 
            type="number" 
            value={formData.stockFisico} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Stock Mínimo (Alerta)</label>
          <Input 
            name="stockMinimo" 
            type="number" 
            value={formData.stockMinimo} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="space-y-4 md:col-span-2 border-t pt-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Imágenes del Producto (Mín. 1)</label>
            <div className="flex gap-2">
              <Input 
                placeholder="URL de la imagen (ej. https://...)" 
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImage();
                  }
                }}
              />
              <Button type="button" onClick={addImage} variant="secondary">
                Agregar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {formData.imagenes.map((img, index) => (
              <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                <img src={img.url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                  Orden: {img.orden}
                </div>
              </div>
            ))}
            {formData.imagenes.length === 0 && (
              <div className="col-span-full py-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground">
                <p className="text-sm">No hay imágenes agregadas.</p>
                <p className="text-[10px]">Agrega al menos una URL de imagen arriba.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {producto ? 'Actualizar Producto' : 'Crear Producto'}
        </Button>
      </div>
    </form>
  );
}
