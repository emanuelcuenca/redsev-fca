
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
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
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
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-md px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-headline font-semibold text-primary truncate max-w-[200px] md:max-w-md">
              {doc.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="hidden sm:flex rounded-xl gap-2">
              <Share2 className="w-4 h-4" /> Compartir
            </Button>
            <Button variant="default" size="sm" className="rounded-xl gap-2 bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4" /> Descargar
            </Button>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Preview and Metadata */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
                    <Eye className="w-6 h-6 text-primary" /> Visualización de Documento
                  </h2>
                </div>
                <div className="relative aspect-[3/4] w-full bg-muted rounded-3xl overflow-hidden border-2 border-muted shadow-lg">
                  <Image 
                    src={document.imageUrl} 
                    alt="Document preview" 
                    fill 
                    className="object-cover opacity-90" 
                    data-ai-hint="document report"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-6 left-6 right-6 text-white p-6 backdrop-blur-md bg-white/10 rounded-2xl border border-white/20">
                    <h3 className="text-xl font-headline font-bold mb-2">{doc.title}</h3>
                    <p className="text-sm opacity-90 line-clamp-3 leading-relaxed">{doc.content}</p>
                  </div>
                </div>
              </section>

              <section className="bg-white p-8 rounded-3xl shadow-sm border border-muted space-y-6">
                <h2 className="text-2xl font-headline font-bold">Metadatos del Documento</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-secondary p-2 rounded-lg">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Tipo</p>
                        <p className="font-semibold">{doc.type}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-secondary p-2 rounded-lg">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Fecha</p>
                        <p className="font-semibold">{new Date(doc.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-secondary p-2 rounded-lg">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Autores</p>
                        <p className="font-semibold">{doc.authors.join(', ')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="bg-secondary p-2 rounded-lg">
                        <Tag className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Palabras Clave</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {doc.keywords.map(tag => (
                            <Badge key={tag} variant="secondary" className="font-medium">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: AI Tools */}
            <div className="space-y-8">
              <Card className="rounded-3xl border-none shadow-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-2 text-primary-foreground/90 font-headline font-bold uppercase tracking-wider text-xs mb-2">
                    <Sparkles className="w-4 h-4" /> Inteligencia Artificial
                  </div>
                  <CardTitle className="text-3xl font-headline font-bold">Resumen Inteligente</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <p className="text-primary-foreground/80 mb-6 leading-relaxed">
                    Extraiga los puntos clave y conclusiones principales de este documento instantáneamente.
                  </p>
                  
                  {summary ? (
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-in fade-in slide-in-from-bottom-4">
                      <p className="text-sm leading-relaxed text-white">
                        {summary}
                      </p>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-white font-bold mt-4 hover:no-underline flex items-center gap-1 opacity-80"
                        onClick={() => setSummary(null)}
                      >
                        Limpiar resumen
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full h-14 rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg shadow-lg shadow-accent/20 transition-all group"
                      onClick={handleSummarize}
                      disabled={isSummarizing}
                    >
                      {isSummarizing ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <span className="flex items-center gap-2">Generar Resumen <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" /></span>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              <section className="bg-secondary/30 p-8 rounded-3xl border border-secondary space-y-6">
                <h3 className="text-xl font-headline font-bold text-primary">Información Adicional</h3>
                <ul className="space-y-4">
                  <li className="flex items-center justify-between group">
                    <span className="text-muted-foreground">ID Interno</span>
                    <span className="font-mono text-sm font-bold">{doc.id}</span>
                  </li>
                  <li className="flex items-center justify-between group">
                    <span className="text-muted-foreground">Proyecto Relacionado</span>
                    <span className="font-bold text-right text-primary">{doc.project}</span>
                  </li>
                  <li className="flex items-center justify-between group">
                    <span className="text-muted-foreground">Nivel de Acceso</span>
                    <Badge className="bg-green-600 text-white border-none">Autorizado</Badge>
                  </li>
                </ul>
                <Separator className="bg-secondary" />
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  Este documento es parte del repositorio oficial de la Secretaría de Extensión y Vinculación FCA - UNCA.
                </p>
              </section>
            </div>

          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
