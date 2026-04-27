import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authService.login(correo, contrasena);
      setAuth(res.data.accessToken, res.data.usuario);
      toast.success('Inicio de sesión exitoso');
      
      // Redirección basada en roles
      const roles = res.data.usuario.roles || [];
      if (roles.includes('ADMIN') || roles.includes('MANAGER') || roles.includes('SUPER_ADMIN')) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 rounded-lg border p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-center">Iniciar Sesión</h2>
        <Input placeholder="Correo electrónico" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        <Input placeholder="Contraseña" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required />
        <Button type="submit" className="w-full">Entrar</Button>
      </form>
    </div>
  );
}