
"use client";

import { useState, use, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Sparkles, 
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
  Clock
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AgriculturalDocument, isDocumentVigente } from "@/lib/mock-data";
import { summarizeDocument } from "@/ai/flows/smart-document-summarization";
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [mounted, setMounted] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

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

  const handleSummarize = async () => {
    if (!documentData) return;
    setIsSummarizing(true);
    try {
      const result = await summarizeDocument({ 
        documentContent: documentData.description || `Título: ${documentData.title}.`,
        documentMediaUri: documentData.imageUrl && documentData.imageUrl.startsWith('data:') ? documentData.imageUrl : undefined
      });
      setSummary(result.summary);
    } catch (error) {
      console.error("Summary error:", error);
    } finally {
      setIsSummarizing(false);
    }
  };

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
  const vigente = isDocumentVigente(documentData);

  const getDocIcon = () => {
    switch (documentData.type) {
      case 'Convenio': return <Handshake className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
      case 'Proyecto': return <ArrowLeftRight className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
      case 'Movilidad': return <Plane className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
      case 'Pasantía': return <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
      case 'Resolución':
      case 'Reglamento': return <ScrollText className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
      default: return <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" />;
    }
  };

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
            <Button variant="default" size="sm" className="hidden sm:flex rounded-xl gap-2 bg-primary hover:bg-primary/90 h-8 text-xs font-bold">
              <Download className="w-4 h-4" /> Descargar
            </Button>
            <UserMenu />
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <section>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl md:text-2xl font-headline font-bold flex items-center gap-2 uppercase tracking-tight">
                      {getDocIcon()} Visualización
                    </h2>
                    {isConvenio && (
                      <Badge className={`h-7 px-3 text-[10px] font-black uppercase tracking-widest ${vigente ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {vigente ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                        {vigente ? 'Vigente' : 'Vencido'}
                      </Badge>
                    )}
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 h-7 px-3 text-[10px] font-black uppercase tracking-widest">
                    {documentData.extensionDocType || documentData.type}
                  </Badge>
                </div>
                <div className="relative aspect-[3/4] w-full bg-muted rounded-2xl md:rounded-3xl overflow-hidden border-2 border-muted shadow-lg">
                  <Image 
                    src={documentData.imageUrl || "https://picsum.photos/seed/" + documentData.id + "/600/800"} 
                    alt="Document preview" 
                    fill 
                    className="object-cover opacity-90" 
                    data-ai-hint="document report"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 text-white p-4 md:p-6 backdrop-blur-md bg-white/10 rounded-xl md:rounded-2xl border border-white/20">
                    <h3 className="text-lg md:text-xl font-headline font-bold mb-1 md:mb-2 line-clamp-2 uppercase">{documentData.title}</h3>
                    <p className="text-xs md:text-sm opacity-90 line-clamp-2 md:line-clamp-3 leading-relaxed">{documentData.description || 'Sin contenido de previsualización disponible.'}</p>
                  </div>
                </div>
              </section>

              {/* Información específica para Proyectos de Extensión */}
              {isProyecto && (
                <section className="bg-primary/5 p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-primary/20 space-y-6">
                  <div className="flex items-center gap-3">
                    <ArrowLeftRight className="w-6 h-6 text-primary" />
                    <h2 className="text-xl md:text-2xl font-headline font-bold uppercase tracking-tight">Detalles de Extensión</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Tipo de Documento</p>
                      <p className="font-bold text-lg text-primary">{documentData.extensionDocType || 'Proyecto'}</p>
                    </div>
                    {documentData.executionPeriod && (
                      <div className="bg-white p-4 rounded-xl shadow-sm border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Período de Ejecución</p>
                        <p className="font-bold text-lg">{documentData.executionPeriod}</p>
                      </div>
                    )}
                    {documentData.presentationDate && (
                      <div className="bg-white p-4 rounded-xl shadow-sm border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Fecha de Presentación</p>
                        <p className="font-bold text-lg flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-primary" />
                          {new Date(documentData.presentationDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                    {documentData.reportPeriod && (
                      <div className="bg-white p-4 rounded-xl shadow-sm border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Período que abarca el informe</p>
                        <p className="font-bold text-lg flex items-center gap-2">
                          <Clock className="w-5 h-5 text-primary" />
                          {documentData.reportPeriod}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Información específica para Movilidad / Pasantía */}
              {(documentData.type === "Movilidad" || documentData.type === "Pasantía") && (
                <section className="bg-primary/5 p-6 md:p-8 rounded-2xl md:rounded-3xl border-2 border-primary/20 space-y-6">
                  <div className="flex items-center gap-3">
                    {documentData.type === "Movilidad" ? <Plane className="w-6 h-6 text-primary" /> : <GraduationCap className="w-6 h-6 text-primary" />}
                    <h2 className="text-xl md:text-2xl font-headline font-bold uppercase tracking-tight">Detalles del Beneficiario</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Nombre del Beneficiario / Pasante</p>
                      <p className="font-bold text-lg text-primary">{documentData.beneficiaryName || 'No registrado'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Programa Institucional</p>
                      <p className="font-bold text-lg">{documentData.programName || 'No registrado'}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border md:col-span-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-1">Convocatoria Correspondiente</p>
                      <p className="font-bold text-lg flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-primary" />
                        {documentData.convocatoria || 'No especificada'}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              <section className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-muted space-y-4 md:space-y-6">
                <h2 className="text-xl md:text-2xl font-headline font-bold uppercase tracking-tight">Metadatos Oficiales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="bg-secondary p-2 rounded-lg shrink-0">
                        {isConvenio ? <Handshake className="w-4 h-4 md:w-5 h-5 text-primary" /> : isProyecto ? <ArrowLeftRight className="w-4 h-4 md:w-5 h-5 text-primary" /> : <FileText className="w-4 h-4 md:w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-bold">Tipo de Registro</p>
                        <p className="font-semibold text-sm md:text-base">{documentData.type} {isConvenio && `(${documentData.convenioSubType})`}</p>
                      </div>
                    </div>
                    {isConvenio && (
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="bg-secondary p-2 rounded-lg shrink-0">
                          <Building2 className="w-4 h-4 md:w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-bold">Contraparte</p>
                          <p className="font-semibold text-sm md:text-base">{documentData.counterpart || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    {isConvenio && (
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className="bg-secondary p-2 rounded-lg shrink-0">
                          <Timer className="w-4 h-4 md:w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-bold">Duración</p>
                          <p className="font-semibold text-sm md:text-base">{documentData.durationYears} Años</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="bg-secondary p-2 rounded-lg shrink-0">
                        <Calendar className="w-4 h-4 md:w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-bold">
                          {isConvenio ? 'Fecha de Firma' : isProyecto ? 'Fecha de Aprobación' : 'Fecha de Registro'}
                        </p>
                        <p className="font-semibold text-sm md:text-base">
                          {mounted && displayDate ? new Date(displayDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '...'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="bg-secondary p-2 rounded-lg shrink-0">
                        {isConvenio && documentData.hasInstitutionalResponsible ? <UserCheck className="w-4 h-4 md:w-5 h-5 text-primary" /> : <User className="w-4 h-4 md:w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-bold">
                          {isProyecto ? 'Autores' : 'Responsables'} {isConvenio && "(Seguimiento)"}
                        </p>
                        <p className="font-semibold text-sm md:text-base truncate max-w-[200px] md:max-w-xs">{documentData.authors?.join(', ') || (isConvenio ? 'Sin responsable asignado' : 'Secretaría de Extensión')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="bg-secondary p-2 rounded-lg shrink-0">
                        <Tag className="w-4 h-4 md:w-5 h-5 text-primary" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-bold">Palabras Clave</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {documentData.keywords?.map(tag => (
                            <Badge key={tag} variant="secondary" className="font-medium text-[9px] md:text-[10px]">{tag}</Badge>
                          )) || <span className="text-xs italic text-muted-foreground">Sin etiquetas</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6 md:space-y-8">
              <Card className="rounded-2xl md:rounded-3xl border-none shadow-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
                <CardHeader className="p-6 md:p-8 pb-3 md:pb-4">
                  <div className="flex items-center gap-2 text-primary-foreground/90 font-headline font-bold uppercase tracking-wider text-[10px] mb-1">
                    <Sparkles className="w-3.5 h-3.5" /> Inteligencia Artificial
                  </div>
                  <CardTitle className="text-2xl md:text-3xl font-headline font-bold uppercase">Análisis Smart</CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 pt-0">
                  <p className="text-primary-foreground/80 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">
                    Genere un resumen ejecutivo y extraiga los puntos clave con Gemini 2.5 Flash.
                  </p>
                  
                  {summary ? (
                    <div className="bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/20 animate-in fade-in slide-in-from-bottom-4">
                      <p className="text-xs md:text-sm leading-relaxed text-white">
                        {summary}
                      </p>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-white font-bold mt-3 md:mt-4 hover:no-underline flex items-center gap-1 opacity-80 text-xs"
                        onClick={() => setSummary(null)}
                      >
                        Limpiar Resumen
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base md:text-lg shadow-lg shadow-accent/20 transition-all group"
                      onClick={handleSummarize}
                      disabled={isSummarizing}
                    >
                      {isSummarizing ? (
                        <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-2">Analizar Documento <Sparkles className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-12 transition-transform" /></span>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <section className="bg-secondary/30 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-secondary space-y-4 md:space-y-6">
                <h3 className="text-lg md:text-xl font-headline font-bold text-primary uppercase tracking-tight">Acceso Rápido</h3>
                <div className="space-y-3">
                  <Button className="w-full rounded-xl bg-white text-primary border-primary/20 hover:bg-primary/5 h-12 shadow-sm font-bold" variant="outline" asChild>
                    <a href={documentData.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Eye className="w-4 h-4 mr-2" /> Previsualizar PDF
                    </a>
                  </Button>
                  <Button className="w-full rounded-xl h-12 font-bold" variant="default">
                    <Download className="w-4 h-4 mr-2" /> Descargar Copia
                  </Button>
                </div>
                <Separator className="bg-secondary" />
                <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed italic text-center">
                  VínculoAgro - FCA UNCA<br/>Resguardo Digital Institucional
                </p>
              </section>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
