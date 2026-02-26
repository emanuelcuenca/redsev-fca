
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  X, 
  Plus, 
  Save, 
  ArrowLeft,
  Loader2,
  ScrollText,
  Handshake,
  ArrowLeftRight,
  Target,
  FileUp,
  Search,
  FileCheck,
  User,
  Users,
  Fingerprint,
  Plane,
  GraduationCap,
  MapPin,
  Calendar,
  ListTodo,
  Clock,
  SearchCode,
  Link as LinkIcon,
  Globe
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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useUser, useFirestore, addDocumentNonBlocking, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { PersonName, StaffMember, AgriculturalDocument } from "@/lib/mock-data";
import { StaffAutocomplete } from "@/components/forms/staff-autocomplete";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const YEARS_LIST = Array.from({ length: 41 }, (_, i) => new Date().getFullYear() - 30 + i);

export default function UploadPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState("");
  const [extensionDocType, setExtensionDocType] = useState<string>("");
  const [title, setTitle] = useState("");
  
  const [director, setDirector] = useState<PersonName>({ firstName: "", lastName: "" });
  const [student, setStudent] = useState<PersonName>({ firstName: "", lastName: "" });
  const [technicalTeam, setTechnicalTeam] = useState<PersonName[]>([
    { firstName: "", lastName: "" }
  ]);

  const [description, setDescription] = useState("");
  const [resolutionNumber, setResolutionNumber] = useState("");
  const [objetivoGeneral, setObjetivoGeneral] = useState("");
  const [hasSpecificObjectives, setHasSpecificObjectives] = useState(false);
  const [objetivosEspecificos, setObjetivosEspecificos] = useState<string[]>(["", "", ""]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [fileSourceMode, setFileMode] = useState<"upload" | "link">("upload");

  const [durationYears, setDurationYears] = useState("1");
  const [hasAutomaticRenewal, setHasAutomaticRenewal] = useState(false);
  const [counterparts, setCounterparts] = useState([""]);
  const [projectCode, setProjectCode] = useState("");
  
  const [signingDay, setSigningDay] = useState("");
  const [signingMonth, setSigningMonth] = useState("");
  const [signingYearSelect, setSigningYearSelect] = useState("");

  const [execStartDay, setExecStartDay] = useState("");
  const [execStartMonth, setExecStartMonth] = useState("");
  const [execStartYear, setExecStartYear] = useState("");
  const [execEndDay, setExecEndDay] = useState("");
  const [execEndMonth, setExecEndMonth] = useState("");
  const [execEndYear, setExecEndYear] = useState("");

  const [mobilityStartDay, setMobilityStartDay] = useState(new Date().getDate().toString());
  const [mobilityStartMonth, setMobilityStartMonth] = useState(MONTHS[new Date().getMonth()]);
  const [mobilityStartYear, setMobilityStartYear] = useState(new Date().getFullYear().toString());
  const [mobilityEndDay, setMobilityEndDay] = useState(new Date().getDate().toString());
  const [mobilityEndMonth, setMobilityEndMonth] = useState(MONTHS[new Date().getMonth()]);
  const [mobilityEndYear, setMobilityEndYear] = useState(new Date().getFullYear().toString());
  const [mobilityInstitution, setMobilityInstitution] = useState("");
  const [mobilityState, setMobilityState] = useState("");
  const [mobilityCountry, setMobilityCountry] = useState("");

  const [searchProjectNumber, setSearchProjectNumber] = useState("");
  const [searchProjectYear, setSearchProjectYear] = useState(new Date().getFullYear().toString());
  const [isSearchingProject, setIsSearchingProject] = useState(false);
  const [linkedProject, setLinkedProject] = useState<AgriculturalDocument | null>(null);

  const staffQuery = useMemoFirebase(() => query(collection(db, 'staff')), [db]);
  const { data: staffList } = useCollection<StaffMember>(staffQuery);

  const formatText = (text: string) => {
    if (!text) return "";
    return text
      .split(' ')
      .filter(Boolean)
      .map(word => {
        const upper = word.toUpperCase();
        if (upper === "UNCA" || upper === "FCA" || upper === "INTA" || upper === "CONICET") return upper;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  const upsertStaff = (person: PersonName) => {
    if (!person.firstName || !person.lastName) return;
    const exists = staffList?.some(s => 
      s.firstName.toLowerCase() === person.firstName.toLowerCase() && 
      s.lastName.toLowerCase() === person.lastName.toLowerCase()
    );
    if (!exists) {
      addDocumentNonBlocking(collection(db, 'staff'), {
        firstName: formatText(person.firstName),
        lastName: formatText(person.lastName),
        claustro: "Docente",
        department: "Cs. Agrarias",
        updatedAt: new Date().toISOString()
      });
    }
  };

  const findProjectByCode = async () => {
    if (!searchProjectNumber || !searchProjectYear) {
      toast({ variant: "destructive", title: "Ingrese número y año" });
      return;
    }
    
    setIsSearchingProject(true);
    const paddedNumber = searchProjectNumber.padStart(3, '0');
    const targetCode = `FCA-EXT-${paddedNumber}-${searchProjectYear}`;
    
    try {
      const q = query(
        collection(db, 'documents'), 
        where('projectCode', '==', targetCode),
        where('extensionDocType', '==', 'Proyecto de Extensión'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const proj = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as AgriculturalDocument;
        setLinkedProject(proj);
        setTitle(proj.title);
        setDirector(proj.director || { firstName: "", lastName: "" });
        setProjectCode(proj.projectCode || "");
        
        if (proj.authors) setTechnicalTeam(proj.authors.length > 0 ? proj.authors : [{ firstName: "", lastName: "" }]);
        if (proj.description) setDescription(proj.description);
        if (proj.objetivoGeneral) setObjetivoGeneral(proj.objetivoGeneral);
        if (proj.objetivosEspecificos) {
          setObjetivosEspecificos(proj.objetivosEspecificos);
          setHasSpecificObjectives(proj.objetivosEspecificos.length > 0);
        }

        toast({ title: "Proyecto vinculado correctamente" });
      } else {
        setLinkedProject(null);
        toast({ 
          variant: "destructive", 
          title: "Proyecto no encontrado", 
          description: `No existe un proyecto con código ${targetCode}` 
        });
      }
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error en la búsqueda" });
    } finally {
      setIsSearchingProject(false);
    }
  };

  const generateProjectCode = async () => {
    const year = new Date().getFullYear();
    const q = query(
      collection(db, 'documents'), 
      where('type', '==', 'Proyecto'),
      where('extensionDocType', '==', 'Proyecto de Extensión')
    );
    const snapshot = await getDocs(q);
    const nextNumber = snapshot.docs.length + 1;
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    return `FCA-EXT-${paddedNumber}-${year}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setFileDataUri(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleTechnicalTeamChange = (index: number, field: keyof PersonName, value: string) => {
    const newTeam = [...technicalTeam];
    newTeam[index] = { ...newTeam[index], [field]: formatText(value) };
    setTechnicalTeam(newTeam);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !type) return;
    if (type === "Proyecto" && !extensionDocType) {
      toast({ variant: "destructive", title: "Seleccione tipo de extensión" });
      return;
    }
    
    const isLinkingRequired = extensionDocType === "Resolución de aprobación" || extensionDocType === "Informe de avance" || extensionDocType === "Informe final";
    if (type === "Proyecto" && isLinkingRequired && !linkedProject) {
      toast({ variant: "destructive", title: "Debe vincular un proyecto primero" });
      return;
    }

    // Validaciones obligatorias para Resolución de Aprobación
    if (type === "Proyecto" && extensionDocType === "Resolución de aprobación") {
      if (!resolutionNumber.trim()) {
        toast({ variant: "destructive", title: "Número de Resolución obligatorio" });
        return;
      }
      if (!signingDay || !signingMonth || !signingYearSelect) {
        toast({ variant: "destructive", title: "Fecha de Resolución obligatoria" });
        return;
      }
    }

    setIsSaving(true);
    
    let finalDate = new Date().toISOString();
    if (signingDay && signingMonth && signingYearSelect) {
      const monthIdx = MONTHS.indexOf(signingMonth) + 1;
      finalDate = `${signingYearSelect}-${monthIdx.toString().padStart(2, '0')}-${signingDay.padStart(2, '0')}`;
    }

    let finalProjectCode = projectCode;
    if (type === "Proyecto" && extensionDocType === "Proyecto de Extensión") {
      finalProjectCode = await generateProjectCode();
    }

    const filteredTeam = technicalTeam.filter(member => member.firstName.trim() !== "" || member.lastName.trim() !== "");

    if (director.lastName) upsertStaff(director);
    filteredTeam.forEach(upsertStaff);

    const documentData: any = {
      title: formatText(title),
      type,
      date: finalDate,
      uploadDate: new Date().toISOString(),
      uploadedByUserId: user.uid,
      description: description || "",
      resolutionNumber: resolutionNumber || "",
      fileUrl: fileSourceMode === "upload" ? (fileDataUri || "#") : externalUrl,
      fileType: fileSourceMode === "upload" && fileName ? fileName.split('.').pop() : "link",
      projectCode: finalProjectCode || ""
    };

    if (type === "Convenio") {
      documentData.durationYears = parseInt(durationYears) || 1;
      documentData.hasAutomaticRenewal = !!hasAutomaticRenewal;
      documentData.counterparts = counterparts.filter(c => c.trim() !== "");
      documentData.authors = filteredTeam;
    } else if (type === "Proyecto") {
      documentData.extensionDocType = extensionDocType;
      documentData.director = { 
        firstName: formatText(director.firstName || ""), 
        lastName: formatText(director.lastName || "") 
      };
      
      if (extensionDocType === "Proyecto de Extensión") {
        documentData.authors = filteredTeam;
        documentData.objetivoGeneral = objetivoGeneral || "";
        documentData.objetivosEspecificos = hasSpecificObjectives ? objetivosEspecificos.filter(o => o.trim() !== "") : [];
        
        if (execStartDay && execStartMonth && execStartYear) {
          const startMonthIdx = MONTHS.indexOf(execStartMonth) + 1;
          documentData.executionStartDate = `${execStartYear}-${startMonthIdx.toString().padStart(2, '0')}-${execStartDay.padStart(2, '0')}`;
        }
        if (execEndDay && execEndMonth && execEndYear) {
          const endMonthIdx = MONTHS.indexOf(execEndMonth) + 1;
          documentData.executionEndDate = `${execEndYear}-${endMonthIdx.toString().padStart(2, '0')}-${execEndDay.padStart(2, '0')}`;
        }
      } else {
        documentData.authors = filteredTeam;
        if (extensionDocType === "Informe de avance") {
          if (execStartDay && execStartMonth && execStartYear) {
            const startMonthIdx = MONTHS.indexOf(execStartMonth) + 1;
            documentData.executionStartDate = `${execStartYear}-${startMonthIdx.toString().padStart(2, '0')}-${execStartDay.padStart(2, '0')}`;
          }
          if (execEndDay && execEndMonth && execEndYear) {
            const endMonthIdx = MONTHS.indexOf(execEndMonth) + 1;
            documentData.executionEndDate = `${execEndYear}-${endMonthIdx.toString().padStart(2, '0')}-${execEndDay.padStart(2, '0')}`;
          }
        }
      }
    } else if (type === "Movilidad Estudiantil" || type === "Movilidad Docente" || type === "Pasantía") {
      const startMonthIdx = MONTHS.indexOf(mobilityStartMonth) + 1;
      const endMonthIdx = MONTHS.indexOf(mobilityEndMonth) + 1;
      documentData.mobilityStartDate = `${mobilityStartYear}-${startMonthIdx.toString().padStart(2, '0')}-${mobilityStartDay.padStart(2, '0')}`;
      documentData.mobilityEndDate = `${mobilityEndYear}-${endMonthIdx.toString().padStart(2, '0')}-${mobilityEndDay.padStart(2, '0')}`;
      documentData.mobilityInstitution = formatText(mobilityInstitution || "");
      documentData.mobilityState = formatText(mobilityState || "");
      documentData.mobilityCountry = formatText(mobilityCountry || "");
      documentData.authors = filteredTeam;
      if (type === "Movilidad Estudiantil" || type === "Pasantía") {
        documentData.student = { 
          firstName: formatText(student.firstName || ""), 
          lastName: formatText(student.lastName || "") 
        };
      }
    }

    addDocumentNonBlocking(collection(db, 'documents'), documentData);
    toast({ title: "Registro almacenado" });
    router.push("/documents");
  };

  const isLinkingType = extensionDocType === "Resolución de aprobación" || extensionDocType === "Informe de avance" || extensionDocType === "Informe final";
  
  const shouldShowFileSection = type && (
    (type !== "Proyecto") || 
    (extensionDocType === "Proyecto de Extensión") || 
    (isLinkingType && linkedProject)
  );

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0"><SidebarTrigger /></div>
          <div className="flex-1 text-center"><span className="font-headline font-bold text-primary uppercase">Cargar Registro SEyV</span></div>
          <div className="flex items-center gap-3 shrink-0"><UserMenu /></div>
        </header>

        <main className="p-4 md:p-8 max-w-4xl mx-auto w-full pb-32">
          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 space-y-6">
              <h2 className="text-lg font-headline font-bold uppercase tracking-tight">Categoría Institucional</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { id: "Proyecto", label: "Extensión", icon: ArrowLeftRight },
                  { id: "Convenio", label: "Convenio", icon: Handshake },
                  { id: "Movilidad Estudiantil", label: "Mov. Estudiantil", icon: Plane },
                  { id: "Movilidad Docente", label: "Mov. Docente", icon: Plane },
                  { id: "Pasantía", label: "Práctica/Pasantía", icon: GraduationCap },
                  { id: "Resolución", label: "Resolución", icon: ScrollText }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setType(item.id);
                      setExtensionDocType("");
                      setTitle("");
                      setLinkedProject(null);
                      const defaultCount = (item.id === "Proyecto") ? 3 : 1;
                      setTechnicalTeam(Array(defaultCount).fill({ firstName: "", lastName: "" }));
                      setDirector({ firstName: "", lastName: "" });
                      setStudent({ firstName: "", lastName: "" });
                      setDescription("");
                      setResolutionNumber("");
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-2 ${
                      type === item.id ? 'border-primary bg-primary/10 text-primary shadow-md' : 'border-muted-foreground/10 bg-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-widest text-[8px] text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {type === "Proyecto" && (
              <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-muted animate-in fade-in space-y-8">
                <div className="space-y-4">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Tipo de Extensión</Label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {["Proyecto de Extensión", "Resolución de aprobación", "Informe de avance", "Informe final"].map((sub) => (
                      <Button 
                        key={sub} 
                        type="button" 
                        variant={extensionDocType === sub ? "default" : "outline"} 
                        className="text-[9px] h-10 uppercase font-black" 
                        onClick={() => {
                          setExtensionDocType(sub);
                          setLinkedProject(null);
                          setSigningDay("");
                          setSigningMonth("");
                          setSigningYearSelect("");
                        }}
                      >
                        {sub}
                      </Button>
                    ))}
                  </div>
                </div>

                {isLinkingType && !linkedProject && (
                  <div className="p-8 bg-muted/20 border-2 border-dashed border-primary/20 rounded-[2rem] space-y-6 animate-in zoom-in-95">
                    <div className="text-center space-y-2">
                      <SearchCode className="w-12 h-12 text-primary/40 mx-auto" />
                      <h3 className="font-headline font-bold text-primary uppercase">Vincular Proyecto de Extensión</h3>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Ingrese el código institucional para continuar</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 max-w-lg mx-auto">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-[9px] font-black uppercase ml-1">Número (***)</Label>
                        <input 
                          placeholder="001" 
                          className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm text-center font-bold" 
                          value={searchProjectNumber}
                          onChange={(e) => setSearchProjectNumber(e.target.value)}
                        />
                      </div>
                      <div className="w-full md:w-32 space-y-1.5">
                        <Label className="text-[9px] font-black uppercase ml-1">Año</Label>
                        <Select value={searchProjectYear} onValueChange={setSearchProjectYear}>
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          onClick={findProjectByCode} 
                          disabled={isSearchingProject}
                          className="h-12 w-full md:w-auto px-6 rounded-xl bg-primary shadow-lg shadow-primary/20"
                        >
                          {isSearchingProject ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {isLinkingType && linkedProject && (
                  <div className="space-y-6 animate-in slide-in-from-top-4">
                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-2xl"><LinkIcon className="w-6 h-6 text-primary" /></div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-primary tracking-widest">Proyecto Vinculado</p>
                          <h4 className="font-headline font-bold text-lg">{linkedProject.projectCode}</h4>
                        </div>
                      </div>
                      <Button variant="ghost" className="text-destructive font-bold text-[10px] uppercase h-9" onClick={() => setLinkedProject(null)}>Cambiar</Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título</Label>
                        <input value={title} readOnly className="flex h-12 w-full rounded-xl border border-input bg-muted/50 px-3 py-2 text-sm font-bold" />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Director</Label>
                        <input value={`${director.lastName}, ${director.firstName}`} readOnly className="flex h-12 w-full rounded-xl border border-input bg-muted/50 px-3 py-2 text-sm font-bold" />
                      </div>
                    </div>
                  </div>
                )}

                {extensionDocType === "Proyecto de Extensión" && (
                  <div className="space-y-8 animate-in slide-in-from-top-4">
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título</Label>
                      <input placeholder="Título del proyecto" className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2"><User className="w-4 h-4" /> Director del Proyecto</Label>
                        <StaffAutocomplete onSelect={(s) => setDirector({ firstName: s.firstName, lastName: s.lastName })} label="Director" />
                        <div className="grid grid-cols-2 gap-2">
                          <input placeholder="Apellido" value={director.lastName} onChange={(e) => setDirector({...director, lastName: e.target.value})} className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-bold" />
                          <input placeholder="Nombre" value={director.firstName} onChange={(e) => setDirector({...director, firstName: e.target.value})} className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-bold" />
                        </div>
                      </div>

                      <div className="space-y-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2">
                          <Clock className="w-4 h-4" /> Período de Ejecución
                        </Label>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground">Desde</Label>
                            <div className="grid grid-cols-3 gap-1">
                              <Select value={execStartDay} onValueChange={setExecStartDay}><SelectTrigger className="h-10"><SelectValue placeholder="Día" /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                              <Select value={execStartMonth} onValueChange={setExecStartMonth}><SelectTrigger className="h-10"><SelectValue placeholder="Mes" /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                              <Select value={execStartYear} onValueChange={setExecStartYear}><SelectTrigger className="h-10"><SelectValue placeholder="Año" /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground">Hasta</Label>
                            <div className="grid grid-cols-3 gap-1">
                              <Select value={execEndDay} onValueChange={setExecEndDay}><SelectTrigger className="h-10"><SelectValue placeholder="Día" /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                              <Select value={execEndMonth} onValueChange={setExecEndMonth}><SelectTrigger className="h-10"><SelectValue placeholder="Mes" /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                              <Select value={execEndYear} onValueChange={setExecEndYear}><SelectTrigger className="h-10"><SelectValue placeholder="Año" /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                      <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Equipo Técnico
                      </Label>
                      <div className="space-y-4">
                        {technicalTeam.map((member, i) => (
                          <div key={i} className="bg-muted/10 p-4 rounded-2xl border border-muted space-y-3 relative">
                            {technicalTeam.length > 3 && (
                              <button type="button" className="absolute top-2 right-2 h-8 w-8 text-destructive" onClick={() => setTechnicalTeam(technicalTeam.filter((_, idx) => idx !== i))}><X className="w-4 h-4" /></button>
                            )}
                            <StaffAutocomplete 
                              onSelect={(s) => {
                                  const newTeam = [...technicalTeam];
                                  newTeam[i] = { firstName: s.firstName, lastName: s.lastName };
                                  setTechnicalTeam(newTeam);
                              }} 
                              label={`Integrante ${i + 1}`} 
                              placeholder="Buscar por apellido..."
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input placeholder="Apellido" className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-bold" value={member.lastName} onChange={(e) => handleTechnicalTeamChange(i, 'lastName', e.target.value)} />
                              <input placeholder="Nombre" className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-bold" value={member.firstName} onChange={(e) => handleTechnicalTeamChange(i, 'firstName', e.target.value)} />
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="outline" className="w-full h-11 border-dashed rounded-xl font-black text-[9px] uppercase" onClick={() => setTechnicalTeam([...technicalTeam, { firstName: "", lastName: "" }])}><Plus className="w-4 h-4 mr-2" /> Añadir integrante</Button>
                      </div>
                    </div>

                    <div className="space-y-6 border-t pt-6">
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2"><Target className="w-4 h-4" /> Objetivo General</Label>
                        <Textarea 
                          placeholder="Describa el objetivo general del proyecto..." 
                          className="min-h-[100px] rounded-xl font-medium" 
                          value={objetivoGeneral}
                          onChange={(e) => setObjetivoGeneral(e.target.value)}
                        />
                      </div>

                      <div className="space-y-6 bg-primary/[0.02] p-6 rounded-3xl border border-dashed border-primary/20">
                        <div className="flex items-center justify-between">
                          <span className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2">
                            <ListTodo className="w-4 h-4" /> Objetivos Específicos
                          </span>
                          <Switch 
                            checked={hasSpecificObjectives} 
                            onCheckedChange={setHasSpecificObjectives}
                          />
                        </div>
                        
                        {hasSpecificObjectives && (
                          <div className="space-y-4 animate-in slide-in-from-top-2">
                            {objetivosEspecificos.map((obj, i) => (
                              <div key={i} className="flex gap-2">
                                <input 
                                  placeholder={`Objetivo específico ${i + 1}`} 
                                  value={obj} 
                                  onChange={(e) => {
                                    const newObjs = [...objetivosEspecificos];
                                    newObjs[i] = e.target.value;
                                    setObjetivosEspecificos(newObjs);
                                  }}
                                  className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-medium" 
                                />
                                {objetivosEspecificos.length > 3 && (
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    className="h-12 w-12 rounded-xl text-destructive"
                                    onClick={() => setObjetivosEspecificos(objetivosEspecificos.filter((_, idx) => idx !== i))}
                                  >
                                    <X className="w-5 h-5" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="w-full h-10 border-dashed rounded-xl font-black text-[9px] uppercase"
                              onClick={() => setObjetivosEspecificos([...objetivosEspecificos, ""])}
                            >
                              <Plus className="w-4 h-4 mr-2" /> Añadir objetivo
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {type && type !== "Proyecto" && type !== "Resolución" && (
              <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-muted animate-in fade-in space-y-8">
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título</Label>
                  <input placeholder="Título del registro" className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                {type === "Movilidad Docente" && (
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                      <User className="w-4 h-4" /> Beneficiario
                    </Label>
                    <div className="bg-muted/10 p-4 rounded-2xl border border-muted space-y-3 relative">
                      <StaffAutocomplete 
                        onSelect={(s) => {
                          const newTeam = [{ firstName: s.firstName, lastName: s.lastName }];
                          setTechnicalTeam(newTeam);
                        }} 
                        label="Beneficiario" 
                        placeholder="Buscar por apellido..."
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input placeholder="Apellido" className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-bold" value={technicalTeam[0]?.lastName || ""} onChange={(e) => handleTechnicalTeamChange(0, 'lastName', e.target.value)} />
                        <input placeholder="Nombre" className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-bold" value={technicalTeam[0]?.firstName || ""} onChange={(e) => handleTechnicalTeamChange(0, 'firstName', e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}

                {(type === "Movilidad Estudiantil" || type === "Movilidad Docente" || type === "Pasantía") && (
                  <div className="space-y-8">
                    {(type === "Movilidad Estudiantil" || type === "Pasantía") && (
                      <div className="space-y-4 p-4 bg-primary/5 rounded-2xl">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary">Datos del Estudiante</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <input placeholder="Apellido" value={student.lastName} onChange={(e) => setStudent({...student, lastName: e.target.value})} className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" />
                          <input placeholder="Nombre" value={student.firstName} onChange={(e) => setStudent({...student, firstName: e.target.value})} className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" />
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary">Período Desde</Label>
                        <div className="grid grid-cols-3 gap-1">
                          <Select value={mobilityStartDay} onValueChange={setMobilityStartDay}><SelectTrigger className="h-10"><SelectValue /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                          <Select value={mobilityStartMonth} onValueChange={setMobilityStartMonth}><SelectTrigger className="h-10"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                          <Select value={mobilityStartYear} onValueChange={setMobilityStartYear}><SelectTrigger className="h-10"><SelectValue /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary">Período Hasta</Label>
                        <div className="grid grid-cols-3 gap-1">
                          <Select value={mobilityEndDay} onValueChange={setMobilityEndDay}><SelectTrigger className="h-10"><SelectValue /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                          <Select value={mobilityEndMonth} onValueChange={setMobilityEndMonth}><SelectTrigger className="h-10"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                          <Select value={mobilityEndYear} onValueChange={setMobilityEndYear}><SelectTrigger className="h-10"><SelectValue /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input placeholder={type === 'Pasantía' ? 'Institución/Empresa' : 'Institución/Universidad'} value={mobilityInstitution} onChange={(e) => setMobilityInstitution(e.target.value)} className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" />
                      <input placeholder="Estado/Provincia" value={mobilityState} onChange={(e) => setMobilityState(e.target.value)} className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" />
                      <input placeholder="País" value={mobilityCountry} onChange={(e) => setMobilityCountry(e.target.value)} className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" />
                    </div>
                  </div>
                )}

                {type === "Convenio" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Fecha de Firma</Label>
                      <div className="grid grid-cols-3 gap-1">
                        <Select value={signingDay} onValueChange={setSigningDay}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue placeholder="Día" /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                        <Select value={signingMonth} onValueChange={setSigningMonth}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue placeholder="Mes" /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                        <Select value={signingYearSelect} onValueChange={setSigningYearSelect}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue placeholder="Año" /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                      </div>
                    </div>
                    <div className="space-y-2"><Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Duración (Años)</Label><input type="number" min="1" className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" value={durationYears} onChange={(e) => setDurationYears(e.target.value)} /></div>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                    <Users className="w-4 h-4" /> 
                    {type === 'Movilidad Docente' ? 'Beneficiario' : 'Responsables Institucionales'}
                  </Label>
                  <div className="space-y-4">
                    {technicalTeam.map((member, i) => (
                      <div key={i} className="bg-muted/10 p-4 rounded-2xl border border-muted space-y-3 relative">
                        {technicalTeam.length > 1 && (
                          <button type="button" className="absolute top-2 right-2 h-8 w-8 text-destructive" onClick={() => setTechnicalTeam(technicalTeam.filter((_, idx) => idx !== i))}>
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <StaffAutocomplete 
                          onSelect={(s) => {
                              const newTeam = [...technicalTeam];
                              newTeam[i] = { firstName: s.firstName, lastName: s.lastName };
                              setTechnicalTeam(newTeam);
                          }} 
                          label={type === 'Movilidad Docente' ? "Beneficiario" : `Responsable ${i + 1}`} 
                          placeholder="Buscar por apellido..."
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input placeholder="Apellido" className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-bold" value={member.lastName} onChange={(e) => handleTechnicalTeamChange(i, 'lastName', e.target.value)} />
                          <input placeholder="Nombre" className="flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-bold" value={member.firstName} onChange={(e) => handleTechnicalTeamChange(i, 'firstName', e.target.value)} />
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" className="w-full h-11 border-dashed rounded-xl font-black text-[9px] uppercase" onClick={() => setTechnicalTeam([...technicalTeam, { firstName: "", lastName: "" }])}>
                      <Plus className="w-4 h-4 mr-2" /> Añadir responsable
                    </Button>
                  </div>
                </div>

                {type !== "Convenio" && type !== "Movilidad Estudiantil" && type !== "Movilidad Docente" && type !== "Pasantía" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Resolución / Código</Label>
                      <input placeholder="Número de resolución" value={projectCode} onChange={(e) => setProjectCode(e.target.value)} className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" />
                    </div>
                  </div>
                )}
              </section>
            )}

            {type === "Resolución" && (
              <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-muted animate-in fade-in space-y-8">
                <div className="space-y-2"><Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título</Label><input placeholder="Título de la resolución" className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                <div className="space-y-2"><Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Fecha de Aprobación</Label>
                  <div className="grid grid-cols-3 gap-1 max-w-sm">
                    <Select value={signingDay} onValueChange={setSigningDay}>
                      <SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue placeholder="Día" /></SelectTrigger>
                      <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={signingMonth} onValueChange={setSigningMonth}>
                      <SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue placeholder="Mes" /></SelectTrigger>
                      <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select value={signingYearSelect} onValueChange={setSigningYearSelect}>
                      <SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue placeholder="Año" /></SelectTrigger>
                      <SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </section>
            )}

            {shouldShowFileSection && (
              <section className="bg-primary/5 p-8 rounded-[2.5rem] border border-dashed border-primary/20 space-y-6">
                <Tabs defaultValue="upload" value={fileSourceMode} onValueChange={(v: any) => setFileMode(v)} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 h-12 rounded-xl bg-white border border-primary/10">
                    <TabsTrigger value="upload" className="font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white h-full rounded-lg transition-all">
                      <FileUp className="w-4 h-4 mr-2" /> Subir Archivo
                    </TabsTrigger>
                    <TabsTrigger value="link" className="font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white h-full rounded-lg transition-all">
                      <Globe className="w-4 h-4 mr-2" /> Enlace Externo
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <Button type="button" onClick={() => fileInputRef.current?.click()} className="h-14 px-10 rounded-xl bg-white border-2 border-primary/30 text-primary font-black uppercase text-[11px] tracking-widest hover:bg-primary/5 transition-all shadow-sm">
                        {fileName ? "Cambiar Archivo" : <span className="flex items-center gap-2"><FileUp className="w-5 h-5" /> Seleccionar Archivo</span>}
                      </Button>
                      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                      {fileName && (
                        <div className="flex-1 bg-white/50 p-4 rounded-xl border border-primary/10 flex items-center gap-3 animate-in fade-in">
                          <ScrollText className="w-5 h-5 text-primary/60" />
                          <span className="text-xs font-bold text-primary truncate max-w-[200px]">{fileName}</span>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="link" className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">URL del Documento (Drive, Dropbox, etc.)</Label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                        <input 
                          placeholder="https://drive.google.com/..." 
                          className="flex h-14 w-full rounded-xl border border-primary/20 bg-white pl-11 pr-3 py-2 text-sm font-bold" 
                          value={externalUrl} 
                          onChange={(e) => setExternalUrl(e.target.value)} 
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="pt-6 border-t border-primary/10">
                  {extensionDocType === "Resolución de aprobación" && (
                    <div className="space-y-4 mb-6 animate-in slide-in-from-top-2">
                      <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Fecha de la Resolución *
                      </Label>
                      <div className="grid grid-cols-3 gap-1 max-w-sm">
                        <Select value={signingDay} onValueChange={setSigningDay}>
                          <SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue placeholder="Día" /></SelectTrigger>
                          <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={signingMonth} onValueChange={setSigningMonth}>
                          <SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue placeholder="Mes" /></SelectTrigger>
                          <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={signingYearSelect} onValueChange={setSigningYearSelect}>
                          <SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue placeholder="Año" /></SelectTrigger>
                          <SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {extensionDocType === "Informe de avance" ? (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                      <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Período Informado
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-white border border-primary/10 rounded-2xl">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Desde</Label>
                          <div className="grid grid-cols-3 gap-1">
                            <Select value={execStartDay} onValueChange={setExecStartDay}>
                              <SelectTrigger className="h-10"><SelectValue placeholder="Día" /></SelectTrigger>
                              <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={execStartMonth} onValueChange={setExecStartMonth}>
                              <SelectTrigger className="h-10"><SelectValue placeholder="Mes" /></SelectTrigger>
                              <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={execStartYear} onValueChange={setExecStartYear}>
                              <SelectTrigger className="h-10"><SelectValue placeholder="Año" /></SelectTrigger>
                              <SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground">Hasta</Label>
                          <div className="grid grid-cols-3 gap-1">
                            <Select value={execEndDay} onValueChange={setExecEndDay}>
                              <SelectTrigger className="h-10"><SelectValue placeholder="Día" /></SelectTrigger>
                              <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={execEndMonth} onValueChange={setExecEndMonth}>
                              <SelectTrigger className="h-10"><SelectValue placeholder="Mes" /></SelectTrigger>
                              <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={execEndYear} onValueChange={setExecEndYear}>
                              <SelectTrigger className="h-10"><SelectValue placeholder="Año" /></SelectTrigger>
                              <SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">
                          {extensionDocType === "Resolución de aprobación" ? "Número de Resolución *" : "Descripción / Resumen"}
                        </Label>
                      </div>
                      {extensionDocType === "Resolución de aprobación" ? (
                        <Input 
                          placeholder="Ej: RES-FCA-001/2026" 
                          className="h-14 rounded-xl font-bold bg-white border-primary/20" 
                          value={resolutionNumber} 
                          onChange={(e) => setResolutionNumber(e.target.value)} 
                        />
                      ) : (
                        <Textarea placeholder="Resumen institucional..." className="min-h-[120px] rounded-xl font-medium bg-white" value={description} onChange={(e) => setDescription(e.target.value)} />
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex justify-end gap-4 mt-8">
                  <Button type="button" variant="ghost" className="h-12 font-black uppercase text-[10px]" onClick={() => router.push("/")}><ArrowLeft className="w-4 h-4 mr-2" /> Salir</Button>
                  <Button 
                    type="submit" 
                    className="h-14 px-12 rounded-xl font-black bg-primary text-white uppercase text-[11px] shadow-lg shadow-primary/20" 
                    disabled={isSaving || (type === "Proyecto" && isLinkingType && !linkedProject)}
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2"><Save className="w-5 h-5" /> Guardar Registro</span>}
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
