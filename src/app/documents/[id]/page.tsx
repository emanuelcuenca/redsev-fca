
"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Calendar, 
  User, 
  Tag,
  Loader2,
  FileText,
  Eye,
  Handshake,
  Building2,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Plane,
  UserCheck,
  Timer,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
  ScrollText,
  Clock,
  Fingerprint,
  MapPin,
  Globe,
  Landmark,
  ListTodo,
  CheckSquare,
  LayoutGrid,
  RotateCcw,
  Pencil
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AgriculturalDocument, isDocumentVigente } from "@/lib/mock-data";
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, mounted, router]);

  const docRef = useMemoFirebase(() => 
    (resolvedParams.id && user) ? doc(db, 'documents', resolvedParams.id) : null, 
    [db, resolvedParams.id, user]
  );
  
  const { data: documentData, isLoading } = useDoc<AgriculturalDocument>(docRef);

  const adminRef = useMemoFirebase(() => 
    user ? doc(db, 'roles_admin', user.uid) : null, 
    [db, user]
  );
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  if (isUserLoading || isLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="font-headline font-bold uppercase tracking-widest text-xs text-muted-foreground">Accediendo al archivo...</p>
        </div>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-8 text-center rounded-[2rem]">
          <FileText className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
          <h2 className="text-xl font-headline font-bold uppercase mb-2">Archivo no encontrado</h2>
          <p className="text-muted-foreground text-sm mb-6">El documento solicitado no existe o ha sido removido del repositorio.</p>
          <Button asChild className="w-full rounded-xl">
            <Link href="/documents">Volver al listado</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const displayDate = documentData.date || documentData.uploadDate;
  const isConvenio = documentData.type === 'Convenio';
  const isProyecto = documentData.type === 'Proyecto';
  const isPasantia = documentData.type === 'Pasantía';
  const isMovilidad = documentData.type === 'Movilidad';
  const vigente = isDocumentVigente(documentData);

  const counterparts = documentData.counterparts || (documentData.counterpart ? [documentData.counterpart] : []);

  const getDocIcon = () => {
    switch (documentData.type) {
      case 'Convenio': return <Handshake className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
      case 'Proyecto': return <ArrowLeftRight className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
      case 'Movilidad': return <Plane className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
      case 'Pasantía': return <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
      case 'Resolución': return <ScrollText className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
      default: return <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
    }
  };

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0"><SidebarTrigger /></div>
          <div className="flex-1 flex justify-center overflow-hidden px-2">
            <div className="flex flex-col items-center leading-none text-center gap-1 w-full">
              <span className="text-[12px] md:text-2xl font-headline text-primary uppercase tracking-tighter">SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN</span>
              <span className="text-[12px] md:text-2xl font-headline text-black uppercase tracking-tighter">FCA - UNCA</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isAdmin && (
              <Button asChild variant="outline" size="sm" className="hidden sm:flex rounded-xl gap-2 h-8 text-xs font-bold border-primary text-primary hover:bg-primary/5">
                <Link href={`/documents/${resolvedParams.id}/edit`}><Pencil className="w-4 h-4" /> Editar</Link>
              </Button>
            )}
            <UserMenu />
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-5xl mx-auto w-full">
          <div className="space-y-6 md:space-y-8">
            <section className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-muted shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b pb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-2xl">{getDocIcon()}</div>
                  <div>
                    <h1 className="text-xl md:text-3xl font-headline font-bold tracking-tight text-primary leading-tight">{documentData.title}</h1>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20 h-7 px-3 text-[10px] font-black uppercase tracking-widest">{documentData.type}</Badge>
                      {isConvenio && (
                        <Badge className={`h-7 px-3 text-[10px] font-black uppercase tracking-widest ${vigente ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                          {vigente ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {vigente ? 'Vigente' : 'Vencido'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button className="rounded-xl bg-white text-primary border-primary/20 hover:bg-primary/5 h-10 shadow-sm font-bold" variant="outline" asChild>
                  <a href={documentData.fileUrl} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4 mr-2" /> Ver PDF</a>
                </Button>
              </div>

              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6">
                  <div className="space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary border-b pb-2">Datos Principales</h3>
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary/60" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Fecha de Firma / Referencia</p>
                          <p className="font-bold text-sm">
                            {mounted && displayDate ? new Date(displayDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {documentData.authors && documentData.authors.length > 0 && (
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-primary/60" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Responsables SEyV / Autores</p>
                            <p className="font-bold text-sm">{documentData.authors.join(', ')}</p>
                          </div>
                        </div>
                      )}
                      {(documentData.projectCode || documentData.executionPeriod) && (
                        <div className="flex items-center gap-3">
                          <Fingerprint className="w-5 h-5 text-primary/60" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Identificación Institucional</p>
                            <p className="font-bold text-sm text-primary">
                              {documentData.projectCode || 'N/A'} {documentData.executionPeriod ? `| Período: ${documentData.executionPeriod}` : ''}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary border-b pb-2">Partes Intervinientes</h3>
                    <div className="space-y-6">
                      {counterparts.length > 0 ? (
                        <div className="space-y-4">
                          {counterparts.map((cp, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl border border-muted">
                              <Building2 className="w-5 h-5 text-primary/60" />
                              <div className="overflow-hidden">
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest truncate">Institución Contraparte</p>
                                <p className="font-bold text-sm truncate">{cp}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 opacity-50">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                          <p className="text-sm font-bold text-muted-foreground italic">No hay contrapartes registradas</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {documentData.description && (
                  <div className="bg-primary/[0.03] p-8 rounded-[2rem] border border-primary/10">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Descripción y Objetivos
                    </h3>
                    <p className="text-sm leading-relaxed font-medium text-muted-foreground whitespace-pre-wrap">
                      {documentData.description}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
