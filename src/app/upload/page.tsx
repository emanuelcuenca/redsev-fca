
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
  Landmark
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

const YEARS = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);

export default function UploadPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();

  const [type, setType] = useState("");
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

  // States for Month-Year Selectors
  const [reportMonth, setReportMonth] = useState(MONTHS[new Date().getMonth()]);
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());

  const [execStartMonth, setExecStartMonth] = useState(MONTHS[new Date().getMonth()]);
  const [execStartYear, setExecStartYear] = useState(new Date().getFullYear().toString());
  const [execEndMonth, setExecEndMonth] = useState(MONTHS[new Date().getMonth()]);
  const [execEndYear, setExecEndYear] = useState(new Date().getFullYear().toString());

  // States for calendar popovers
  const [approvalDate, setApprovalDate] = useState<Date | undefined>(undefined);
  const [presDate, setPresDate] = useState<Date | undefined>(undefined);

  const isSecondaryExtensionDoc = extensionDocType && extensionDocType !== "Proyecto";
  const isResolution = extensionDocType === "Resolución de aprobación";

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
      description: isResolution ? "" : description,
      uploadDate: new Date().toISOString(),
      uploadedByUserId: user.uid,
      imageUrl: "https://picsum.photos/seed/" + Math.random() + "/600/400",
      fileType: uploadMethod === "file" ? (file?.type || "application/pdf") : "url",
      fileUrl: uploadMethod === "file" ? "#" : externalUrl,
    };

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

  const isSpecialType = type === "Movilidad" || type === "Pasantía";

  const getPlaceholder = () => {
    if (type === "Proyecto") return "Ej: Transición de sistema de producción convencional de vid a sistema de producción orgánica en Hualfín, Catamarca";
    if (type === "Convenio") return "Ej: Convenio Marco de Cooperación Académica...";
    if (isSpecialType) return `Ej: Resolución de ${type} Estudiantil 2024...`;
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
      } else if (type === "Proyecto" && isSecondaryExtensionDoc) {
        setTitle("");
        setAuthors("");
        setExecutionPeriod("");
        setLinkedProjectFound(false);
      }
    }

    fetchProjectData();
  }, [projectCodeNumber, extensionDocType, type, db, isSecondaryExtensionDoc]);

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
                  { id: "Proyecto", label: "Extensión", icon: ArrowLeftRight },
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

            <section className={`bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-muted transition-all duration-300 ${type ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-primary/20 text-primary p-2 rounded-none">
                  <Badge className="bg-transparent border-none p-0 text-lg font-bold text-primary">2</Badge>
                </div>
                <h2 className="text-xl font-headline font-bold uppercase tracking-tight">Metadatos y Detalles</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {type === "Proyecto" && (
                  <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-secondary/30 rounded-2xl border-2 border-primary/10 items-end">
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

                    {isSecondaryExtensionDoc ? (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <Label htmlFor="projectCode" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                          <Fingerprint className="w-3.5 h-3.5" /> Código del Proyecto Vinculado
                        </Label>
                        <div className="flex items-center gap-0 group">
                          <div className="h-12 px-4 rounded-l-xl bg-primary text-white flex items-center font-black text-sm uppercase tracking-widest border border-primary border-r-0">
                            FCA-EXT-
                          </div>
                          <Input 
                            id="projectCode" 
                            placeholder="001" 
                            maxLength={3}
                            className="h-12 rounded-l-none rounded-r-xl border-primary/20 bg-white font-bold focus:ring-primary/10" 
                            required={isSecondaryExtensionDoc}
                            value={projectCodeNumber}
                            onChange={(e) => setProjectCodeNumber(e.target.value.replace(/\D/g, ""))}
                          />
                          {isProjectDataLoading && <Loader2 className="w-4 h-4 animate-spin ml-2 text-primary" />}
                        </div>
                      </div>
                    ) : (
                      extensionDocType === "Proyecto" && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                          <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                            <CalendarIcon className="w-3.5 h-3.5" /> Fecha de Aprobación
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-12 justify-start text-left font-bold rounded-xl border-primary/20 bg-white",
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
                      )
                    )}
                  </div>
                )}

                {(extensionDocType === "Proyecto" || (isSecondaryExtensionDoc && linkedProjectFound)) && (
                  <>
                    <div className="space-y-3 col-span-2 animate-in fade-in duration-500">
                      <Label htmlFor="title" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título Oficial del Proyecto</Label>
                      <Input 
                        id="title" 
                        placeholder={getPlaceholder()}
                        className="h-12 rounded-xl border-muted-foreground/20 bg-muted/20 font-bold disabled:opacity-80" 
                        required 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isSecondaryExtensionDoc}
                      />
                    </div>

                    <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-secondary/30 rounded-2xl border-2 border-primary/10 items-start animate-in fade-in duration-500">
                      <div className="space-y-3 col-span-2">
                        <Label htmlFor="authors" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Autores / Responsables</Label>
                        <Input 
                          id="authors" 
                          placeholder="Ej: Dr. Gómez, Ing. Pérez..." 
                          className="h-12 rounded-xl border-primary/20 bg-white font-bold disabled:opacity-80" 
                          required 
                          value={authors}
                          onChange={(e) => setAuthors(e.target.value)}
                          disabled={isSecondaryExtensionDoc}
                        />
                      </div>

                      <div className="space-y-3 col-span-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Período de Ejecución (Mes Año - Mes Año)</Label>
                        {isSecondaryExtensionDoc ? (
                          <Input 
                            value={executionPeriod}
                            className="h-12 rounded-xl border-primary/20 bg-white font-bold disabled:opacity-80"
                            disabled
                          />
                        ) : (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-12 justify-start text-left font-bold rounded-xl border-primary/20 bg-white",
                                  !executionPeriod && "text-muted-foreground"
                                )}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                {executionPeriod ? executionPeriod : <span>Seleccione el período (Mes y Año)</span>}
                                <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[450px] p-4 rounded-2xl shadow-xl" align="start">
                              <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                  <p className="font-black uppercase text-[9px] tracking-widest text-primary">Desde</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="max-h-[140px] overflow-y-auto">
                                      {MONTHS.map(m => (
                                        <Button 
                                          key={`start-m-${m}`} 
                                          variant={execStartMonth === m ? "default" : "ghost"} 
                                          className="w-full justify-start h-8 text-[10px] font-bold"
                                          onClick={() => {
                                            setExecStartMonth(m);
                                            updateExecutionPeriod(m, execStartYear, execEndMonth, execEndYear);
                                          }}
                                        >
                                          {m}
                                        </Button>
                                      ))}
                                    </div>
                                    <div className="max-h-[140px] overflow-y-auto">
                                      {YEARS.map(y => (
                                        <Button 
                                          key={`start-y-${y}`} 
                                          variant={execStartYear === y.toString() ? "default" : "ghost"} 
                                          className="w-full justify-start h-8 text-[10px] font-bold"
                                          onClick={() => {
                                            setExecStartYear(y.toString());
                                            updateExecutionPeriod(execStartMonth, y.toString(), execEndMonth, execEndYear);
                                          }}
                                        >
                                          {y}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <p className="font-black uppercase text-[9px] tracking-widest text-primary">Hasta</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="max-h-[140px] overflow-y-auto">
                                      {MONTHS.map(m => (
                                        <Button 
                                          key={`end-m-${m}`} 
                                          variant={execEndMonth === m ? "default" : "ghost"} 
                                          className="w-full justify-start h-8 text-[10px] font-bold"
                                          onClick={() => {
                                            setExecEndMonth(m);
                                            updateExecutionPeriod(execStartMonth, execStartYear, m, execEndYear);
                                          }}
                                        >
                                          {m}
                                        </Button>
                                      ))}
                                    </div>
                                    <div className="max-h-[140px] overflow-y-auto">
                                      {YEARS.map(y => (
                                        <Button 
                                          key={`end-y-${y}`} 
                                          variant={execEndYear === y.toString() ? "default" : "ghost"} 
                                          className="w-full justify-start h-8 text-[10px] font-bold"
                                          onClick={() => {
                                            setExecEndYear(y.toString());
                                            updateExecutionPeriod(execStartMonth, execStartYear, execEndMonth, y.toString());
                                          }}
                                        >
                                          {y}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>

                      {extensionDocType?.includes('Informe') && (
                        <div className="space-y-3 col-span-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Fecha de Presentación del Informe</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-12 justify-start text-left font-bold rounded-xl border-primary/20 bg-white",
                                  !presentationDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {presentationDate ? format(new Date(presentationDate), "PPP", { locale: es }) : <span>Seleccione fecha de presentación</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={presDate}
                                onSelect={setPresDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}

                      {extensionDocType === "Informe de avance" && (
                        <div className="space-y-3 col-span-2 animate-in fade-in slide-in-from-top-2">
                          <Label htmlFor="reportPeriod" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Período que abarca el informe (Mes Año)</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-12 justify-start text-left font-bold rounded-xl border-primary/20",
                                  !reportPeriod && "text-muted-foreground"
                                )}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                {reportPeriod ? reportPeriod : <span>Seleccione Mes y Año</span>}
                                <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-4 rounded-2xl shadow-xl" align="start">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-widest">Mes</Label>
                                  <div className="grid grid-cols-1 gap-1 max-h-[160px] overflow-y-auto pr-1">
                                    {MONTHS.map(m => (
                                      <Button 
                                        key={`rep-m-${m}`} 
                                        variant={reportMonth === m ? "default" : "ghost"}
                                        size="sm"
                                        className="h-8 text-xs font-bold"
                                        onClick={() => {
                                          setReportMonth(m);
                                          setReportPeriod(`${m} ${reportYear}`);
                                        }}
                                      >
                                        {m}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase tracking-widest">Año</Label>
                                  <div className="grid grid-cols-1 gap-1 max-h-[160px] overflow-y-auto pr-1">
                                    {YEARS.map(y => (
                                      <Button 
                                        key={`rep-y-${y}`} 
                                        variant={reportYear === y.toString() ? "default" : "ghost"}
                                        size="sm"
                                        className="h-8 text-xs font-bold"
                                        onClick={() => {
                                          setReportYear(y.toString());
                                          setReportPeriod(`${reportMonth} ${y}`);
                                        }}
                                      >
                                        {y}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {type !== "Proyecto" && type !== "" && (
                  <>
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
                          <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                            <CalendarIcon className="w-3.5 h-3.5" /> Fecha de Firma
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-12 justify-start text-left font-bold rounded-xl border-primary/20 bg-white",
                                  !date && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(new Date(date), "PPP", { locale: es }) : <span>Seleccione fecha de firma</span>}
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

                    {isSpecialType && (
                      <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-primary/5 rounded-2xl border-2 border-primary/10">
                        <div className="space-y-3 col-span-2">
                          <Label htmlFor="title" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título de la Resolución / Registro</Label>
                          <Input 
                            id="title" 
                            placeholder={getPlaceholder()}
                            className="h-12 rounded-xl border-muted-foreground/20 bg-white font-bold" 
                            required 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="firstName" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> Nombre
                          </Label>
                          <Input 
                            id="firstName" 
                            placeholder="Ej: Juan" 
                            className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                            required={isSpecialType}
                            value={beneficiaryFirstName}
                            onChange={(e) => setBeneficiaryFirstName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="lastName" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> Apellido
                          </Label>
                          <Input 
                            id="lastName" 
                            placeholder="Ej: Pérez" 
                            className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                            required={isSpecialType}
                            value={beneficiaryLastName}
                            onChange={(e) => setBeneficiaryLastName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="program" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5" /> Siglas del Programa
                          </Label>
                          <Input 
                            id="program" 
                            placeholder="Ej: ARFITEC, JIMA, MAGMA..." 
                            className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                            required={isSpecialType}
                            value={programName}
                            onChange={(e) => setProgramName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label htmlFor="convocatoria" className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                            <ClipboardList className="w-3.5 h-3.5" /> Semestre / Convocatoria
                          </Label>
                          <Input 
                            id="convocatoria" 
                            placeholder="Ej: 1er Semestre 2024" 
                            className="h-12 rounded-xl border-primary/20 bg-white font-bold" 
                            required={isSpecialType}
                            value={convocatoria}
                            onChange={(e) => setConvocatoria(e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 h-px bg-primary/10 my-2" />
                        <div className="space-y-3 col-span-2">
                          <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5" /> Destino de la Movilidad
                          </Label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <p className="text-[9px] font-black uppercase tracking-tight text-muted-foreground">Institución Receptora</p>
                              <Input 
                                placeholder="Ej: Univ. de Zaragoza"
                                className="h-10 rounded-xl border-primary/10 bg-white font-bold"
                                value={destinationInstitution}
                                onChange={(e) => setDestinationInstitution(e.target.value)}
                                required={isSpecialType}
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-[9px] font-black uppercase tracking-tight text-muted-foreground">Provincia / Estado</p>
                              <Input 
                                placeholder="Ej: Aragón"
                                className="h-10 rounded-xl border-primary/10 bg-white font-bold"
                                value={destinationProvince}
                                onChange={(e) => setDestinationProvince(e.target.value)}
                                required={isSpecialType}
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-[9px] font-black uppercase tracking-tight text-muted-foreground">País</p>
                              <Input 
                                placeholder="Ej: España"
                                className="h-10 rounded-xl border-primary/10 bg-white font-bold"
                                value={destinationCountry}
                                onChange={(e) => setDestinationCountry(e.target.value)}
                                required={isSpecialType}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(type === "Resolución" || type === "Reglamento") && (
                      <>
                        <div className="space-y-3 col-span-2">
                          <Label htmlFor="title" className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título Oficial</Label>
                          <Input 
                            id="title" 
                            placeholder="Ingrese título..."
                            className="h-12 rounded-xl border-muted-foreground/20 bg-muted/20 font-bold" 
                            required 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                            <CalendarIcon className="w-3.5 h-3.5" /> Fecha de Registro
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full h-12 justify-start text-left font-bold rounded-xl border-muted-foreground/20 bg-muted/20",
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
                  </>
                )}
              </div>
            </section>

            <section className={`transition-all duration-300 ${(title || linkedProjectFound) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/20 text-primary p-2 rounded-none">
                  <Badge className="bg-transparent border-none p-0 text-lg font-bold text-primary">3</Badge>
                </div>
                <h2 className="text-xl font-headline font-bold uppercase tracking-tight">
                  Documentación y Análisis
                </h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                  <Tabs defaultValue="file" value={uploadMethod} onValueChange={setUploadMethod} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-14 rounded-2xl bg-muted/50 p-1 mb-6">
                      <TabsTrigger value="file" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                        <FileUp className="w-4 h-4" /> Archivo (PDF Institucional)
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
                              <p className="text-muted-foreground text-xs font-bold mb-6 uppercase tracking-widest">PDF de la Resolución / Proyecto (Máx 20MB)</p>
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

                {!isResolution && (
                  <div className="space-y-4 animate-in fade-in duration-300">
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
                )}
              </div>

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
