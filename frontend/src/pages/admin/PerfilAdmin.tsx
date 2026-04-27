import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Mail, Phone, CreditCard, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface PerfilData {
  nombre: string;
  apellido: string;
  telefono: string;
  documentoIdentidad: string;
}

export default function PerfilAdmin() {
  const usuario = useAuthStore((s) => s.usuario);
  const [form, setForm] = useState<PerfilData>({ 
    nombre: '', 
    apellido: '', 
    telefono: '', 
    documentoIdentidad: '' 
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
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
      } finally {
        setFetching(false);
      }
    };
    fetchPerfil();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/clientes/perfil', form);
      toast.success('Perfil actualizado correctamente');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Perfil de Administrador</h1>
        <p className="text-muted-foreground">Gestiona tu información personal y de acceso al panel administrativo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna Izquierda: Resumen de Cuenta */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <User className="h-10 w-10 text-primary" />
              </div>
              <CardTitle>{form.nombre} {form.apellido}</CardTitle>
              <CardDescription>{usuario?.correo}</CardDescription>
              <div className="flex justify-center mt-2">
                <Badge variant="outline" className="flex items-center gap-1 border-primary/30 bg-primary/5 text-primary">
                  <Shield className="h-3 w-3" />
                  Administrador
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{usuario?.correo}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Roles: {usuario?.roles.join(', ')}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Formulario de Edición */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Actualiza tus datos de contacto y personales.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Nombre</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={form.nombre} 
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })} 
                        required 
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Apellido</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={form.apellido} 
                        onChange={(e) => setForm({ ...form, apellido: e.target.value })} 
                        required 
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">DNI / Documento de Identidad</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={form.documentoIdentidad} 
                      onChange={(e) => setForm({ ...form, documentoIdentidad: e.target.value })} 
                      maxLength={8} 
                      className="pl-9"
                      placeholder="8 dígitos"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={form.telefono} 
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })} 
                      maxLength={9} 
                      className="pl-9"
                      placeholder="9 dígitos"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full md:w-auto px-8"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Guardando...
                      </div>
                    ) : (
                      'Actualizar Perfil'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
