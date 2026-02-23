"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  X, 
  FileText, 
  Plus, 
  Save, 
  ArrowLeft,
  Info,
  Loader2,
  Building2,
  Calendar as CalendarIcon,
  ScrollText,
  GraduationCap,
  Gavel,
  Compass,
  Link as LinkIcon,
  FileUp,
  Clock,
  Sparkles
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";
import { summarizeDocument } from "@/ai/flows/smart-document-summarization";

export default function UploadPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();

  // Common fields
  const [uploadMethod, setUploadMethod] = useState<string>("file");
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [authors, setAuthors] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Convenio specific fields
  const [isVigente, setIsVigente] = useState(true);
  const [signingYear, setSigningYear] = useState(new Date().getFullYear().toString());
  const [counterpart, setCounterpart] = useState("");
  const [convenioSubType, setConvenioSubType] = useState("Marco");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          variant: "destructive",
          title: "Formato no permitido",
          description: "Solo se permiten PDF o imágenes (JPG/PNG) para escaneos.",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleAiSummarize = async () => {
    if (!file && !externalUrl) {
      toast({
        variant: "destructive",
        title: "Sin origen",
        description: "Debe seleccionar un archivo o URL para generar un resumen.",
      });
      return;
    }

    setIsSummarizing(true);
    try {
      let documentMediaUri = undefined;
      
      // Leer el archivo como Data URI para que la IA pueda procesarlo (PDF o Imagen)
      if (file) {
        documentMediaUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const result = await summarizeDocument({ 
        documentContent: title || description || `Nuevo documento institucional de tipo ${type}`,
        documentMediaUri
      });

      setDescription(result.summary);
      toast({
        title: "Análisis completado",
        description: "La IA ha procesado el documento visualmente y generado el resumen.",
      });
    } catch (error) {
      console.error("AI Error:", error);
      toast({
        variant: "destructive",
        title: "Error de IA",
        description: "No se pudo procesar el documento. Intente con un archivo de menor tamaño o más claro.",
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (tag: string) => {
    setKeywords(keywords.filter(k => k !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !type || !title) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor complete el título y tipo de documento.",
      });
      return;
    }

    if (uploadMethod === "file" && !file) {
      toast({
        variant: "destructive",
        title: "Archivo faltante",
        description: "Debe subir un archivo.",
      });
      return;
    }

    setIsSaving(true);
    
    // Asegurar primera letra mayúscula, resto tal cual se escribió
    const cleanTitle = title.trim();
    const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    const documentData: any = {
      title: formattedTitle,
      type,
      date,
      authors: authors.split(',').map(a => a.trim()).filter(Boolean),
      description,
      keywords,
      uploadDate: new Date().toISOString(),
      uploadedByUserId: user.uid,
      imageUrl: "https://picsum.photos/seed/" + Math.random() + "/600/400",
      fileType: uploadMethod === "file" ? file?.type : "url",
      fileUrl: uploadMethod === "file" ? "#" : externalUrl,
    };

    if (type === "Convenio") {
      documentData.isVigente = isVigente;
      documentData.signingYear = parseInt(signingYear);
      documentData.counterpart = counterpart;
      documentData.convenioSubType = convenioSubType;
    }

    addDocumentNonBlocking(collection(db, 'documents'), documentData);

    toast({
      title: "Documento almacenado",
      description: "El registro ha sido creado exitosamente.",
    });

    setTimeout(() => {
      router.push("/documents");
    }, 1000);
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
            <UserMenu />
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-4xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-headline font-bold uppercase tracking-tight text-primary">Cargar Documento</h1>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-1">Repositorio Digital Institucional</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 pb-20">
            {/* STEP 1: CATEGORY SELECTION */}
            <section className="bg-primary/5 p-6 md:p-8 rounded-[2rem] border border-primary/10 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary text-white p-2 rounded-xl">
                  <Badge className="bg-transparent border-none p-0 text-lg font-bold">1</Badge>
                </div>
                <h2 className="text-xl font-headline font-bold uppercase tracking-tight">Selección de Categoría</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: "Convenio", label: "Convenio", icon: Clock },
                  { id: "Proyecto", label: "Proyecto de Extensión", icon: FileText },
                  { id: "Resolución", label: "Resolución", icon: ScrollText },
                  { id: "Pasantía", label: "Práctica / Pasantía", icon: GraduationCap },
                  { id: "Reglamento", label: "Reglamento", icon: Gavel },
                  { id: "Plan Estratégico", label: "Plan Estratégico", icon: Compass },
                  { id: "Informe", label: "Informe Técnico", icon: Info }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                      type === item.id 
                        ? 'border-primary bg-primary/10 text-primary shadow-md' 
                        : 'border-muted-foreground/10 bg-white hover:border-primary/30 hover:bg-muted/50'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 ${type === item.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-bold uppercase tracking-widest text-[9px] text-center leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* STEP 2: CONTENT SOURCE */}
            <section className={`transition-opacity duration-300 ${type ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/20 text-primary p-2 rounded-xl">
                  <Badge className="bg-transparent border-none p-0 text-lg font-bold text-primary">2</Badge>
                </div>
                <h2 className="text-xl font-headline font-bold uppercase tracking-tight">Origen del Contenido</h2>
              </div>

              <Tabs defaultValue="file" value={uploadMethod} onValueChange={setUploadMethod} className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-14 rounded-2xl bg-muted/50 p-1 mb-6">
                  <TabsTrigger value="file" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                    <FileUp className="w-4 h-4" /> Archivo (PDF/Imagen)
                  </TabsTrigger>
                  <TabsTrigger value="url" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                    <LinkIcon className="w-4 h-4" /> Enlace Externo (URL)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="mt-0">
                  <div className={`relative border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary hover:bg-muted/30'}`}>
                    {file ? (
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="bg-primary/20 p-4 rounded-full">
                          <FileText className="w-12 h-12 text-primary" />
                        </div>
                        <div>
                          <p className="font-black text-lg uppercase truncate max-w-[300px]">{file.name}</p>
                          <p className="text-xs font-bold text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="rounded-xl mt-2 text-destructive font-bold uppercase tracking-widest text-[10px]">
                          <X className="w-4 h-4 mr-2" /> Eliminar y Cambiar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-primary/10 p-4 rounded-full mb-4">
                          <Upload className="w-10 h-10 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-black mb-1 uppercase tracking-tight">Subir Archivo</p>
                          <p className="text-muted-foreground text-xs font-bold mb-6 uppercase tracking-widest">PDF o Escaneo JPG/PNG (Máx 20MB)</p>
                          <Label htmlFor="file-upload" className="cursor-pointer">
                            <div className="bg-primary text-primary-foreground px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                              Seleccionar Archivo
                            </div>
                            <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,image/*" />
                          </Label>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="url" className="mt-0">
                  <div className="bg-muted/30 p-8 rounded-[2rem] border-2 border-dashed border-muted-foreground/20 space-y-4">
                    <div className="flex items-center gap-3 text-primary mb-2">
                      <LinkIcon className="w-6 h-6" />
                      <p className="font-black uppercase tracking-tight text-lg">Vincular Recurso Externo</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="external-url" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Dirección URL del documento</Label>
                      <Input 
                        id="external-url"
                        placeholder="https://docs.google.com/... o https://sitio.com/archivo.pdf"
                        className="h-12 rounded-xl border-muted-foreground/20 bg-white font-bold"
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </section>

            {/* STEP 3: METADATA */}
            <section className={`bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-muted transition-opacity duration-300 ${(file || externalUrl) ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-primary/20 text-primary p-2 rounded-xl">
                  <Badge className="bg-transparent border-none p-0 text-lg font-bold text-primary">3</Badge>
                </div>
                <h2 className="text-xl font-headline font-bold uppercase tracking-tight">Metadatos y Detalles</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 col-span-2">
                  <Label htmlFor="title" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título Oficial del Documento</Label>
                  <Input 
                    id="title" 
                    placeholder="Ej: Convenio Marco de Cooperación Académica..." 
                    className="h-12 rounded-xl border-muted-foreground/20 bg-muted/20 font-bold" 
                    required 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {type === "Convenio" && (
                  <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-secondary/30 rounded-2xl border-2 border-primary/10">
                    <div className="space-y-3">
                      <Label htmlFor="counterpart" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" /> Institución Contraparte
                      </Label>
                      <Input 
                        id="counterpart" 
                        placeholder="Ej: INTA, SENASA, Universidad X..." 
                        className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                        required={type === "Convenio"}
                        value={counterpart}
                        onChange={(e) => setCounterpart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="subType" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Tipo de Convenio</Label>
                      <Select value={convenioSubType} onValueChange={setConvenioSubType}>
                        <SelectTrigger className="h-12 rounded-xl border-primary/20 bg-white font-bold">
                          <SelectValue placeholder="Seleccione subtipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Marco">Marco</SelectItem>
                          <SelectItem value="Específico">Específico</SelectItem>
                          <SelectItem value="Pasantía">Pasantía</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="signingYear" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> Año de Firma
                      </Label>
                      <Input 
                        id="signingYear" 
                        type="number"
                        className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                        required={type === "Convenio"}
                        value={signingYear}
                        onChange={(e) => setSigningYear(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-primary/10">
                      <div className="flex flex-col">
                        <span className="font-black uppercase text-[10px] tracking-widest text-primary">Estado de Vigencia</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{isVigente ? 'Vigente' : 'No Vigente'}</span>
                      </div>
                      <Switch checked={isVigente} onCheckedChange={setIsVigente} />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="date" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                    <CalendarIcon className="w-3.5 h-3.5" /> Fecha de Registro
                  </Label>
                  <Input 
                    id="date" 
                    type="date" 
                    className="h-12 rounded-xl border-muted-foreground/20 bg-muted/20 font-bold" 
                    required 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="authors" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Responsables (separados por coma)</Label>
                  <Input 
                    id="authors" 
                    placeholder="Ej: Dr. Gómez, Ing. Pérez..." 
                    className="h-12 rounded-xl border-muted-foreground/20 bg-muted/20 font-bold" 
                    required 
                    value={authors}
                    onChange={(e) => setAuthors(e.target.value)}
                  />
                </div>

                <div className="space-y-3 col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Resumen del Contenido</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-8 rounded-lg gap-2 border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest hover:bg-primary/5"
                      onClick={handleAiSummarize}
                      disabled={isSummarizing}
                    >
                      {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Generar con IA
                    </Button>
                  </div>
                  <Textarea 
                    id="description" 
                    placeholder="Describa el objetivo del documento o genere uno automáticamente con IA..." 
                    className="min-h-[140px] rounded-2xl border-muted-foreground/20 bg-muted/20 font-medium p-4 leading-relaxed" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-3 col-span-2">
                  <Label htmlFor="keywords" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Etiquetas / Palabras Clave</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Ej: Suelos, Riego..." 
                      className="h-12 rounded-xl border-muted-foreground/20 bg-muted/20 font-bold"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    />
                    <Button type="button" className="h-12 px-6 rounded-xl bg-primary shadow-lg shadow-primary/10" onClick={addKeyword}>
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {keywords.map(tag => (
                      <Badge key={tag} className="bg-primary/10 text-primary hover:bg-primary/20 py-2 px-4 flex items-center gap-2 border-none transition-all rounded-full font-bold text-[10px] uppercase tracking-wider">
                        {tag}
                        <button type="button" onClick={() => removeKeyword(tag)} className="hover:text-destructive">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-end gap-4 mt-12 pt-8 border-t border-dashed">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full md:w-auto h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:bg-muted" 
                  onClick={() => router.push("/")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="w-full md:w-auto h-14 px-12 rounded-xl font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 uppercase tracking-widest text-[11px]" 
                  disabled={isSaving || (!file && !externalUrl) || !title}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" /> Procesando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="w-5 h-5" /> Almacenar en Repositorio
                    </span>
                  )}
                </Button>
              </div>
            </section>
          </form>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
