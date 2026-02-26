
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Calendar, 
  User, 
  ArrowRight,
  Plus,
  LayoutDashboard,
  Handshake,
  Sprout,
  BookOpen,
  Leaf,
  Loader2,
  LogIn,
  UserPlus,
  ShieldCheck,
  AlertTriangle,
  ArrowLeftRight,
  Fingerprint,
  Plane,
  GraduationCap,
  TrendingUp,
  BarChart3,
  Send,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query } from "firebase/firestore";
import { AgriculturalDocument, isDocumentVigente, formatPersonName } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
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

  const adminRef = useMemoFirebase(() => 
    user ? doc(db, 'roles_admin', user.uid) : null, 
    [db, user]
  );
  
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(db, 'users', user.uid) : null, 
    [db, user]
  );
  const { data: userProfile } = useDoc(userProfileRef);

  const allDocsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(db, 'documents');
  }, [db, user]);
  
  const { data: allDocuments, isLoading: isDocsLoading } = useCollection<AgriculturalDocument>(allDocsQuery);

  const stats = useMemo(() => {
    if (!allDocuments) return null;
    return {
      conveniosVigentes: allDocuments.filter(d => d.type === 'Convenio' && isDocumentVigente(d)).length,
      proyectosExtension: allDocuments.filter(d => d.type === 'Proyecto' && d.extensionDocType === 'Proyecto de Extensión').length,
      totalMovilidades: allDocuments.filter(d => d.type === 'Movilidad Estudiantil' || d.type === 'Movilidad Docente').length,
      pasantias: allDocuments.filter(d => d.type === 'Pasantía').length,
    };
  }, [allDocuments]);

  const recentDocuments = useMemo(() => {
    if (!allDocuments) return [];
    return [...allDocuments]
      .sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime())
      .slice(0, 6);
  }, [allDocuments]);

  const formattedName = userProfile?.firstName ? userProfile.firstName.toUpperCase() : (user?.displayName?.split(' ')[0]?.toUpperCase() || '');
  const isProfileIncomplete = userProfile && (!userProfile.academicRank || !userProfile.department);

  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <SidebarTrigger />
          </div>
          <div className="flex-1 flex justify-center overflow-hidden px-2">
            <div className="flex flex-col items-center leading-none text-center gap-1 w-full">
              <span className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-2xl font-headline text-primary uppercase tracking-tighter font-normal whitespace-nowrap">
                SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN
              </span>
              <span className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-2xl font-headline text-black uppercase tracking-tighter font-normal whitespace-nowrap">
                FCA - UNCA
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
             <UserMenu />
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-24">
          {user && isProfileIncomplete && (
            <div className="mb-8 p-4 bg-accent/10 border-2 border-accent/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-3">
                <div className="bg-accent p-2 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h4 className="font-headline font-black uppercase text-xs tracking-tight text-accent-foreground">Perfil Institucional Incompleto</h4>
                  <p className="text-xs text-muted-foreground font-medium">Por favor, complete su cargo y dependencia para participar plenamente del sistema.</p>
                </div>
              </div>
              <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl font-black uppercase tracking-widest text-[10px] px-6">
                <Link href="/profile">Completar ahora</Link>
              </Button>
            </div>
          )}

          <div className="mb-8 md:mb-12">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <LayoutDashboard className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl md:text-2xl font-headline font-bold tracking-tight uppercase">
                BIENVENIDO{formattedName ? `, ${formattedName}` : ''}
              </h2>
              {isAdmin && (
                <Badge className="bg-primary/20 text-primary border-primary/30 font-black text-[9px] uppercase tracking-widest px-3 py-1 animate-pulse">
                  <ShieldCheck className="w-3 h-3 mr-1.5" /> Modo Administrador
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm md:text-base font-bold max-w-4xl leading-relaxed uppercase tracking-tight">
              Repositorio Digital de la Secretaría de Extensión y Vinculación de la Facultad de Ciencias Agrarias de la UNCA.
            </p>
          </div>

          <section className="mb-12 md:mb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard 
                label="Convenios Vigentes" 
                value={stats?.conveniosVigentes || 0} 
                icon={Handshake} 
                color="text-primary"
              />
              <StatCard 
                label="Proyectos Extensión" 
                value={stats?.proyectosExtension || 0} 
                icon={ArrowLeftRight} 
                color="text-primary"
              />
              <StatCard 
                label="Movilidades" 
                value={stats?.totalMovilidades || 0} 
                icon={Plane} 
                color="text-primary"
              />
              <StatCard 
                label="Prácticas/Pasantías" 
                value={stats?.pasantias || 0} 
                icon={GraduationCap} 
                color="text-primary"
              />
            </div>
          </section>

          <section className="mb-12 md:mb-20 bg-primary/5 p-6 md:p-12 rounded-[2.5rem] border border-primary/10">
            <div className="max-w-4xl">
              <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4 md:mb-6 uppercase tracking-tight leading-tight">
                Estrategias para el Desarrollo Sustentable
              </h2>
              <p className="text-sm md:text-lg text-muted-foreground font-bold mb-10 uppercase tracking-tight">
                La FCA-UNCA trabaja bajo cuatro ejes fundamentales para asegurar la transferencia efectiva del conocimiento.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="flex gap-4">
                  <div className="bg-primary/10 p-3 rounded-2xl shrink-0 h-fit">
                    <ArrowLeftRight className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-primary uppercase tracking-tight mb-1 text-base md:text-lg">Extensión</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Interacción dialéctica entre la Universidad y los demás componentes del cuerpo social.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-primary/10 p-3 rounded-2xl shrink-0 h-fit">
                    <Handshake className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-primary uppercase tracking-tight mb-1 text-base md:text-lg">Vinculación</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Puente estratégico entre la Universidad y el medio socio-productivo.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-primary/10 p-3 rounded-2xl shrink-0 h-fit">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-primary uppercase tracking-tight mb-1 text-base md:text-lg">Formación</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Capacitación continua para profesionales y técnicos.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="bg-primary/10 p-3 rounded-2xl shrink-0 h-fit">
                    <Leaf className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-primary uppercase tracking-tight mb-1 text-base md:text-lg">Sustentabilidad</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Prácticas que garantizan la salud del ecosistema a largo plazo.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between mb-6 md:mb-8 border-b pb-4">
            <h3 className="text-lg md:text-xl font-headline font-bold uppercase tracking-tight text-primary">Documentos Recientes</h3>
            <Button asChild variant="ghost" className="font-bold text-xs uppercase tracking-widest hover:text-primary">
              <Link href="/documents">Ver todos →</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-24">
            {isDocsLoading ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-bold uppercase tracking-widest text-xs">Cargando repositorio...</p>
              </div>
            ) : (
              recentDocuments.length > 0 ? (
                recentDocuments.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} isMounted={mounted} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-muted/20 rounded-[3rem] border-2 border-dashed border-muted">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-bold uppercase tracking-tight">No hay documentos cargados aún.</p>
                </div>
              )
            )}
          </div>

          <section className="bg-primary text-primary-foreground p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-2xl md:text-4xl font-headline font-bold uppercase tracking-tight mb-4 leading-tight">
                Impulsemos juntos el desarrollo regional
              </h2>
              <p className="text-sm md:text-lg font-medium opacity-90 mb-8 leading-relaxed">
                ¿Tienes una idea de proyecto o buscas una alianza estratégica? Estamos listos para colaborar en iniciativas que generen un impacto positivo en nuestra comunidad.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-white text-primary hover:bg-white/90 h-14 px-8 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all shadow-xl shadow-black/10">
                  <Send className="w-4 h-4 mr-2" /> Enviar Propuesta
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 h-14 px-8 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all backdrop-blur-sm">
                  <Mail className="w-4 h-4 mr-2" /> Contactar a la Secretaría
                </Button>
              </div>
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) {
  return (
    <div className="flex flex-col items-center text-center p-4 transition-transform hover:scale-105 duration-300">
      <div className={cn("mb-3", color)}>
        <Icon className="w-12 h-12" />
      </div>
      <div className="text-4xl font-black font-headline tracking-tighter leading-none mb-1 text-primary">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest leading-tight text-muted-foreground max-w-[120px]">{label}</div>
    </div>
  );
}

