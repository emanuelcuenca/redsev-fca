
"use client";

import { useState, use, useEffect } from "react";
import Image from "next/image";
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
  Eye
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MOCK_DOCUMENTS, AgriculturalDocument } from "@/lib/mock-data";
import { summarizeDocument } from "@/ai/flows/smart-document-summarization";

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<AgriculturalDocument | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    const foundDoc = MOCK_DOCUMENTS.find(d => d.id === resolvedParams.id);
    if (foundDoc) {
      setDoc(foundDoc);
    }
  }, [resolvedParams.id]);

  const handleSummarize = async () => {
    if (!doc) return;
    setIsSummarizing(true);
    try {
      const result = await summarizeDocument({ documentContent: doc.content });
      setSummary(result.summary);
    } catch (error) {
      console.error("Summary error:", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!doc) return null;

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
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
            
            {/* Left Column: Preview and Metadata */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              <section>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h2 className="text-xl md:text-2xl font-headline font-bold flex items-center gap-2 uppercase tracking-tight">
                    <Eye className="w-5 h-5 md:w-6 md:h-6 text-primary" /> Visualización
                  </h2>
                </div>
                <div className="relative aspect-[3/4] w-full bg-muted rounded-2xl md:rounded-3xl overflow-hidden border-2 border-muted shadow-lg">
                  <Image 
                    src={doc.imageUrl} 
                    alt="Document preview" 
                    fill 
                    className="object-cover opacity-90" 
                    data-ai-hint="document report"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 text-white p-4 md:p-6 backdrop-blur-md bg-white/10 rounded-xl md:rounded-2xl border border-white/20">
                    <h3 className="text-lg md:text-xl font-headline font-bold mb-1 md:mb-2 line-clamp-2 uppercase">{doc.title}</h3>
                    <p className="text-xs md:text-sm opacity-90 line-clamp-2 md:line-clamp-3 leading-relaxed">{doc.content}</p>
                  </div>
                </div>
              </section>

              <section className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border border-muted space-y-4 md:space-y-6">
                <h2 className="text-xl md:text-2xl font-headline font-bold uppercase tracking-tight">Metadatos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="bg-secondary p-2 rounded-lg shrink-0">
                        <FileText className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-bold">Tipo</p>
                        <p className="font-semibold text-sm md:text-base">{doc.type}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="bg-secondary p-2 rounded-lg shrink-0">
                        <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-bold">Fecha</p>
                        <p className="font-semibold text-sm md:text-base">{new Date(doc.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="bg-secondary p-2 rounded-lg shrink-0">
                        <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-bold">Autores</p>
                        <p className="font-semibold text-sm md:text-base truncate max-w-[200px] md:max-w-xs">{doc.authors.join(', ')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="bg-secondary p-2 rounded-lg shrink-0">
                        <Tag className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-widest font-bold">Etiquetas</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {doc.keywords.map(tag => (
                            <Badge key={tag} variant="secondary" className="font-medium text-[9px] md:text-[10px]">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: AI Tools */}
            <div className="space-y-6 md:space-y-8">
              <Card className="rounded-2xl md:rounded-3xl border-none shadow-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
                <CardHeader className="p-6 md:p-8 pb-3 md:pb-4">
                  <div className="flex items-center gap-2 text-primary-foreground/90 font-headline font-bold uppercase tracking-wider text-[10px] mb-1">
                    <Sparkles className="w-3.5 h-3.5" /> Inteligencia Artificial
                  </div>
                  <CardTitle className="text-2xl md:text-3xl font-headline font-bold uppercase">Resumen</CardTitle>
                </CardHeader>
                <CardContent className="p-6 md:p-8 pt-0">
                  <p className="text-primary-foreground/80 mb-4 md:mb-6 leading-relaxed text-sm md:text-base">
                    Extraiga conclusiones clave instantáneamente.
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
                        Limpiar
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
                        <span className="flex items-center gap-2">Generar <Sparkles className="w-4 h-4 md:w-5 md:h-5 group-hover:rotate-12 transition-transform" /></span>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <section className="bg-secondary/30 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-secondary space-y-4 md:space-y-6">
                <h3 className="text-lg md:text-xl font-headline font-bold text-primary uppercase tracking-tight">Info Adicional</h3>
                <ul className="space-y-3 md:space-y-4">
                  <li className="flex items-center justify-between group text-xs md:text-sm">
                    <span className="text-muted-foreground">ID Interno</span>
                    <span className="font-mono font-bold truncate ml-2">{doc.id}</span>
                  </li>
                  <li className="flex items-center justify-between group text-xs md:text-sm">
                    <span className="text-muted-foreground">Proyecto</span>
                    <span className="font-bold text-right text-primary truncate ml-2">{doc.project}</span>
                  </li>
                  <li className="flex items-center justify-between group text-xs md:text-sm">
                    <span className="text-muted-foreground">Acceso</span>
                    <Badge className="bg-green-600 text-white border-none text-[9px] md:text-[10px]">Autorizado</Badge>
                  </li>
                </ul>
                <Separator className="bg-secondary" />
                <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed italic">
                  Documento oficial de la Secretaría de Extensión y Vinculación FCA - UNCA.
                </p>
              </section>
            </div>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
