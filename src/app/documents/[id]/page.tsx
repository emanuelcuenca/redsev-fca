
"use client";

import { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Loader2,
  FileText,
  Eye,
  Handshake,
  Building2,
  BookOpen,
  GraduationCap,
  Plane,
  ArrowLeftRight,
  ScrollText,
  Fingerprint,
  MapPin,
  ListTodo,
  Pencil,
  Target,
  Users,
  ChevronRight,
  History,
  AlertTriangle,
  Lock,
  Clock,
  CheckCircle2,
  Send,
  Files,
  ExternalLink
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AgriculturalDocument, isDocumentVigente, formatPersonName } from "@/lib/mock-data";
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection, addDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [mounted, setMounted] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isUserLoading && !user) router.push('/login');
  }, [user, isUserLoading, mounted, router]);

  const docRef = useMemoFirebase(() => (resolvedParams.id && user) ? doc(db, 'documents', resolvedParams.id) : null, [db, resolvedParams.id, user]);
  const { data: documentData, isLoading, error: docError } = useDoc<AgriculturalDocument>(docRef);

  // Consulta de documentos relacionados (Expediente Unificado)
  const relatedDocsQuery = useMemoFirebase(() => {
    if (!documentData?.projectCode || !user) return null;
    return query(collection(db, 'documents'), where('projectCode', '==', documentData.projectCode));
  }, [db, documentData?.projectCode, user]);
  const { data: relatedDocs } = useCollection<AgriculturalDocument>(relatedDocsQuery);

  // Verificación de roles
  const adminRef = useMemoFirebase(() => user ? doc(db, 'roles_admin', user.uid) : null, [db, user]);
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  const authRef = useMemoFirebase(() => user ? doc(db, 'roles_authority', user.uid) : null, [db, user]);
  const { data: authDoc } = useDoc(authRef);
  const isAuthority = !!authDoc || isAdmin;

  // Verificación de solicitud de acceso
  const requestQuery = useMemoFirebase(() => {
    if (!user || !resolvedParams.id) return null;
    return query(collection(db, 'access_requests'), where('userId', '==', user.uid), where('documentId', '==', resolvedParams.id));
  }, [db, user, resolvedParams.id]);
  const { data: requests } = useCollection(requestQuery);
  
  const activeRequest = requests?.[0];
  const canViewFile = isAuthority || activeRequest?.status === 'approved';

  const masterProject = useMemo(() => {
    if (!relatedDocs) return null;
    return relatedDocs.find(d => d.type === 'Proyecto' && d.extensionDocType === 'Proyecto de Extensión') || null;
  }, [relatedDocs]);

  const handleRequestAccess = () => {
    if (!user || !documentData) return;
    setIsRequesting(true);
    addDocumentNonBlocking(collection(db, 'access_requests'), {
      userId: user.uid,
      userName: user.displayName || user.email?.split('@')[0] || "Usuario",
      userEmail: user.email,
      documentId: resolvedParams.id,
      documentTitle: documentData.title,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    toast({ title: "Solicitud enviada", description: "Un administrador revisará su pedido pronto." });
    setIsRequesting(false);
  };

  const getButtonLabel = (type?: string, subType?: string) => {
    if (subType === 'Proyecto de Extensión') return "Ver Proyecto";
    if (subType === 'Resolución de aprobación' || type === 'Resolución') return "Ver Resolución";
    if (subType === 'Informe de avance' || subType === 'Informe final') return "Ver Informe";
    if (type === 'Convenio') return "Ver Convenio";
    if (type === 'Movilidad Estudiantil' || type === 'Movilidad Docente') return "Ver Movilidad";
    if (type === 'Pasantía') return "Ver Pasantía";
    return "Ver Documento";
  };

  if (isUserLoading || isLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (docError || !documentData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center rounded-[2rem] bg-destructive/5 border-destructive/20">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-headline font-bold uppercase mb-2">Error de Acceso</h2>
          <p className="text-sm text-muted-foreground mb-6">No tiene permisos para ver este registro.</p>
          <Button asChild className="w-full rounded-xl bg-destructive"><Link href="/documents">Volver</Link></Button>
        </Card>
      </div>
    );
  }

  const displayDate = documentData.date || documentData.uploadDate;
  const isConvenio = documentData.type === 'Convenio';
  const isProyecto = documentData.type === 'Proyecto';
  const isExtensionProyecto = isProyecto && documentData.extensionDocType === "Proyecto de Extensión";
  const isMobilityLike = ['Movilidad Estudiantil', 'Movilidad Docente', 'Pasantía'].includes(documentData.type);
  
  const objectiveContext = (isProyecto && documentData.extensionDocType === "Proyecto de Extensión") ? documentData.objetivoGeneral : masterProject?.objetivoGeneral;
  const specificObjectivesContext = (isProyecto && documentData.extensionDocType === "Proyecto de Extensión") ? documentData.objetivosEspecificos : masterProject?.objetivosEspecificos;
  const directorContext = (isProyecto && documentData.extensionDocType === "Proyecto de Extensión") ? documentData.director : masterProject?.director;

  const getDocIcon = (type?: string) => {
    switch (type || documentData.type) {
      case 'Convenio': return <Handshake className="w-5 h-5" />;
      case 'Proyecto': return <ArrowLeftRight className="w-5 h-5" />;
      case 'Movilidad Estudiantil': case 'Movilidad Docente': return <Plane className="w-5 h-5" />;
      case 'Pasantía': return <GraduationCap className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0"><SidebarTrigger /></div>
          <div className="flex-1 flex justify-center text-center">
            <span className="text-xs md:text-lg font-headline text-primary uppercase font-bold tracking-tight truncate max-w-[250px] md:max-w-md">
              {documentData.projectCode || 'Detalle del Registro'}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isAdmin && (
              <Button asChild variant="outline" size="sm" className="hidden sm:flex rounded-xl gap-2 border-primary text-primary">
                <Link href={`/documents/${resolvedParams.id}/edit`}><Pencil className="w-4 h-4" /> Editar</Link>
              </Button>
            )}
            <UserMenu />
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-5xl mx-auto w-full pb-32">
          {/* BANNER DE EXPEDIENTE UNIFICADO */}
          {documentData.projectCode && (
            <div className="mb-8 p-4 bg-primary text-white rounded-2xl flex items-center justify-between shadow-lg shadow-primary/20">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg"><Files className="w-5 h-5" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none mb-1">Expediente Digital Unificado</p>
                  <h2 className="text-lg font-headline font-bold uppercase tracking-tight">{documentData.projectCode}</h2>
                </div>
              </div>
              <div className="hidden md:block text-right">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{relatedDocs?.length || 0} Trámites Registrados</p>
              </div>
            </div>
          )}

          {/* SECCIÓN 1: CABECERA Y ACCIONES */}
          <section className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-muted shadow-sm mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b pb-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-2xl text-primary">{getDocIcon()}</div>
                <div>
                  <h1 className="text-xl md:text-3xl font-headline font-bold text-primary leading-tight">{documentData.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge className="bg-primary/10 text-primary uppercase font-black text-[9px] px-3">{documentData.extensionDocType || documentData.type}</Badge>
                    {isConvenio && <Badge className={`text-[9px] font-black uppercase ${isDocumentVigente(documentData) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{isDocumentVigente(documentData) ? 'Vigente' : 'Vencido'}</Badge>}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {canViewFile ? (
                  <Button className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20" asChild>
                    <a href={documentData.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Eye className="w-4 h-4 mr-2" /> {getButtonLabel(documentData.type, documentData.extensionDocType)}
                    </a>
                  </Button>
                ) : activeRequest?.status === 'pending' ? (
                  <Button disabled className="rounded-xl h-12 bg-muted text-muted-foreground font-black uppercase text-[10px] tracking-widest">
                    <Clock className="w-4 h-4 mr-2" /> Solicitud Pendiente
                  </Button>
                ) : activeRequest?.status === 'denied' ? (
                  <div className="text-center">
                    <Badge variant="destructive" className="font-black text-[9px] uppercase px-4 h-8 mb-1">Acceso Denegado</Badge>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Contacte a la Secretaría</p>
                  </div>
                ) : (
                  <Button 
                    onClick={handleRequestAccess} 
                    disabled={isRequesting}
                    className="rounded-xl h-12 px-6 bg-accent text-accent-foreground hover:bg-accent/90 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-accent/20"
                  >
                    {isRequesting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />} 
                    Solicitar Acceso
                  </Button>
                )}
              </div>
            </div>

            <div className={cn("grid grid-cols-1 gap-10", (!isExtensionProyecto && !isProyecto) && "md:grid-cols-2")}>
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2">Gestión Institucional</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary/60" />
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase font-black">Fecha del Registro</p>
                      <p className="font-bold text-sm">{displayDate ? new Date(displayDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</p>
                    </div>
                  </div>
                  {directorContext && (
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-primary/60" />
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase font-black">Director Responsable</p>
                        <p className="font-bold text-sm">{formatPersonName(directorContext)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!isExtensionProyecto && !isProyecto && (
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary border-b pb-2">Instituciones y Ubicación</h3>
                  <div className="space-y-3">
                    {isMobilityLike && (
                      <div className="p-4 bg-muted/20 rounded-xl space-y-2 border border-muted">
                        <div className="flex gap-2 items-center"><Building2 className="w-4 h-4 text-primary/60" /><p className="font-bold text-xs">{documentData.mobilityInstitution || 'No especificada'}</p></div>
                        <div className="flex gap-2 items-center"><MapPin className="w-4 h-4 text-primary/60" /><p className="font-bold text-xs">{documentData.mobilityState}, {documentData.mobilityCountry}</p></div>
                      </div>
                    )}
                    {documentData.counterparts?.map((cp, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-muted/10 rounded-xl"><Building2 className="w-4 h-4 text-primary/60" /><p className="font-bold text-xs">{cp}</p></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SECCIÓN 2: OBJETIVOS Y DESCRIPCIÓN */}
          {(objectiveContext || documentData.description) && (
            <section className="space-y-8 mb-12">
              {objectiveContext && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-muted">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2"><Target className="w-4 h-4" /> Objetivo General del Proyecto</h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">{objectiveContext}</p>
                </div>
              )}
              {specificObjectivesContext && specificObjectivesContext.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {specificObjectivesContext.map((obj, i) => (
                    <div key={i} className="flex gap-3 p-4 bg-primary/[0.02] border rounded-2xl items-start">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div>
                      <p className="text-xs font-medium">{obj}</p>
                    </div>
                  ))}
                </div>
              )}
              {documentData.description && !objectiveContext && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-muted">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2"><ScrollText className="w-4 h-4" /> Descripción / Resumen del Registro</h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">{documentData.description}</p>
                </div>
              )}
            </section>
          )}

          {/* SECCIÓN 3: RESUMEN DEL EXPEDIENTE (SOLO ASOCIADOS) */}
          {documentData.projectCode && (
            <section className="mt-12 space-y-8">
              <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-4">
                <div className="bg-primary/10 p-2.5 rounded-xl"><History className="w-6 h-6 text-primary" /></div>
                <div>
                  <h3 className="text-xl font-headline font-bold uppercase tracking-tight text-primary">Resumen del Expediente</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Código institucional: {documentData.projectCode}</p>
                </div>
              </div>
              
              <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
                <CardContent className="p-0">
                  {/* Título unificado del proyecto al inicio */}
                  <div className="bg-primary/5 p-8 md:p-12 border-b">
                    <p className="text-[9px] font-black uppercase text-primary/60 tracking-[0.2em] mb-2">Título del Proyecto</p>
                    <h2 className="text-2xl md:text-3xl font-headline font-bold text-primary leading-tight">
                      {masterProject?.title || documentData.title}
                    </h2>
                  </div>

                  <div className="divide-y divide-muted">
                    {relatedDocs
                      ?.filter(rel => rel.id !== (masterProject?.id || documentData.id)) // Excluir el registro maestro del listado cronológico
                      .sort((a, b) => new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime())
                      .map((rel) => {
                        const isResolucion = rel.extensionDocType === 'Resolución de aprobación';
                        const isInforme = rel.extensionDocType === 'Informe de avance' || rel.extensionDocType === 'Informe final';

                        return (
                          <div 
                            key={rel.id} 
                            className={cn(
                              "p-8 md:p-12 transition-all duration-300",
                              rel.id === documentData.id ? "bg-primary/[0.02]" : "hover:bg-muted/[0.03]"
                            )}
                          >
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                              <div className="flex items-start gap-6">
                                <div className={cn(
                                  "p-4 rounded-2xl shadow-sm shrink-0", 
                                  rel.id === documentData.id ? "bg-primary text-white" : "bg-muted text-primary"
                                )}>
                                  {getDocIcon(rel.type)}
                                </div>
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className={cn(
                                      "text-[10px] font-black uppercase border-primary/30 text-primary px-3 py-1",
                                      rel.id === documentData.id && "bg-primary/10"
                                    )}>
                                      {rel.extensionDocType || rel.type}
                                    </Badge>
                                    {rel.id === documentData.id && (
                                      <Badge className="bg-primary text-white text-[10px] font-black uppercase px-3 py-1 shadow-sm">
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Registro actual
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-left md:text-right shrink-0">
                                <div className="flex items-center md:justify-end gap-2 text-primary font-black text-[10px] uppercase tracking-widest mb-1">
                                  <Clock className="w-4 h-4" /> Fecha de Registro
                                </div>
                                <p className="text-sm font-black text-foreground">
                                  {new Date(rel.uploadDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                                <p className="text-xs font-bold text-muted-foreground uppercase opacity-70">
                                  {new Date(rel.uploadDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8 pl-2">
                              {isInforme && (
                                <>
                                  {rel.director && (
                                    <div className="space-y-1">
                                      <p className="text-[9px] font-black uppercase text-primary/60 tracking-[0.1em] flex items-center gap-2"><User className="w-3 h-3" /> Director</p>
                                      <p className="text-sm font-bold text-foreground">{formatPersonName(rel.director)}</p>
                                    </div>
                                  )}
                                  {rel.authors && rel.authors.length > 0 && (
                                    <div className="space-y-1">
                                      <p className="text-[9px] font-black uppercase text-primary/60 tracking-[0.1em] flex items-center gap-2"><Users className="w-3 h-3" /> Equipo / Responsables</p>
                                      <p className="text-sm font-bold text-foreground">{rel.authors.map(a => formatPersonName(a)).join('; ')}</p>
                                    </div>
                                  )}
                                  {(rel.executionStartDate || rel.executionEndDate) && (
                                    <div className="space-y-1">
                                      <p className="text-[9px] font-black uppercase text-primary/60 tracking-[0.1em] flex items-center gap-2"><Clock className="w-3 h-3" /> Período</p>
                                      <p className="text-sm font-bold text-foreground">
                                        {rel.executionStartDate ? new Date(rel.executionStartDate).toLocaleDateString('es-ES') : '?'} - {rel.executionEndDate ? new Date(rel.executionEndDate).toLocaleDateString('es-ES') : '?'}
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}

                              {isResolucion && (
                                <>
                                  {rel.resolutionNumber && (
                                    <div className="space-y-1">
                                      <p className="text-[9px] font-black uppercase text-primary/60 tracking-[0.1em] flex items-center gap-2"><Fingerprint className="w-3 h-3" /> Número de Resolución</p>
                                      <p className="text-sm font-black text-primary">{rel.resolutionNumber}</p>
                                    </div>
                                  )}
                                  {rel.date && (
                                    <div className="space-y-1">
                                      <p className="text-[9px] font-black uppercase text-primary/60 tracking-[0.1em] flex items-center gap-2"><Calendar className="w-3 h-3" /> Fecha Resolución</p>
                                      <p className="text-sm font-bold text-foreground">{new Date(rel.date).toLocaleDateString('es-ES')}</p>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            
                            {isInforme && rel.description && (
                              <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 mb-8 italic text-sm text-muted-foreground leading-relaxed">
                                <p className="text-[9px] font-black uppercase text-primary/60 tracking-[0.2em] mb-2">Información / Resumen</p>
                                "{rel.description}"
                              </div>
                            )}
                            
                            <div className="flex justify-end pt-4 border-t border-dashed border-muted">
                              {canViewFile ? (
                                <Button asChild variant="outline" className="rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest shadow-sm border-primary text-primary hover:bg-primary/5">
                                  <a href={rel.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <span className="flex items-center gap-2">
                                      {getButtonLabel(rel.type, rel.extensionDocType)} <ExternalLink className="w-4 h-4" />
                                    </span>
                                  </a>
                                </Button>
                              ) : (
                                <p className="text-[10px] font-black uppercase text-muted-foreground italic">Acceso restringido al archivo</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          <div className="mt-12 flex justify-center border-t pt-12">
            <Button 
              variant="outline" 
              className="h-12 px-10 rounded-xl font-black uppercase text-[10px] tracking-widest border-primary text-primary hover:bg-primary/5 transition-all"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Repositorio
            </Button>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
