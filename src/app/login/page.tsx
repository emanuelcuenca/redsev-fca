
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Mail, Lock, Loader2, ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const auth = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // VALIDACIÓN ESTRICTA: Esperamos a que Firebase confirme la autenticidad
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      toast({
        title: "Acceso concedido",
        description: "Bienvenido al repositorio institucional.",
      });
      router.push("/");
    } catch (error: any) {
      setLoading(false);
      // Mensaje unificado solicitado para proteger la privacidad del sistema y ser claro con el usuario
      const message = "El usuario y/o la contraseña no coinciden con nuestros registros.";
      
      toast({
        variant: "destructive",
        title: "Error de acceso",
        description: message,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-background overflow-hidden relative">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 mb-4 hover:scale-105 transition-transform">
            <Leaf className="w-10 h-10 text-primary-foreground" />
          </Link>
          <h1 className="text-sm md:text-base font-headline text-primary uppercase tracking-tighter text-center leading-tight">SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN</h1>
          <p className="text-sm md:text-base font-headline text-black uppercase tracking-tighter text-center mt-1">
            FCA - UNCA
          </p>
        </div>

        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-1 pt-8 px-8 text-center">
            <CardTitle className="text-2xl font-headline font-bold uppercase tracking-tight">Ingreso al Sistema</CardTitle>
            <CardDescription className="font-medium">
              Acceda al repositorio digital institucional.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-4 pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Correo Institucional</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="usuario@unca.edu.ar" 
                    className="pl-11 h-12 rounded-xl border-muted-foreground/20 focus:ring-primary/10 bg-white/50"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contraseña</Label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-11 h-12 rounded-xl border-muted-foreground/20 focus:ring-primary/10 bg-white/50"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">Ingresar <ArrowRight className="w-4 h-4" /></span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 px-8 pb-8 pt-2">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
            <div className="text-center space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">¿No tiene una cuenta institucional?</p>
              <Button asChild variant="outline" className="w-full h-11 rounded-xl border-primary/20 text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/5">
                <Link href="/register">
                  <UserPlus className="w-4 h-4 mr-2" /> Crear cuenta nueva
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <p className="text-[10px] text-muted-foreground text-center mt-8 font-bold uppercase tracking-widest opacity-60">
          VínculoAgro - FCA UNCA © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
