
"use client";

import { useState, useEffect } from "react";
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
  ArrowLeftRight,
  Fingerprint,
  ChevronDown,
  MapPin,
  Globe,
  Landmark,
  ListTodo
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, query, where, getCountFromServer, getDocs, limit } from "firebase/firestore";
import { summarizeDocument } from "@/ai/flows/smart-document-summarization";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const YEARS = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);

export default function UploadPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();

  const [type, setType] = useState("");
  const [resolutionType, setResolutionType] = useState<string>("");
  const [resolutionYear, setResolutionYear] = useState<string>(new Date().getFullYear().toString());
  const [uploadMethod, setUploadMethod] = useState<string>("file");
  const [file, setFile] = useState<File | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [authors, setAuthors] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [durationYears, setDurationYears] = useState<string>("1");
  const [counterpart, setCounterpart] = useState("");
  const [convenioSubType, setConvenioSubType] = useState("Marco");
  const [hasInstitutionalResponsible, setHasInstitutionalResponsible] = useState(false);
  
  const [beneficiaryFirstName, setBeneficiaryFirstName] = useState("");
  const [beneficiaryLastName, setBeneficiaryLastName] = useState("");
  const [programName, setProgramName] = useState("");
  const [convocatoria, setConvocatoria] = useState("");
  const [destinationInstitution, setDestinationInstitution] = useState("");
  const [destinationProvince, setDestinationProvince] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("");

  const [extensionDocType, setExtensionDocType] = useState("");
  const [presentationDate, setPresentationDate] = useState("");
  const [reportPeriod, setReportPeriod] = useState("");
  const [executionPeriod, setExecutionPeriod] = useState("");
  const [projectCodeNumber, setProjectCodeNumber] = useState("");
  const [isProjectDataLoading, setIsProjectDataLoading] = useState(false);
  const [linkedProjectFound, setLinkedProjectFound] = useState(false);

  // Objetivos de Proyecto
  const [objetivoGeneral, setObjetivoGeneral] = useState("");
  const [hasSpecificObjectives, setHasSpecificObjectives] = useState(false);
  const [specificObjectives, setSpecificObjectives] = useState<string[]>(["", "", ""]);

  const [reportMonth, setReportMonth] = useState(MONTHS[new Date().getMonth()]);
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
  const [execStartMonth, setExecStartMonth] = useState(MONTHS[new Date().getMonth()]);
  const [execStartYear, setExecStartYear] = useState(new Date().getFullYear().toString());
  const [execEndMonth, setExecEndMonth] = useState(MONTHS[new Date().getMonth()]);
  const [execEndYear, setExecEndYear] = useState(new Date().getFullYear().toString());

  const [approvalDate, setApprovalDate] = useState<Date | undefined>(undefined);
  const [presDate, setPresDate] = useState<Date | undefined>(undefined);
  const [pasantiaRange, setPasantiaRange] = useState<{from?: Date, to?: Date}>({});

  const isSecondaryExtensionDoc = extensionDocType && extensionDocType !== "Proyecto";
  const isResolution = extensionDocType === "Resolución de aprobación" || type === "Resolución" || type === "Reglamento";

  useEffect(() => {
    if (approvalDate) {
      setDate(approvalDate.toISOString().split('T')[0]);
    }
  }, [approvalDate]);

  useEffect(() => {
    if (presDate) {
      setPresentationDate(presDate.toISOString().split('T')[0]);
    }
  }, [presDate]);

  const updateExecutionPeriod = (sm: string, sy: string, em: string, ey: string) => {
    setExecutionPeriod(`${sm} ${sy} - ${em} ${ey}`);
  };

  const resetForm = () => {
    setType("");
    setResolutionType("");
    setResolutionYear(new Date().getFullYear().toString());
    setFile(null);
    setExternalUrl("");
    setTitle("");
    setDate("");
    setAuthors("");
    setDescription("");
    setDurationYears("1");
    setCounterpart("");
    setConvenioSubType("Marco");
    setHasInstitutionalResponsible(false);
    setBeneficiaryFirstName("");
    setBeneficiaryLastName("");
    setProgramName("");
    setConvocatoria("");
    setDestinationInstitution("");
    setDestinationProvince("");
    setDestinationCountry("");
    setExtensionDocType("");
    setPresentationDate("");
    setReportPeriod("");
    setExecutionPeriod("");
    setProjectCodeNumber("");
    setLinkedProjectFound(false);
    setAiError(null);
    setApprovalDate(undefined);
    setPresDate(undefined);
    setPasantiaRange({});
    setObjetivoGeneral("");
    setHasSpecificObjectives(false);
    setSpecificObjectives(["", "", ""]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !type || (!title && !isResolution)) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor complete la información requerida.",
      });
      return;
    }

    setIsSaving(true);
    
    const trimmedTitle = title.trim();
    const formattedTitle = trimmedTitle.charAt(0).toUpperCase() + trimmedTitle.slice(1);

    let finalTitle = formattedTitle;
    if (type === "Resolución") {
      finalTitle = `Resolución ${resolutionType} N° ${title}/${resolutionYear}`;
    } else if (type === "Reglamento") {
      finalTitle = `Reglamento N° ${title}/${resolutionYear}`;
    }

    const documentData: any = {
      title: finalTitle,
      type,
      date,
      authors: (type === "Resolución" || type === "Reglamento") ? [] : authors.split(',').map(a => a.trim()).filter(Boolean),
      description: isResolution ? "" : description,
      uploadDate: new Date().toISOString(),
      uploadedByUserId: user.uid,
      imageUrl: "https://picsum.photos/seed/" + Math.random() + "/600/400",
      fileType: uploadMethod === "file" ? (file?.type || "application/pdf") : "url",
      fileUrl: uploadMethod === "file" ? "#" : externalUrl,
    };

    if (type === "Resolución" || type === "Reglamento") {
      documentData.resolutionType = resolutionType;
      documentData.resolutionYear = parseInt(resolutionYear);
    }

    const currentYear = new Date().getFullYear();

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
      
      if (extensionDocType === "Proyecto") {
        documentData.objetivoGeneral = objetivoGeneral;
        documentData.objetivosEspecificos = hasSpecificObjectives ? specificObjectives.filter(o => o.trim() !== "") : [];
        
        try {
          const coll = collection(db, 'documents');
          const q = query(coll, where("type", "==", "Proyecto"), where("extensionDocType", "==", "Proyecto"));
          const snapshot = await getCountFromServer(q);
          const nextNum = (snapshot.data().count + 1).toString().padStart(3, '0');
          documentData.projectCode = `FCA-EXT-${nextNum}-${currentYear}`;
        } catch (error) {
          console.error("Error generating project code:", error);
          const randNum = Math.floor(Math.random() * 999).toString().padStart(3, '0');
          documentData.projectCode = `FCA-EXT-${randNum}-${currentYear}`;
        }
      } else if (projectCodeNumber) {
        documentData.projectCode = `FCA-EXT-${projectCodeNumber.padStart(3, '0')}-${currentYear}`;
      }
    }

    if (type === "Movilidad" || type === "Pasantía") {
      documentData.beneficiaryName = `${beneficiaryFirstName} ${beneficiaryLastName}`.trim();
      documentData.programName = programName;
      documentData.convocatoria = convocatoria;
      documentData.destinationInstitution = destinationInstitution;
      documentData.destinationProvince = destinationProvince;
      documentData.destinationCountry = destinationCountry;
      if (type === "Pasantía") {
        documentData.executionPeriod = executionPeriod;
      }
    }

    addDocumentNonBlocking(collection(db, 'documents'), documentData);

    toast({
      title: documentData.projectCode ? `Registro guardado (Código: ${documentData.projectCode})` : "Documento almacenado",
      description: "El registro institucional ha sido creado exitosamente.",
    });

    setIsSaving(false);
    resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPlaceholder = () => {
    if (type === "Proyecto") return "Ej: Transición de sistema de producción convencional de vid a sistema de producción orgánica...";
    if (type === "Convenio") return "Ej: Convenio Marco de Cooperación Académica...";
    if (type === "Pasantía") return "Ej: Practica/Pasantía de Juan Pérez en Empresa Agrícola...";
    if (type === "Resolución" || type === "Reglamento") return "N° 123";
    if (type === "Movilidad") return "Ej: Resolución de Movilidad Estudiantil 2024...";
    return "Ingrese el título oficial del registro...";
  };

  useEffect(() => {
    async function fetchProjectData() {
      if (type === "Proyecto" && isSecondaryExtensionDoc && projectCodeNumber.length === 3) {
        setIsProjectDataLoading(true);
        try {
          const currentYear = new Date().getFullYear();
          const targetCode = `FCA-EXT-${projectCodeNumber}-${currentYear}`;
          
          const q = query(
            collection(db, 'documents'), 
            where("projectCode", "==", targetCode),
            where("extensionDocType", "==", "Proyecto"),
            limit(1)
          );
          
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const projectDoc = querySnapshot.docs[0].data();
            setTitle(projectDoc.title || "");
            setAuthors(projectDoc.authors?.join(", ") || "");
            setExecutionPeriod(projectDoc.executionPeriod || "");
            setLinkedProjectFound(true);
            toast({
              title: "Proyecto vinculado encontrado",
              description: `Información cargada para ${targetCode}`,
            });
          } else {
            setTitle("");
            setAuthors("");
            setExecutionPeriod("");
            setLinkedProjectFound(false);
          }
        } catch (error) {
          console.error("Error fetching project data:", error);
        } finally {
          setIsProjectDataLoading(false);
        }
      }
    }

    fetchProjectData();
  }, [projectCodeNumber, extensionDocType, type, db, isSecondaryExtensionDoc]);

  const addSpecificObjective = () => {
    setSpecificObjectives([...specificObjectives, ""]);
  };

  const updateSpecificObjective = (index: number, value: string) => {
    const updated = [...specificObjectives];
    updated[index] = value;
    setSpecificObjectives(updated);
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
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-headline font-bold uppercase tracking-tight text-primary">Cargar Registro</h1>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">Repositorio Digital Institucional</p>
          </div>

          <form onSubmit={handleSubmit} className={cn("space-y-6 md:space-y-8", type ? "pb-20" : "pb-10")}>
            <section className="bg-primary/5 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-primary/10 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-primary text-white p-2 rounded-none">
                  <Badge className="bg-transparent border-none p-0 text-base md:text-lg font-bold">1</Badge>
                </div>
                <h2 className="text-lg md:text-xl font-headline font-bold uppercase tracking-tight">Selección de Categoría</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                {[
                  { id: "Convenio", label: "Convenio", icon: Handshake },
                  { id: "Proyecto", label: "Extensión", icon: ArrowLeftRight },
                  { id: "Movilidad", label: "Movilidad", icon: Plane },
                  { id: "Pasantía", label: "Práctica / Pasantía", icon: GraduationCap },
                  { id: "Resolución", label: "Resolución", icon: ScrollText },
                  { id: "Reglamento", label: "Reglamento", icon: ScrollText }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setType(item.id); resetForm(); setType(item.id); }}
                    className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all gap-2 ${
                      type === item.id 
                        ? 'border-primary bg-primary/10 text-primary shadow-md' 
                        : 'border-muted-foreground/10 bg-white hover:border-primary/30 hover:bg-muted/50'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 md:w-6 md:h-6 ${type === item.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-bold uppercase tracking-widest text-[8px] md:text-[9px] text-center leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {type && (
              <section className="bg-white p-5 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-muted animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                  <div className="bg-primary/20 text-primary p-2 rounded-none">
                    <Badge className="bg-transparent border-none p-0 text-base md:text-lg font-bold text-primary">2</Badge>
                  </div>
                  <h2 className="text-lg md:text-xl font-headline font-bold uppercase tracking-tight">Metadatos y Detalles</h2>
                </div>

                <div className="grid grid-cols-1 gap-6 md:gap-8 items-start">
                  {type === "Proyecto" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6 bg-secondary/30 rounded-2xl border-2 border-primary/10 items-end">
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Tipo de Documentación</Label>
                        <Select value={extensionDocType} onValueChange={setExtensionDocType}>
                          <SelectTrigger className="h-11 md:h-12 rounded-xl border-primary/20 bg-white font-bold">
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

                      {isSecondaryExtensionDoc ? (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                            <Fingerprint className="w-3.5 h-3.5" /> Código del Proyecto
                          </Label>
                          <div className="flex items-center gap-0">
                            <div className="h-11 md:h-12 px-3 md:px-4 rounded-l-xl bg-primary text-white flex items-center font-black text-[10px] md:text-sm uppercase tracking-widest border border-primary border-r-0 whitespace-nowrap">
                              FCA-EXT-
                            </div>
                            <Input 
                              placeholder="001" 
                              maxLength={3}
                              className="h-11 md:h-12 rounded-l-none rounded-r-xl border-primary/20 bg-white font-bold focus:ring-primary/10 min-w-0" 
                              required={isSecondaryExtensionDoc}
                              value={projectCodeNumber}
                              onChange={(e) => setProjectCodeNumber(e.target.value.replace(/\D/g, ""))}
                            />
                          </div>
                        </div>
                      ) : (
                        extensionDocType === "Proyecto" && (
                          <div className="space-y-2 animate-in fade-in duration-300">
                            <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                              <CalendarIcon className="w-3.5 h-3.5" /> Período de Ejecución
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                               <div className="flex flex-col gap-1">
                                 <span className="text-[8px] font-bold text-muted-foreground uppercase ml-1">Desde</span>
                                 <div className="flex gap-1">
                                   <Select value={execStartMonth} onValueChange={(m) => { setExecStartMonth(m); updateExecutionPeriod(m, execStartYear, execEndMonth, execEndYear); }}>
                                      <SelectTrigger className="h-9 rounded-lg border-primary/20 bg-white font-bold text-[10px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                      </SelectContent>
                                   </Select>
                                   <Select value={execStartYear} onValueChange={(y) => { setExecStartYear(y); updateExecutionPeriod(execStartMonth, y, execEndMonth, execEndYear); }}>
                                      <SelectTrigger className="h-9 rounded-lg border-primary/20 bg-white font-bold text-[10px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                      </SelectContent>
                                   </Select>
                                 </div>
                               </div>
                               <div className="flex flex-col gap-1">
                                 <span className="text-[8px] font-bold text-muted-foreground uppercase ml-1">Hasta</span>
                                 <div className="flex gap-1">
                                   <Select value={execEndMonth} onValueChange={(m) => { setExecEndMonth(m); updateExecutionPeriod(execStartMonth, execStartYear, m, execEndYear); }}>
                                      <SelectTrigger className="h-9 rounded-lg border-primary/20 bg-white font-bold text-[10px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                      </SelectContent>
                                   </Select>
                                   <Select value={execEndYear} onValueChange={(y) => { setExecEndYear(y); updateExecutionPeriod(execStartMonth, execStartYear, execEndMonth, y); }}>
                                      <SelectTrigger className="h-9 rounded-lg border-primary/20 bg-white font-bold text-[10px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                                      </SelectContent>
                                   </Select>
                                 </div>
                               </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {(type === "Proyecto" && (extensionDocType === "Proyecto" || linkedProjectFound)) && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título Oficial del Proyecto</Label>
                        <Input 
                          placeholder={getPlaceholder()}
                          className="h-11 md:h-12 rounded-xl border-muted-foreground/20 bg-muted/20 font-bold disabled:opacity-80 text-xs md:text-sm" 
                          required 
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          disabled={isSecondaryExtensionDoc}
                        />
                      </div>

                      {!isSecondaryExtensionDoc && (
                        <div className="space-y-6 animate-in slide-in-from-top-2">
                          <div className="space-y-2">
                            <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5" /> Objetivo General
                            </Label>
                            <Textarea 
                              placeholder="Describa el propósito principal del proyecto..."
                              className="min-h-[100px] rounded-xl bg-primary/5 border-primary/20 font-medium"
                              value={objetivoGeneral}
                              onChange={(e) => setObjetivoGeneral(e.target.value)}
                              required={extensionDocType === "Proyecto"}
                            />
                          </div>

                          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                            <div className="flex items-center gap-3">
                              <ListTodo className="w-5 h-5 text-primary" />
                              <div className="flex flex-col">
                                <span className="font-black uppercase text-[10px] tracking-widest text-primary leading-tight">Objetivos Específicos</span>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase">¿Desea detallar objetivos específicos?</span>
                              </div>
                            </div>
                            <Switch checked={hasSpecificObjectives} onCheckedChange={setHasSpecificObjectives} />
                          </div>

                          {hasSpecificObjectives && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 pl-4 border-l-2 border-primary/20">
                              {specificObjectives.map((obj, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                  <div className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                                    {idx + 1}
                                  </div>
                                  <Input 
                                    placeholder={`Objetivo específico ${idx + 1}...`}
                                    className="h-10 rounded-xl border-muted-foreground/10 bg-white font-medium text-xs"
                                    value={obj}
                                    onChange={(e) => updateSpecificObjective(idx, e.target.value)}
                                  />
                                </div>
                              ))}
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="text-primary font-black text-[10px] uppercase tracking-widest hover:bg-primary/10 rounded-xl"
                                onClick={addSpecificObjective}
                              >
                                <Plus className="w-3 h-3 mr-2" /> Agregar objetivo
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {type === "Convenio" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6 bg-secondary/30 rounded-2xl border-2 border-primary/10">
                      <div className="space-y-2 md:col-span-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título Oficial del Convenio</Label>
                        <Input 
                          placeholder={getPlaceholder()}
                          className="h-11 md:h-12 rounded-xl border-muted-foreground/20 bg-white font-bold text-xs md:text-sm" 
                          required={type === "Convenio"}
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5" /> Institución Contraparte
                        </Label>
                        <Input 
                          placeholder="Ej: INTA, SENASA..." 
                          className="h-11 md:h-12 rounded-xl border-primary/20 bg-white font-bold text-xs md:text-sm" 
                          required={type === "Convenio"}
                          value={counterpart}
                          onChange={(e) => setCounterpart(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Tipo de Convenio</Label>
                        <Select value={convenioSubType} onValueChange={setConvenioSubType}>
                          <SelectTrigger className="h-11 md:h-12 rounded-xl border-primary/20 bg-white font-bold">
                            <SelectValue placeholder="Seleccione subtipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Marco">Marco</SelectItem>
                            <SelectItem value="Específico">Específico</SelectItem>
                            <SelectItem value="Práctica/Pasantía">Práctica/Pasantía</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5" /> Fecha de Firma
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full h-11 md:h-12 justify-start text-left font-bold rounded-xl border-primary/20 bg-white text-xs md:text-sm",
                                !date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? format(new Date(date), "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={approvalDate}
                              onSelect={setApprovalDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                          <Timer className="w-3.5 h-3.5" /> Duración (Años)
                        </Label>
                        <Input 
                          type="number"
                          min="1"
                          className="h-11 md:h-12 rounded-xl border-primary/20 bg-white font-bold text-xs md:text-sm" 
                          required={type === "Convenio"}
                          value={durationYears}
                          onChange={(e) => setDurationYears(e.target.value)}
                        />
                      </div>
                      
                      <div className="md:col-span-2 flex items-center justify-between p-3 md:p-4 bg-primary/5 rounded-xl border border-primary/20">
                        <div className="flex flex-col">
                          <span className="font-black uppercase text-[9px] md:text-[10px] tracking-widest text-primary leading-tight">Responsable Institucional</span>
                          <span className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase leading-tight">¿El convenio tiene un responsable?</span>
                        </div>
                        <Switch checked={hasInstitutionalResponsible} onCheckedChange={setHasInstitutionalResponsible} />
                      </div>

                      {hasInstitutionalResponsible && (
                        <div className="md:col-span-2 space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Responsables (separados por coma)</Label>
                          <Input 
                            placeholder="Ej: Dr. Gómez, Ing. Pérez..." 
                            className="h-11 md:h-12 rounded-xl border-primary/20 bg-white font-bold text-xs md:text-sm" 
                            required={hasInstitutionalResponsible}
                            value={authors}
                            onChange={(e) => setAuthors(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {(type === "Movilidad" || type === "Pasantía") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6 bg-primary/5 rounded-2xl border-2 border-primary/10">
                      <div className="space-y-2 md:col-span-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título del Registro</Label>
                        <Input 
                          placeholder={getPlaceholder()}
                          className="h-11 md:h-12 rounded-xl border-muted-foreground/20 bg-white font-bold text-xs md:text-sm" 
                          required 
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Nombre</Label>
                        <Input 
                          placeholder="Ej: Juan" 
                          className="h-11 md:h-12 rounded-xl border-primary/20 bg-white font-bold text-xs md:text-sm" 
                          required 
                          value={beneficiaryFirstName}
                          onChange={(e) => setBeneficiaryFirstName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Apellido</Label>
                        <Input 
                          placeholder="Ej: Pérez" 
                          className="h-11 md:h-12 rounded-xl border-primary/20 bg-white font-bold text-xs md:text-sm" 
                          required 
                          value={beneficiaryLastName}
                          onChange={(e) => setBeneficiaryLastName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">
                          Siglas del Programa
                        </Label>
                        <Input 
                          placeholder={type === "Pasantía" ? "Ej: Practicas Pre-profesionales" : "Ej: ARFITEC, JIMA..."} 
                          className="h-11 md:h-12 rounded-xl border-primary/20 bg-white font-bold text-xs md:text-sm" 
                          required 
                          value={programName}
                          onChange={(e) => setProgramName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">
                          {type === "Pasantía" ? "Período (Desde - Hasta)" : "Semestre / Convocatoria"}
                        </Label>
                        {type === "Pasantía" ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full h-11 md:h-12 justify-start font-bold rounded-xl border-primary/20 bg-white text-xs md:text-sm">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {pasantiaRange.from && pasantiaRange.to ? `${format(pasantiaRange.from, "P", { locale: es })} - ${format(pasantiaRange.to, "P", { locale: es })}` : "Seleccionar fechas"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="range" selected={{from: pasantiaRange.from, to: pasantiaRange.to}} onSelect={(range) => {
                                setPasantiaRange({from: range?.from, to: range?.to});
                                if (range?.from && range?.to) {
                                  setExecutionPeriod(`${format(range.from, "dd/MM/yyyy")} - ${format(range.to, "dd/MM/yyyy")}`);
                                }
                              }} initialFocus />
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <Input 
                            placeholder="Ej: 1er Semestre 2024" 
                            className="h-11 md:h-12 rounded-xl border-primary/20 bg-white font-bold text-xs md:text-sm" 
                            required 
                            value={convocatoria}
                            onChange={(e) => setConvocatoria(e.target.value)}
                          />
                        )}
                      </div>
                      <div className="md:col-span-2 h-px bg-primary/10 my-2" />
                      <div className="space-y-2 md:col-span-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" /> {type === "Pasantía" ? "Lugar de la Pasantía" : "Destino de la Movilidad"}
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Input placeholder="Institución/Empresa" className="h-10 rounded-xl border-primary/10 bg-white font-bold text-xs md:text-sm" value={destinationInstitution} onChange={(e) => setDestinationInstitution(e.target.value)} required />
                          <Input placeholder="Provincia/Estado" className="h-10 rounded-xl border-primary/10 bg-white font-bold text-xs md:text-sm" value={destinationProvince} onChange={(e) => setDestinationProvince(e.target.value)} required />
                          <Input placeholder="País" className="h-10 rounded-xl border-primary/10 bg-white font-bold text-xs md:text-sm" value={destinationCountry} onChange={(e) => setDestinationCountry(e.target.value)} required />
                        </div>
                      </div>
                    </div>
                  )}

                  {(type === "Resolución" || type === "Reglamento") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Tipo de Resolución</Label>
                        <Select value={resolutionType} onValueChange={setResolutionType}>
                          <SelectTrigger className="h-11 md:h-12 rounded-xl border-primary/20 bg-white font-bold">
                            <SelectValue placeholder="Seleccione tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CD">CD</SelectItem>
                            <SelectItem value="Decanal">Decanal</SelectItem>
                            <SelectItem value="Rectoral">Rectoral</SelectItem>
                            <SelectItem value="SEU">SEU</SelectItem>
                            <SelectItem value="Ministerial">Ministerial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Número</Label>
                        <Input 
                          placeholder={getPlaceholder()}
                          className="h-11 md:h-12 rounded-xl border-muted-foreground/20 bg-muted/20 font-bold text-xs md:text-sm" 
                          required 
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Año</Label>
                        <Select value={resolutionYear} onValueChange={setResolutionYear}>
                          <SelectTrigger className="h-11 md:h-12 rounded-xl border-primary/20 bg-white font-bold">
                            <SelectValue placeholder="Año" />
                          </SelectTrigger>
                          <SelectContent>
                            {YEARS.map(y => (
                              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5" /> Fecha de Aprobación
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full h-11 md:h-12 justify-start font-bold rounded-xl border-muted-foreground/20 bg-muted/20 text-xs md:text-sm">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? format(new Date(date), "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={approvalDate} onSelect={setApprovalDate} initialFocus />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {(type && (title || linkedProjectFound)) && (
              <section className="animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary/20 text-primary p-2 rounded-none">
                    <Badge className="bg-transparent border-none p-0 text-base md:text-lg font-bold text-primary">3</Badge>
                  </div>
                  <h2 className="text-lg md:text-xl font-headline font-bold uppercase tracking-tight">Documentación y Análisis</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
                  <div className="space-y-4">
                    <Tabs defaultValue="file" value={uploadMethod} onValueChange={setUploadMethod} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-12 md:h-14 rounded-xl md:rounded-2xl bg-muted/50 p-1 mb-4 md:mb-6">
                        <TabsTrigger value="file" className="rounded-lg md:rounded-xl font-black uppercase text-[8px] md:text-[10px] tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                          <FileUp className="w-3 h-3 md:w-4 md:h-4" /> Archivo PDF
                        </TabsTrigger>
                        <TabsTrigger value="url" className="rounded-lg md:rounded-xl font-black uppercase text-[8px] md:text-[10px] tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                          <LinkIcon className="w-3 h-3 md:w-4 md:h-4" /> Enlace Externo
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="file">
                        <div className={`border-2 border-dashed rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 flex flex-col items-center justify-center transition-all ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'}`}>
                          {file ? (
                            <div className="text-center">
                              <FileText className="w-8 h-8 md:w-12 md:h-12 text-primary mx-auto mb-3" />
                              <p className="font-black truncate max-w-[200px] md:max-w-[300px] text-xs md:text-sm">{file.name}</p>
                              <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="mt-2 text-destructive font-bold text-[9px] md:text-[10px]">ELIMINAR Y CAMBIAR</Button>
                            </div>
                          ) : (
                            <Label htmlFor="file-upload" className="cursor-pointer text-center">
                              <Upload className="w-8 h-8 md:w-10 md:h-10 text-primary mx-auto mb-3 md:mb-4" />
                              <p className="text-lg md:text-xl font-black uppercase">Subir Documentación</p>
                              <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf" />
                            </Label>
                          )}
                        </div>
                      </TabsContent>
                      <TabsContent value="url">
                        <Input placeholder="https://..." className="h-11 md:h-12 rounded-xl bg-white font-bold text-xs md:text-sm" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
                      </TabsContent>
                    </Tabs>
                  </div>

                  {!isResolution && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="flex items-center justify-between">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Resumen (Opcional)</Label>
                        <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg text-primary font-black text-[9px]" onClick={handleAiSummarize} disabled={isSummarizing || (!file && !externalUrl)}>
                          {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} ANALIZAR CON IA
                        </Button>
                      </div>
                      <Textarea placeholder="Escriba un resumen manual o use la IA para generarlo automáticamente..." className="min-h-[150px] md:min-h-[180px] rounded-xl md:rounded-2xl bg-muted/20 font-medium text-xs md:text-sm leading-relaxed" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row justify-end gap-3 md:gap-4 mt-8 md:mt-12 pt-6 md:pt-8 border-t border-dashed">
                  <Button type="button" variant="ghost" className="h-11 md:h-12 rounded-xl font-black uppercase text-[10px] order-2 md:order-1" onClick={() => router.push("/")}><ArrowLeft className="w-4 h-4 mr-2" /> Salir</Button>
                  <Button type="submit" className="h-12 md:h-14 px-8 md:px-12 rounded-xl font-black bg-primary text-white uppercase text-[10px] md:text-[11px] order-1 md:order-2" disabled={isSaving || (!file && !externalUrl)}>
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2"><Save className="w-5 h-5" /> Almacenar Registro</span>}
                  </Button>
                </div>
              </section>
            )}
          </form>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
