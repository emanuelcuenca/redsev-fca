"use client";

import { useState, use, useEffect, useMemo } from "react";
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
  Users,
  Link as LinkIcon,
  ChevronRight,
  History,
  AlertTriangle,
  FolderTree
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AgriculturalDocument, isDocumentVigente, formatPersonName } from "@/lib/mock-data";
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { doc, collection, query, where, orderBy } from "firebase/firestore";

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

  // Consulta del documento principal
  const docRef = useMemoFirebase(() => (resolvedParams.id && user) ? doc(db, 'documents', resolvedParams.id) : null, [db, resolvedParams.id, user]);
  const { data: documentData, isLoading, error: docError } = useDoc<AgriculturalDocument>(docRef);

  // Consulta de documentos relacionados por el mismo código de proyecto (Unified Access)
  const relatedDocsQuery = useMemoFirebase(() => {
    if (!documentData?.projectCode || !user) return null;
    return query(
      collection(db, 'documents'),
      where('projectCode', '==', documentData.projectCode)
    );
  }, [db, documentData?.projectCode, user]);

  const { data: rawRelatedDocs, isLoading: isLoadingRelated, error: relatedError } = useCollection<AgriculturalDocument>(relatedDocsQuery);

  const relatedDocs = useMemo(() => {
    if (!rawRelatedDocs) return null;
    return [...rawRelatedDocs].sort((a, b) => new Date(a.uploadDate || 0).getTime() - new Date(b.uploadDate || 0).getTime());
  }, [rawRelatedDocs]);

  const adminRef = useMemoFirebase(() => user ? doc(db, 'roles_admin', user.uid) : null, [db, user]);
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  // Proyecto Maestro para contexto unificado
  const masterProject = useMemo(() => {
    if (!relatedDocs) return null;
    return relatedDocs.find(d => d.type === 'Proyecto' && d.extensionDocType === 'Proyecto de Extensión') || null;
  }, [relatedDocs]);

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

  if (docError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-8 text-center rounded-[2rem] border-destructive/20 bg-destructive/5 shadow-2xl">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-headline font-bold uppercase mb-2 text-destructive">Error de Acceso</h2>
          <p className="text-sm text-muted-foreground mb-6">No tiene permisos suficientes para ver este registro o el mismo ha sido removido.</p>
          <Button asChild className="w-full h-12 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-black uppercase text-[10px] tracking-widest">
            <Link href="/documents">Volver al Repositorio</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (!documentData) return null;

  const displayDate = documentData.date || documentData.uploadDate;
  const isConvenio = documentData.type === 'Convenio';
  const isProyecto = documentData.type === 'Proyecto';
  const isMobilityLike = ['Movilidad Estudiantil', 'Movilidad Docente', 'Pasantía'].includes(documentData.type);
  const isExtensionProyecto = isProyecto && documentData.extensionDocType === "Proyecto de Extensión";
  
  // Contexto Unificado: Si estamos viendo un documento vinculado, priorizamos los datos del Proyecto Maestro
  const objectiveContext = isExtensionProyecto ? documentData.objetivoGeneral : masterProject?.objetivoGeneral;
  const specificObjectivesContext = isExtensionProyecto ? documentData.objetivosEspecificos : masterProject?.objetivosEspecificos;
  const directorContext = isExtensionProyecto ? documentData.director : masterProject?.director;
  const descriptionContext = documentData.description || masterProject?.description;

  const vigente = isDocumentVigente(documentData);
  const counterparts = documentData.counterparts || [];

  const getDocIcon = (type?: string) => {
    switch (type || documentData.type) {
      case 'Convenio': return <Handshake className="w-5 h-5" />;
      case 'Proyecto': return <ArrowLeftRight className="w-5 h-5" />;
      case 'Movilidad Estudiantil': case 'Movilidad Docente': return <Plane className="w-5 h-5" />;
      case 'Pasantía': return <GraduationCap className="w-5 h-5" />;
      case 'Resolución': return <ScrollText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
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
          <div className="flex-1 flex justify-center text-center">
            <span className="text-[12px] md:text-xl font-headline text-primary uppercase font-bold tracking-tight">
              {documentData.projectCode ? `Proyecto: ${documentData.projectCode}` : 'Detalle del Registro'}
            </span>
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

        <main className="p-4 md:p-8 max-w-5xl mx-auto w-full pb-20">
          <div className="space-y-6">
            {/* Header Unificado */}
            <section className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-muted shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b pb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary">{getDocIcon()}</div>
                  <div>
                    <h1 className="text-xl md:text-3xl font-headline font-bold tracking-tight text-primary leading-tight">
                      {documentData.title}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-primary/10 text-primary border-primary/20 h-7 px-3 text-[10px] font-black uppercase tracking-widest">
                        {documentData.extensionDocType || documentData.type}
                      </Badge>
                      {documentData.resolutionNumber && (
                        <Badge className="bg-accent/10 text-accent-foreground border-accent/20 h-7 px-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                          <ScrollText className="w-3.5 h-3.5" /> {documentData.resolutionNumber}
                        </Badge>
                      )}
                      {isConvenio && <Badge className={`h-7 px-3 text-[10px] font-black uppercase tracking-widest ${vigente ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{vigente ? 'Vigente' : 'Vencido'}</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="rounded-xl bg-white text-primary border-primary/20 hover:bg-primary/5 h-10 shadow-sm font-bold" variant="outline" asChild>
                    <a href={documentData.fileUrl} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4 mr-2" /> Ver Documento Actual</a>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary border-b pb-2">Datos de Gestión</h3>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary/60" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Fecha del Registro Actual</p>
                        <p className="font-bold text-sm">{formatDateString(displayDate)}</p>
                      </div>
                    </div>

                    {directorContext && (
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-primary/60" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Director del Proyecto</p>
                          <p className="font-bold text-sm">{formatPersonName(directorContext)}</p>
                        </div>
                      </div>
                    )}

                    {documentData.authors && documentData.authors.length > 0 && (
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-primary/60 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Equipo Técnico / Responsables</p>
                          <div className="mt-1 space-y-1">
                            {documentData.authors.map((a, i) => (
                              <p key={i} className="font-bold text-sm">{formatPersonName(a)}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary border-b pb-2">Instituciones y Destino</h3>
                  <div className="space-y-4">
                    {isMobilityLike && (
                      <>
                        <div className="flex items-start gap-3 bg-muted/20 p-4 rounded-xl border border-muted">
                          <Building2 className="w-5 h-5 text-primary/60 mt-0.5" />
                          <p className="font-bold text-sm">{documentData.mobilityInstitution || 'No especificada'}</p>
                        </div>
                        <div className="flex items-start gap-3 bg-muted/20 p-4 rounded-xl border border-muted">
                          <MapPin className="w-5 h-5 text-primary/60 mt-0.5" />
                          <p className="font-bold text-sm">{documentData.mobilityState}, {documentData.mobilityCountry}</p>
                        </div>
                      </>
                    )}
                    {(isConvenio || isProyecto) && counterparts.length > 0 ? counterparts.map((cp, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl border border-muted"><Building2 className="w-5 h-5 text-primary/60" /><p className="font-bold text-sm">{cp}</p></div>
                    )) : !isMobilityLike && <p className="text-xs font-bold text-muted-foreground italic">Sin instituciones adicionales</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* Cronología y Vinculaciones (Unified Access by Code) */}
            {documentData.projectCode && (
              <section className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/20 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                    <History className="w-4 h-4" /> Cronología y Vinculaciones del Proyecto
                  </h3>
                  <Badge variant="outline" className="bg-white border-primary/30 text-primary font-black text-[9px] uppercase tracking-widest px-3">
                    Código: {documentData.projectCode}
                  </Badge>
                </div>
                
                {isLoadingRelated ? (
                  <div className="py-10 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
                  </div>
                ) : relatedDocs && relatedDocs.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {relatedDocs.map((rel) => {
                      const isCurrent = rel.id === documentData.id;
                      return (
                        <Link 
                          key={rel.id} 
                          href={`/documents/${rel.id}`}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                            isCurrent 
                            ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]' 
                            : 'bg-white hover:bg-muted/50 border-muted group'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${isCurrent ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
                              {getDocIcon(rel.type)}
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider leading-none mb-1">
                                {rel.extensionDocType || rel.type}
                              </p>
                              <p className={`text-[11px] font-bold ${isCurrent ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                {formatDateString(rel.date || rel.uploadDate)}
                              </p>
                            </div>
                          </div>
                          {!isCurrent ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Ver registro</span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </div>
                          ) : (
                            <Badge variant="secondary" className="bg-white/20 border-none text-[8px] uppercase">Viendo ahora</Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            )}

            {/* Información de Contenido del Proyecto */}
            {(objectiveContext || descriptionContext) && (
              <section className="space-y-6">
                {objectiveContext && (
                  <div className="bg-primary/[0.03] p-8 rounded-[2.5rem] border border-primary/10 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Objetivo General del Proyecto
                    </h3>
                    <p className="text-sm leading-relaxed font-medium text-muted-foreground">{objectiveContext}</p>
                  </div>
                )}

                {specificObjectivesContext && specificObjectivesContext.length > 0 && (
                  <div className="bg-white p-8 rounded-[2.5rem] border border-muted shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6 flex items-center gap-2">
                      <ListTodo className="w-4 h-4" /> Objetivos Específicos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {specificObjectivesContext.map((obj, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-muted/10 rounded-xl border border-muted/20">
                          <div className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black">{i + 1}</div>
                          <p className="text-xs font-medium">{obj}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {descriptionContext && (
                  <div className="bg-primary/[0.03] p-8 rounded-[2.5rem] border border-primary/10 shadow-sm">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Resumen Institucional
                    </h3>
                    <p className="text-sm leading-relaxed font-medium text-muted-foreground whitespace-pre-wrap">{descriptionContext}</p>
                  </div>
                )}
              </section>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