function DocumentCard({ document, isMounted }: { document: AgriculturalDocument, isMounted: boolean }) {
  const displayDate = document.date || document.uploadDate;
  
  return (
    <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-500 flex flex-col h-full bg-card rounded-3xl border-2 border-muted/20 hover:border-primary/5">
      <CardHeader className="p-6 pb-2 flex-grow">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="secondary" className="bg-primary/10 text-primary shadow-sm font-black text-[9px] px-3 py-1 uppercase tracking-widest border-none">
            {document.type}
          </Badge>
          <div className="text-primary/40"><FileText className="w-5 h-5" /></div>
        </div>
        <CardTitle className="text-lg md:text-xl font-headline font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {document.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 mt-3 font-black text-[10px] md:text-xs uppercase tracking-widest text-primary/70">
          <Calendar className="w-4 h-4" /> 
          {isMounted && displayDate ? new Date(displayDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : '...'}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-4 flex flex-col gap-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground font-bold">
          <User className="w-4 h-4 text-primary" />
          <span className="truncate">{document.authors?.map(a => formatPersonName(a)).join(', ') || 'Responsable SEyV'}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {document.projectCode && (
            <Badge variant="outline" className="text-[9px] uppercase tracking-[0.1em] py-0.5 font-bold border-primary/20 text-primary bg-primary/5">
              <Fingerprint className="w-3 h-3 mr-1" /> {document.projectCode}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-6 mt-auto border-t border-dashed">
        <Link 
          href={`/documents/${document.id}`} 
          className="flex items-center gap-2 w-full justify-between text-primary hover:text-primary/80 font-black text-sm md:text-base transition-colors group/link"
        >
          ACCEDER AL REGISTRO 
          <ArrowRight className="w-5 h-5 group-hover/link:translate-x-2 transition-transform" />
        </Link>
      </CardFooter>
    </Card>
  );
}
