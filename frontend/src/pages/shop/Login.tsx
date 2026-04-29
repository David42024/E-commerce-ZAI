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
    <div className="flex min-h-screen items-center justify-center bg-background dark:bg-background/95">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-6 rounded-3xl border dark:border-primary/10 p-8 shadow-xl dark:shadow-primary/5 bg-card dark:bg-card/50 backdrop-blur-sm">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-black tracking-tight">Bienvenido</h2>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground/80">Ingresa tus credenciales para continuar</p>
        </div>
        <div className="space-y-4">
          <Input 
            placeholder="Correo electrónico" 
            type="email" 
            value={correo} 
            onChange={(e) => setCorreo(e.target.value)} 
            required 
            className="h-12 px-4 rounded-xl bg-background dark:bg-muted/10"
          />
          <Input 
            placeholder="Contraseña" 
            type="password" 
            value={contrasena} 
            onChange={(e) => setContrasena(e.target.value)} 
            required 
            className="h-12 px-4 rounded-xl bg-background dark:bg-muted/10"
          />
        </div>
        <Button type="submit" className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
          Entrar
        </Button>
        <p className="text-center text-xs text-muted-foreground dark:text-muted-foreground/60">
          ¿No tienes una cuenta? <span className="text-primary font-bold cursor-pointer hover:underline">Regístrate</span>
        </p>
      </form>
    </div>
  );
}