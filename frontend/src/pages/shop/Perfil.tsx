import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

interface PerfilData {
  nombre: string;
  apellido: string;
  telefono: string;
  documentoIdentidad: string;
}

export default function Perfil() {
  const usuario = useAuthStore((s) => s.usuario);
  const [form, setForm] = useState<PerfilData>({ nombre: '', apellido: '', telefono: '', documentoIdentidad: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cargar datos actuales del backend
    const fetchPerfil = async () => {
      try {
        const res = await api.get('/clientes/perfil');
        const data = res.data.data;
        setForm({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          telefono: data.telefono || '',
          documentoIdentidad: data.documentoIdentidad || '',
        });
      } catch (error) {
        toast.error('Error al cargar el perfil');
      }
    };
    fetchPerfil();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/clientes/perfil', form); // Endpoint asumido del backend
      toast.success('Perfil actualizado correctamente');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y preferencias de contacto.</p>
        </div>

        <div className="grid gap-8">
          {/* Información de Cuenta */}
          <div className="border rounded-2xl p-6 bg-primary/5 border-primary/10 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-primary/60">Cuenta de Usuario</p>
              <p className="font-bold text-lg text-primary">{usuario?.correo}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-8">
            <div className="border rounded-2xl p-6 md:p-8 bg-card shadow-sm ring-1 ring-border/50 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Nombre</label>
                  <Input 
                    value={form.nombre} 
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })} 
                    required 
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Apellido</label>
                  <Input 
                    value={form.apellido} 
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })} 
                    required 
                    className="h-11"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">DNI / Documento de Identidad</label>
                <Input 
                  value={form.documentoIdentidad} 
                  onChange={(e) => setForm({ ...form, documentoIdentidad: e.target.value })} 
                  maxLength={8} 
                  className="h-11"
                  placeholder="8 dígitos"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Teléfono</label>
                <Input 
                  value={form.telefono} 
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })} 
                  maxLength={9} 
                  className="h-11"
                  placeholder="9 dígitos"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Guardando cambios...
                </div>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}