import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriaService, Categoria } from '@/services/categoria.service';
import { unidadMedidaService, UnidadMedida } from '@/services/unidad-medida.service';
import { productoService } from '@/services/producto.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X, UploadCloud, Image as ImageIcon, Link2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProductoFormProps {
  producto?: any;
  onSave: (data: any) => Promise<unknown>;
  onCancel: () => void;
  isSaving: boolean;
}




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
    imagenes: [] as { url: string; orden: number }[],
    estado: 'ACTIVO',
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [urlTabActive, setUrlTabActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        imagenes: [],   // El backend asigna imagen default si viene vacío
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

  const addImageUrl = () => {
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

  /** Sube un archivo al backend y agrega la URL resultante */
  const uploadFile = useCallback(async (file: File) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error('Solo se permiten imágenes (jpg, png, webp, gif)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no debe superar 5 MB');
      return;
    }
    try {
      setIsUploading(true);
      const url = await productoService.uploadImagen(file);
      setFormData(prev => ({
        ...prev,
        imagenes: [...prev.imagenes, { url, orden: prev.imagenes.length }]
      }));
      toast.success('Imagen subida correctamente');
    } catch {
      toast.error('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(uploadFile);
    e.target.value = '';  // reset so same file can be re-selected
  };

  // ── Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(uploadFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Si no hay imágenes, el backend asignará la imagen por defecto
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
          <label className="text-sm font-medium">Precio de Oferta <span className="text-muted-foreground font-normal">(Opcional)</span></label>
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
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Stock Mínimo <span className="text-muted-foreground font-normal">(Alerta)</span></label>
          <Input 
            name="stockMinimo" 
            type="number" 
            value={formData.stockMinimo} 
            onChange={handleChange} 
          />
        </div>

        {/* ── Imágenes ── */}
        <div className="space-y-4 md:col-span-2 border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Imágenes del Producto</label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Opcional — si no subes ninguna se usará una imagen por defecto.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUrlTabActive(false)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${!urlTabActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
              >
                <UploadCloud className="h-3 w-3 inline mr-1" />Subir archivo
              </button>
              <button
                type="button"
                onClick={() => setUrlTabActive(true)}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${urlTabActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
              >
                <Link2 className="h-3 w-3 inline mr-1" />Por URL
              </button>
            </div>
          </div>

          {/* Tab: Subir archivo */}
          {!urlTabActive && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 select-none
                ${isDragging
                  ? 'border-primary bg-primary/10 scale-[1.01]'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
                }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm font-bold text-primary">Subiendo imagen...</p>
                </>
              ) : (
                <>
                  <div className={`p-3 rounded-2xl transition-colors ${isDragging ? 'bg-primary/20' : 'bg-muted'}`}>
                    <UploadCloud className={`h-8 w-8 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">
                      {isDragging ? '¡Suelta la imagen!' : 'Arrastra y suelta tus imágenes aquí'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      o <span className="text-primary font-bold">haz clic para seleccionar</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">
                      JPG · PNG · WEBP · GIF · Máx. 5 MB
                    </p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          )}

          {/* Tab: URL */}
          {urlTabActive && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input 
                  placeholder="https://ejemplo.com/imagen.jpg" 
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addImageUrl(); }
                  }}
                />
                <Button type="button" onClick={addImageUrl} variant="secondary">
                  Agregar
                </Button>
              </div>
            </div>
          )}

          {/* Galería de previews */}
          {formData.imagenes.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {formData.imagenes.map((img, index) => (
                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border-2 bg-muted shadow-sm">
                  <img
                    src={img.url}
                    alt={`Preview ${index}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/default.svg'; }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1.5 right-1.5 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow-lg"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-wider">
                      Principal
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-dashed">
              <ImageIcon className="h-6 w-6 text-muted-foreground/50 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-muted-foreground">Sin imágenes</p>
                <p className="text-[10px] text-muted-foreground">Se usará la imagen por defecto del sistema.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving || isUploading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving || isUploading}>
          {(isSaving || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {producto ? 'Actualizar Producto' : 'Crear Producto'}
        </Button>
      </div>
    </form>
  );
}
