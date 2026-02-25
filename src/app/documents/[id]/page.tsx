
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
  Pencil,
  Target,
  Users
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AgriculturalDocument, isDocumentVigente, formatPersonName } from "@/lib/mock-data";
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
    if (mounted && !isUserLoading && !user) router.push('/login');
  }, [user, isUserLoading, mounted, router]);

  const docRef = useMemoFirebase(() => (resolvedParams.id && user) ? doc(db, 'documents', resolvedParams.id) : null, [db, resolvedParams.id, user]);
  const { data: documentData, isLoading } = useDoc<AgriculturalDocument>(docRef);
  const adminRef = useMemoFirebase(() => user ? doc(db, 'roles_admin', user.uid) : null, [db, user]);
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
          <Button asChild className="w-full rounded-xl mt-6"><Link href="/documents">Volver</Link></Button>
        </Card>
      </div>
    );
  }

  const displayDate = documentData.date || documentData.uploadDate;
  const isConvenio = documentData.type === 'Convenio';
  const isProyecto = documentData.type === 'Proyecto';
  const isMobilityLike = documentData.type === 'Movilidad Estudiantil' || documentData.type === 'Movilidad Docente' || documentData.type === 'Pasantía';
  const isExtensionProyecto = isProyecto && documentData.extensionDocType === "Proyecto de Extensión";
  const vigente = isDocumentVigente(documentData);
  const counterparts = documentData.counterparts || (documentData.counterpart ? [documentData.counterpart] : []);

  const getDocIcon = () => {
    switch (documentData.type) {
      case 'Convenio': return <Handshake className="w-5 h-5 text-primary" />;
      case 'Proyecto': return <ArrowLeftRight className="w-5 h-5 text-primary" />;
      case 'Movilidad Estudiantil': return <Plane className="w-5 h-5 text-primary" />;
      case 'Movilidad Docente': return <User className="w-5 h-5 text-primary" />;
      case 'Pasantía': return <GraduationCap className="w-5 h-5 text-primary" />;
      case 'Resolución': return <ScrollText className="w-5 h-5 text-primary" />;
      default: return <FileText className="w-5 h-5 text-primary" />;
    }
  };

  const formatDateString = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0"><SidebarTrigger /></div>
          <div className="flex-1 flex justify-center text-center"><span className="text-[12px] md:text-xl font-headline text-primary uppercase font-bold tracking-tight">Detalle del Registro</span></div>
          <div className="flex items-center gap-3 shrink-0">
            {isAdmin && (
              <Button asChild variant="outline" size="sm" className="hidden sm:flex rounded-xl gap-2 h-8 text-xs font-bold border-primary text-primary hover:bg-primary/5">
                <Link href={`/documents/${resolvedParams.id}/edit`}><Pencil className="w-4 h-4" /> Editar</Link>
              </Button>
            )}
            <UserMenu />
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-5xl mx-auto w-full pb-20">
          <section className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-muted shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b pb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-2xl">{getDocIcon()}</div>
                <div>
                  <h1 className="text-xl md:text-3xl font-headline font-bold tracking-tight text-primary leading-tight">{documentData.title}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-primary/10 text-primary border-primary/20 h-7 px-3 text-[10px] font-black uppercase tracking-widest">
                      {documentData.extensionDocType || documentData.type}
                    </Badge>
                    {isConvenio && <Badge className={`h-7 px-3 text-[10px] font-black uppercase tracking-widest ${vigente ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{vigente ? 'Vigente' : 'Vencido'}</Badge>}
                  </div>
                </div>
              </div>
              <Button className="rounded-xl bg-white text-primary border-primary/20 hover:bg-primary/5 h-10 shadow-sm font-bold" variant="outline" asChild>
                <a href={documentData.fileUrl} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4 mr-2" /> Ver PDF</a>
              </Button>
            </div>

            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary border-b pb-2">Datos Principales</h3>
                  <div className="space-y-6">
                    {isMobilityLike ? (
                      <div className="flex items-start gap-3">
                        <Timer className="w-5 h-5 text-primary/60 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Período de {documentData.type === 'Pasantía' ? 'Práctica/Pasantía' : 'Movilidad'}</p>
                          <p className="font-bold text-sm">Desde: {formatDateString(documentData.mobilityStartDate)}</p>
                          <p className="font-bold text-sm">Hasta: {formatDateString(documentData.mobilityEndDate)}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary/60" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{isConvenio ? "Fecha de Firma" : "Fecha de Registro"}</p>
                          <p className="font-bold text-sm">{mounted && displayDate ? new Date(displayDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</p>
                        </div>
                      </div>
                    )}

                    {isExtensionProyecto && documentData.director && (
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-primary/60" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Director del Proyecto</p>
                          <p className="font-bold text-sm">{formatPersonName(documentData.director)}</p>
                        </div>
                      </div>
                    )}
                    {documentData.authors && documentData.authors.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-primary/60 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                            {isExtensionProyecto ? "Equipo Técnico" : (isMobilityLike || isConvenio ? "Responsables Institucionales" : "Responsables")}
                          </p>
                          <div className="mt-1 space-y-1">
                            {documentData.authors.map((a, i) => (
                              <p key={i} className="font-bold text-sm">{formatPersonName(a)}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    {documentData.projectCode && (
                      <div className="flex items-center gap-3">
                        <Fingerprint className="w-5 h-5 text-primary/60" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{isMobilityLike ? "Resolución" : "Código Institucional"}</p>
                          <p className="font-bold text-sm text-primary">{documentData.projectCode}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary border-b pb-2">
                    {isMobilityLike ? "Información de Destino" : "Instituciones"}
                  </h3>
                  {isMobilityLike ? (
                    <div className="space-y-6">
                      <div className="flex items-start gap-3 bg-muted/20 p-4 rounded-xl border border-muted">
                        <Building2 className="w-5 h-5 text-primary/60 mt-0.5" />
                        <div>
                          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                            {documentData.type === 'Pasantía' ? 'Institución/Empresa' : 'Institución/Universidad'}
                          </p>
                          <p className="font-bold text-sm">{documentData.mobilityInstitution || 'No especificada'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-muted/20 p-4 rounded-xl border border-muted">
                        <MapPin className="w-5 h-5 text-primary/60 mt-0.5" />
                        <div>
                          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Ubicación</p>
                          <p className="font-bold text-sm">{documentData.mobilityState}, {documentData.mobilityCountry}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {counterparts.length > 0 ? counterparts.map((cp, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl border border-muted"><Building2 className="w-5 h-5 text-primary/60" /><p className="font-bold text-sm">{cp}</p></div>
                      )) : <p className="text-xs font-bold text-muted-foreground italic">Sin instituciones registradas</p>}
                    </div>
                  )}
                </div>
              </div>

              {isExtensionProyecto && documentData.objetivoGeneral && (
                <div className="bg-primary/[0.03] p-8 rounded-[2rem] border border-primary/10">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2"><Target className="w-4 h-4" /> Objetivo General</h3>
                  <p className="text-sm leading-relaxed font-medium text-muted-foreground">{documentData.objetivoGeneral}</p>
                </div>
              )}
              {isExtensionProyecto && documentData.objetivosEspecificos && documentData.objetivosEspecificos.length > 0 && (
                <div className="bg-white p-8 rounded-[2rem] border border-muted shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2"><ListTodo className="w-4 h-4" /> Objetivos Específicos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {documentData.objetivosEspecificos.map((obj, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-muted/10 rounded-xl border border-muted/20">
                        <div className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black">{i + 1}</div>
                        <p className="text-xs font-medium leading-relaxed">{obj}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {documentData.description && (
                <div className="bg-primary/[0.03] p-8 rounded-[2rem] border border-primary/10">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Resumen / Descripción</h3>
                  <p className="text-sm leading-relaxed font-medium text-muted-foreground whitespace-pre-wrap">{documentData.description}</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
