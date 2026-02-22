"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Mail, Lock, Loader2, ArrowRight } from "lucide-center";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulación de autenticación
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-background overflow-hidden relative">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 mb-4">
            <Leaf className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-headline font-bold text-foreground tracking-tight text-center uppercase">FCA - UNCA</h1>
          <p className="text-primary font-bold text-center mt-1 text-sm tracking-widest uppercase">
            Secretaría de Extensión y Vinculación
          </p>
        </div>

        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 pt-8 px-8 text-center">
            <CardTitle className="text-2xl font-headline font-bold">Repositorio Digital</CardTitle>
            <CardDescription>
              Acceda al sistema de gestión de documentos oficiales.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold">Correo Institucional</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="usuario@unca.edu.ar" 
                    className="pl-10 h-12 rounded-xl focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" title="password" className="text-sm font-semibold">Contraseña</Label>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10 h-12 rounded-xl focus:ring-primary/20"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">Ingresar <ArrowRight className="w-5 h-5" /></span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="bg-muted/50 p-6 flex justify-center border-t border-muted">
            <p className="text-xs text-muted-foreground text-center">
              El acceso para carga de documentos está restringido exclusivamente al personal de la Secretaría.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
