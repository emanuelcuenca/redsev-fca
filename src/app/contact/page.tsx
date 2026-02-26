
"use client";

import { useState, useEffect } from "react";
import { 
  Info, 
  Mail, 
  MapPin, 
  Globe, 
  Users, 
  Building2, 
  Loader2, 
  ChevronRight,
  User
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";

export default function ContactPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, mounted, router]);

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const AUTHORITIES = [
    {
      role: "Secretario de Extensión y Vinculación",
      name: "Ing. Agr. (Mgter.) Emanuel Cuenca",
      email: "ecuenca@unca.edu.ar",
      institution: "Secretaría SEyV",
      icon: Users
    },
    {
      role: "Director/a de Extensión",
      name: "A designar",
      email: "",
      institution: "Secretaría SEyV",
      icon: User
    }
  ];

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0"><SidebarTrigger /></div>
          <div className="flex-1 flex justify-center overflow-hidden px-2">
            <div className="flex flex-col items-center leading-none text-center gap-1 w-full">
              <span className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-2xl font-headline text-primary uppercase tracking-tighter font-normal whitespace-nowrap">SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN</span>
              <span className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-2xl font-headline text-black uppercase tracking-tighter font-normal whitespace-nowrap">FCA - UNCA</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0"><UserMenu /></div>
        </header>

        <main className="p-4 md:p-8 max-w-5xl mx-auto w-full pb-24">
          <div className="flex items-center gap-3 mb-8 md:mb-12">
            <div className="bg-primary/10 p-2.5 rounded-xl"><Info className="w-6 h-6 text-primary" /></div>
            <div>
              <h2 className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight">Autoridades y Contacto</h2>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Secretaría de Extensión y Vinculación</p>
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {AUTHORITIES.map((auth, idx) => (
              <Card key={idx} className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                <CardHeader className="bg-primary/5 p-6 border-b border-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <auth.icon className="w-6 h-6 text-primary/60" />
                    <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5">{auth.institution}</Badge>
                  </div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{auth.role}</p>
                  <CardTitle className="text-lg font-headline font-bold uppercase text-primary leading-tight">
                    {auth.name}
                  </CardTitle>
                  {auth.email && (
                    <p className="text-[11px] font-medium text-muted-foreground mt-1 lowercase">
                      {auth.email}
                    </p>
                  )}
                </CardHeader>
              </Card>
            ))}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <section className="space-y-8">
              <div>
                <h3 className="text-xl font-headline font-bold uppercase text-primary mb-6 flex items-center gap-3">
                  <Mail className="w-5 h-5" /> Canales de Consulta
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-6 bg-white rounded-3xl border border-muted shadow-sm group transition-all hover:border-primary/30">
                    <div className="bg-primary/10 p-3 rounded-2xl text-primary"><Mail className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Correo Institucional</p>
                      <p className="font-bold text-sm md:text-base break-all">sev@agrarias.unca.edu.ar</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-headline font-bold uppercase text-primary mb-6 flex items-center gap-3">
                  <MapPin className="w-5 h-5" /> Dirección
                </h3>
                <div className="flex items-start gap-4 p-6 bg-white rounded-3xl border border-muted shadow-sm group transition-all hover:border-primary/30">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary"><Building2 className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Dirección de la Secretaría</p>
                    <p className="font-bold text-sm md:text-base leading-snug">
                      Maestro Quiroga 35.<br />
                      Planta Baja.<br />
                      San Fernando del Valle de Catamarca.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-primary/5 p-8 md:p-12 rounded-[3rem] border border-primary/10 h-full flex flex-col justify-center">
              <div className="space-y-6 text-center lg:text-left">
                <div className="bg-primary w-16 h-16 rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center mx-auto lg:mx-0 mb-4">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-headline font-bold uppercase text-primary tracking-tight">Presencia Digital</h2>
                <p className="text-muted-foreground font-medium leading-relaxed uppercase text-xs tracking-wide">
                  La Facultad de Ciencias Agrarias de la Universidad Nacional de Catamarca promueve el acceso a la información y la vinculación permanente con el medio socio-productivo.
                </p>
                <div className="pt-6 border-t border-primary/10">
                  <a href="https://agrarias.unca.edu.ar" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-black text-primary uppercase text-[10px] tracking-[0.2em] hover:opacity-80 transition-all">
                    Visitar Sitio Web Oficial <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </section>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
