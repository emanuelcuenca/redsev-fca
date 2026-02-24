
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
  Loader2,
  Building2,
  Calendar as CalendarIcon,
  ScrollText,
  GraduationCap,
  FileUp,
  Clock,
  Sparkles,
  AlertCircle,
  Link as LinkIcon,
  Plane,
  Handshake,
  User,
  BookOpen,
  ClipboardList,
  UserCheck,
  Timer,
  ArrowLeftRight
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function UploadPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();

  // Estados del formulario
  const [type, setType] = useState("");
  const [uploadMethod, setUploadMethod] = useState<string>("file");
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [authors, setAuthors] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Campos específicos Convenio
  const [durationYears, setDurationYears] = useState<string>("1");
  const [counterpart, setCounterpart] = useState("");
  const [convenioSubType, setConvenioSubType] = useState("Marco");
  const [hasInstitutionalResponsible, setHasInstitutionalResponsible] = useState(false);
  
  // Campos para Movilidad y Pasantía
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [programName, setProgramName] = useState("");
  const [convocatoria, setConvocatoria] = useState("");

  // Campos para Proyectos de Extensión
  const [extensionDocType, setExtensionDocType] = useState("");
  const [presentationDate, setPresentationDate] = useState("");
  const [reportPeriod, setReportPeriod] = useState("");
  const [executionPeriod, setExecutionPeriod] = useState("");

  const resetForm = () => {
    setType("");
    setFile(null);
    setExternalUrl("");
    setTitle("");
    setDate("");
    setAuthors("");
    setDescription("");
    setKeywords([]);
    setKeywordInput("");
    setDurationYears("1");
    setCounterpart("");
    setConvenioSubType("Marco");
    setHasInstitutionalResponsible(false);
    setBeneficiaryName("");
    setProgramName("");
    setConvocatoria("");
    setExtensionDocType("");
    setPresentationDate("");
    setReportPeriod("");
    setExecutionPeriod("");
    setAiError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        toast({
          variant: "destructive",
          title: "Formato no permitido",
          description: "Solo se permiten archivos PDF institucionales.",
        });
        return;
      }
      setFile(selectedFile);
      setAiError(null);
    }
  };

  const handleAiSummarize = async () => {
    if (!file && !externalUrl) {
      toast({
        variant: "destructive",
        title: "Sin origen",
        description: "Debe seleccionar un archivo o URL para que la IA pueda leerlo.",
      });
      return;
    }

    setIsSummarizing(true);
    setAiError(null);
    try {
      let documentMediaUri = undefined;
      
      if (file) {
        documentMediaUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const result = await summarizeDocument({ 
        documentContent: title || `Analizando documento de tipo ${type}`,
        documentMediaUri
      });

      if (result.summary) {
        setDescription(result.summary);
        toast({
          title: "Análisis completado",
          description: "La IA ha interpretado el documento exitosamente.",
        });
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      setAiError(error.message);
      toast({
        variant: "destructive",
        title: "Error de IA",
        description: "No se pudo acceder al servicio de inteligencia artificial.",
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

    setIsSaving(true);
    
    const trimmedTitle = title.trim();
    const formattedTitle = trimmedTitle.charAt(0).toUpperCase() + trimmedTitle.slice(1);

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
      fileType: uploadMethod === "file" ? (file?.type || "application/pdf") : "url",
      fileUrl: uploadMethod === "file" ? "#" : externalUrl,
    };

    if (type === "Convenio") {
      documentData.durationYears = parseInt(durationYears) || 1;
      documentData.counterpart = counterpart;
      documentData.convenioSubType = convenioSubType;
      documentData.hasInstitutionalResponsible = hasInstitutionalResponsible;
      if (!hasInstitutionalResponsible) {
        documentData.authors = [];
      }
      if (date) {
        documentData.signingYear = new Date(date).getFullYear();
      }
    }

    if (type === "Proyecto") {
      documentData.extensionDocType = extensionDocType;
      documentData.presentationDate = presentationDate;
      documentData.reportPeriod = reportPeriod;
      documentData.executionPeriod = executionPeriod;
    }

    if (type === "Movilidad" || type === "Pasantía") {
      documentData.beneficiaryName = beneficiaryName;
      documentData.programName = programName;
      documentData.convocatoria = convocatoria;
    }

    addDocumentNonBlocking(collection(db, 'documents'), documentData);

    toast({
      title: "Documento almacenado",
      description: "El registro ha sido creado exitosamente.",
    });

    setIsSaving(false);
    resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isSpecialType = type === "Movilidad" || type === "Pasantía";

  const getPlaceholder = () => {
    if (type === "Proyecto") return "Ej: Transición de sistema de producción convencional de vid a sistema de producción orgánica en Hualfín, Catamarca";
    if (type === "Convenio") return "Ej: Convenio Marco de Cooperación Académica...";
    if (isSpecialType) return `Ej: Registro de ${type} Estudiantil 2024...`;
    return "Ingrese el título oficial del registro...";
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
            <h1 className="text-3xl font-headline font-bold uppercase tracking-tight text-primary">Cargar Registro</h1>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mt-1">Repositorio Digital Institucional</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 pb-20">
            {/* PASO 1: CATEGORÍA */}
            <section className="bg-primary/5 p-6 md:p-8 rounded-[2rem] border border-primary/10 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary text-white p-2 rounded-none">
                  <Badge className="bg-transparent border-none p-0 text-lg font-bold">1</Badge>
                </div>
                <h2 className="text-xl font-headline font-bold uppercase tracking-tight">Selección de Categoría</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { id: "Convenio", label: "Convenio", icon: Handshake },
                  { id: "Proyecto", label: "Proyecto de Extensión", icon: ArrowLeftRight },
                  { id: "Movilidad", label: "Movilidad", icon: Plane },
                  { id: "Pasantía", label: "Práctica / Pasantía", icon: GraduationCap },
                  { id: "Resolución", label: "Resolución", icon: ScrollText },
                  { id: "Reglamento", label: "Reglamento", icon: ScrollText }
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

            {/* PASO 2: METADATOS Y DETALLES */}
            <section className={`bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-muted transition-opacity duration-300 ${type ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-primary/20 text-primary p-2 rounded-none">
                  <Badge className="bg-transparent border-none p-0 text-lg font-bold text-primary">2</Badge>
                </div>
                <h2 className="text-xl font-headline font-bold uppercase tracking-tight">Metadatos y Detalles</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 col-span-2">
                  <Label htmlFor="title" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título Oficial del Registro</Label>
                  <Input 
                    id="title" 
                    placeholder={getPlaceholder()}
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
                          <SelectItem value="Práctica/Pasantía">Práctica/Pasantía</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="date" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5" /> Fecha de Firma
                      </Label>
                      <Input 
                        id="date" 
                        type="date" 
                        className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                        required={type === "Convenio"}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="duration" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                        <Timer className="w-3.5 h-3.5" /> Duración del Convenio (Años)
                      </Label>
                      <Input 
                        id="duration" 
                        type="number"
                        min="1"
                        placeholder="Ej: 2"
                        className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                        required={type === "Convenio"}
                        value={durationYears}
                        onChange={(e) => setDurationYears(e.target.value)}
                      />
                    </div>
                    
                    <div className="col-span-2 flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <UserCheck className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black uppercase text-[10px] tracking-widest text-primary">Responsable Institucional</span>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">¿El convenio tiene un responsable asignado?</span>
                        </div>
                      </div>
                      <Switch checked={hasInstitutionalResponsible} onCheckedChange={setHasInstitutionalResponsible} />
                    </div>

                    {hasInstitutionalResponsible && (
                      <div className="col-span-2 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <Label htmlFor="authors" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Nombres de los Responsables (separados por coma)</Label>
                        <Input 
                          id="authors" 
                          placeholder="Ej: Dr. Gómez, Ing. Pérez..." 
                          className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                          required={hasInstitutionalResponsible}
                          value={authors}
                          onChange={(e) => setAuthors(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {type === "Proyecto" && (
                  <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-secondary/30 rounded-2xl border-2 border-primary/10">
                    <div className="space-y-3">
                      <Label htmlFor="extensionType" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Tipo de Documentación</Label>
                      <Select value={extensionDocType} onValueChange={setExtensionDocType}>
                        <SelectTrigger className="h-12 rounded-xl border-primary/20 bg-white font-bold">
                          <SelectValue placeholder="Seleccione tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Proyecto">Proyecto</SelectItem>
                          <SelectItem value="Resolución de aprobación">Resolución de aprobación</SelectItem>
                          <SelectItem value="Informe de avance">Informe de avance</SelectItem>
                          <SelectItem value="Informe final">Informe final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="date" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                        <CalendarIcon className="w-3.5 h-3.5" /> Fecha de Aprobación
                      </Label>
                      <Input 
                        id="date" 
                        type="date" 
                        className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                        required={type === "Proyecto"}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3 col-span-2">
                      <Label htmlFor="authors" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Autores (separados por coma)</Label>
                      <Input 
                        id="authors" 
                        placeholder="Ej: Dr. Gómez, Ing. Pérez..." 
                        className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                        required={type === "Proyecto"}
                        value={authors}
                        onChange={(e) => setAuthors(e.target.value)}
                      />
                    </div>

                    {extensionDocType === "Proyecto" && (
                      <div className="space-y-3 col-span-2">
                        <Label htmlFor="executionPeriod" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Período de Ejecución</Label>
                        <Input 
                          id="executionPeriod" 
                          placeholder="Ej: 2024 - 2025" 
                          className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                          required={extensionDocType === "Proyecto"}
                          value={executionPeriod}
                          onChange={(e) => setExecutionPeriod(e.target.value)}
                        />
                      </div>
                    )}

                    {(extensionDocType === "Informe de avance" || extensionDocType === "Informe final") && (
                      <div className="space-y-3 col-span-2">
                        <Label htmlFor="presentationDate" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Fecha de Presentación del Informe</Label>
                        <Input 
                          id="presentationDate" 
                          type="date"
                          className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                          required={extensionDocType?.includes('Informe')}
                          value={presentationDate}
                          onChange={(e) => setPresentationDate(e.target.value)}
                        />
                      </div>
                    )}

                    {extensionDocType === "Informe de avance" && (
                      <div className="space-y-3 col-span-2">
                        <Label htmlFor="reportPeriod" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Período que abarca el informe</Label>
                        <Input 
                          id="reportPeriod" 
                          placeholder="Ej: Enero - Junio 2024" 
                          className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                          required={extensionDocType === "Informe de avance"}
                          value={reportPeriod}
                          onChange={(e) => setReportPeriod(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )}

                {isSpecialType && (
                  <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-primary/5 rounded-2xl border-2 border-primary/10">
                    <div className="space-y-3">
                      <Label htmlFor="beneficiary" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> Nombre del Beneficiario / Pasante
                      </Label>
                      <Input 
                        id="beneficiary" 
                        placeholder="Ej: Juan Pérez" 
                        className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                        required={isSpecialType}
                        value={beneficiaryName}
                        onChange={(e) => setBeneficiaryName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="program" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5" /> Programa Institucional
                      </Label>
                      <Input 
                        id="program" 
                        placeholder="Ej: Programa de Intercambio ARFITEC" 
                        className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                        required={isSpecialType}
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-3 col-span-2">
                      <Label htmlFor="convocatoria" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                        <ClipboardList className="w-3.5 h-3.5" /> Convocatoria / Año
                      </Label>
                      <Input 
                        id="convocatoria" 
                        placeholder="Ej: Convocatoria 2024 - 1er Cuatrimestre" 
                        className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                        required={isSpecialType}
                        value={convocatoria}
                        onChange={(e) => setConvocatoria(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {(type === "Resolución" || type === "Reglamento") && (
                  <>
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
                      <Label htmlFor="authors" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Autores (separados por coma)</Label>
                      <Input 
                        id="authors" 
                        placeholder="Ej: Dr. Gómez, Ing. Pérez..." 
                        className="h-12 rounded-xl border-muted-foreground/20 bg-muted/20 font-bold" 
                        required 
                        value={authors}
                        onChange={(e) => setAuthors(e.target.value)}
                      />
                    </div>
                  </>
                )}

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
            </section>

            {/* PASO 3: DOCUMENTACIÓN Y ANÁLISIS */}
            <section className={`transition-opacity duration-300 ${title ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/20 text-primary p-2 rounded-none">
                  <Badge className="bg-transparent border-none p-0 text-lg font-bold text-primary">3</Badge>
                </div>
                <h2 className="text-xl font-headline font-bold uppercase tracking-tight">
                  Documentación y Análisis
                </h2>
              </div>

              {(isSpecialType || type === "Proyecto") && (
                <div className="mb-6 p-4 bg-primary/5 border border-dashed border-primary/20 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                    Adjunte {type === "Proyecto" ? "Proyectos, Resoluciones o Informes" : "Convenios, Resoluciones o Actas"} que avalen este registro de {type}.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                  <Tabs defaultValue="file" value={uploadMethod} onValueChange={setUploadMethod} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-14 rounded-2xl bg-muted/50 p-1 mb-6">
                      <TabsTrigger value="file" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                        <FileUp className="w-4 h-4" /> Archivo (Solo PDF)
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
                              <p className="text-xl font-black mb-1 uppercase tracking-tight">Subir Documentación</p>
                              <p className="text-muted-foreground text-xs font-bold mb-6 uppercase tracking-widest">Formato PDF (Máx 20MB)</p>
                              <Label htmlFor="file-upload" className="cursor-pointer">
                                <div className="bg-primary text-primary-foreground px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                  Seleccionar Archivo
                                </div>
                                <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf" />
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
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Resumen del Contenido</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-8 rounded-lg gap-2 border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest hover:bg-primary/5"
                      onClick={handleAiSummarize}
                      disabled={isSummarizing || (!file && !externalUrl)}
                    >
                      {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Analizar con IA
                    </Button>
                  </div>
                  {aiError && (
                    <Alert variant="destructive" className="mb-4 rounded-xl">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Fallo en IA</AlertTitle>
                      <AlertDescription className="text-[11px] font-bold">
                        {aiError}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Textarea 
                    id="description" 
                    placeholder="Ingrese un resumen manualmente o presione el botón superior para generarlo con IA a partir del documento subido..." 
                    className="min-h-[180px] rounded-2xl border-muted-foreground/20 bg-muted/20 font-medium p-4 leading-relaxed" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight italic">
                    * El análisis de IA utiliza Gemini 2.5 Flash para interpretar el contenido visual del archivo.
                  </p>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex flex-col md:flex-row items-center justify-end gap-4 mt-12 pt-8 border-t border-dashed">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full md:w-auto h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:bg-muted" 
                  onClick={() => router.push("/")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Salir
                </Button>
                <Button 
                  type="submit" 
                  className="w-full md:w-auto h-14 px-12 rounded-xl font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 uppercase tracking-widest text-[11px]" 
                  disabled={isSaving || (!file && !externalUrl) || !title}
                >
                  {isSaving ? (
                    <span className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" /> Guardando...
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
