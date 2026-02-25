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
  Sparkles,
  Search,
  FileCheck,
  User,
  Users,
  Fingerprint,
  Plane,
  GraduationCap,
  MapPin,
  Calendar
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
import { collection, query, where, getDocs, limit, doc, getDoc, addDoc } from "firebase/firestore";
import { summarizeDocument } from "@/ai/flows/smart-document-summarization";
import { AgriculturalDocument, PersonName, formatPersonName, StaffMember } from "@/lib/mock-data";
import { StaffAutocomplete } from "@/components/forms/staff-autocomplete";

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
  const [technicalTeam, setTechnicalTeam] = useState<PersonName[]>([
    { firstName: "", lastName: "" },
    { firstName: "", lastName: "" },
    { firstName: "", lastName: "" }
  ]);

  const [description, setDescription] = useState("");
  const [objetivoGeneral, setObjetivoGeneral] = useState("");
  const [hasSpecificObjectives, setHasSpecificObjectives] = useState(false);
  const [objetivosEspecificos, setObjetivosEspecificos] = useState<string[]>(["", "", ""]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [durationYears, setDurationYears] = useState("1");
  const [hasAutomaticRenewal, setHasAutomaticRenewal] = useState(false);
  const [counterparts, setCounterparts] = useState([""]);
  const [hasInstitutionalResponsible, setHasInstitutionalResponsible] = useState(false);
  const [projectCode, setProjectCode] = useState("");
  const [executionPeriod, setExecutionPeriod] = useState("");
  
  const [signingDay, setSigningDay] = useState(new Date().getDate().toString());
  const [signingMonth, setSigningMonth] = useState(MONTHS[new Date().getMonth()]);
  const [signingYearSelect, setSigningYearSelect] = useState(new Date().getFullYear().toString());

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
  const [foundProject, setFoundProject] = useState<AgriculturalDocument | null>(null);

  const staffQuery = useMemoFirebase(() => query(collection(db, 'staff')), [db]);
  const { data: staffList } = useCollection<StaffMember>(staffQuery);

  const upsertStaff = async (person: PersonName) => {
    if (!person.firstName || !person.lastName) return;
    const exists = staffList?.some(s => 
      s.firstName.toLowerCase() === person.firstName.toLowerCase() && 
      s.lastName.toLowerCase() === person.lastName.toLowerCase()
    );
    if (!exists) {
      addDoc(collection(db, 'staff'), {
        firstName: formatText(person.firstName),
        lastName: formatText(person.lastName),
        category: "Docente", 
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...objetivosEspecificos];
    newObjectives[index] = value;
    setObjetivosEspecificos(newObjectives);
  };

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

  const generateProjectCode = async () => {
    const year = new Date().getFullYear();
    const q = query(
      collection(db, 'documents'), 
      where('type', '==', 'Proyecto'),
      where('extensionDocType', '==', 'Proyecto de Extensión')
    );
    const snapshot = await getDocs(q);
    const yearSuffix = `-${year}`;
    const yearDocs = snapshot.docs.filter(d => d.data().projectCode?.endsWith(yearSuffix));
    const nextNumber = yearDocs.length + 1;
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    return `FCA-EXT-${paddedNumber}-${year}`;
  };

  const handleSearchProject = async () => {
    if (!searchProjectNumber) return;
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
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const project = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as AgriculturalDocument;
        setFoundProject(project);
        setTitle(project.title);
        setDescription(project.description || "");
        setObjetivoGeneral(project.objetivoGeneral || "");
        setObjetivosEspecificos(project.objetivosEspecificos || []);
        setDirector(project.director || { firstName: "", lastName: "" });
        setTechnicalTeam(project.authors || []);
        setProjectCode(project.projectCode || "");
        setExecutionPeriod(project.executionPeriod || "");
        toast({ title: "Proyecto encontrado" });
      } else {
        setFoundProject(null);
        toast({ variant: "destructive", title: "Proyecto no encontrado" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error en la búsqueda" });
    } finally {
      setIsSearchingProject(false);
    }
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

  const handleSummarize = async () => {
    if (!fileDataUri) return toast({ variant: "destructive", title: "Archivo requerido" });
    setIsSummarizing(true);
    try {
      const result = await summarizeDocument({ documentMediaUri: fileDataUri, documentContent: title });
      if (result?.summary) {
        setDescription(result.summary);
        toast({ title: "Resumen generado" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error de IA", description: error.message });
    } finally {
      setIsSummarizing(false);
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

    setIsSaving(true);
    const monthIdx = MONTHS.indexOf(signingMonth) + 1;
    const finalDate = `${signingYearSelect}-${monthIdx.toString().padStart(2, '0')}-${signingDay.padStart(2, '0')}`;

    let finalProjectCode = projectCode;
    if (type === "Proyecto" && extensionDocType === "Proyecto de Extensión" && !projectCode) {
      finalProjectCode = await generateProjectCode();
    }

    const filteredTeam = technicalTeam.filter(member => member.firstName.trim() !== "" || member.lastName.trim() !== "");

    if (director.lastName) await upsertStaff(director);
    for (const member of filteredTeam) {
      await upsertStaff(member);
    }

    const documentData: any = {
      title: formatText(title),
      type,
      date: (type === "Proyecto" && extensionDocType) ? new Date().toISOString() : finalDate,
      uploadDate: new Date().toISOString(),
      uploadedByUserId: user.uid,
      description,
      fileUrl: fileDataUri || "#",
      fileType: fileName ? fileName.split('.').pop() : "application/pdf"
    };

    if (type === "Convenio") {
      documentData.durationYears = parseInt(durationYears);
      documentData.hasAutomaticRenewal = hasAutomaticRenewal;
      documentData.counterparts = counterparts.filter(c => c.trim() !== "");
      documentData.hasInstitutionalResponsible = hasInstitutionalResponsible;
      documentData.authors = hasInstitutionalResponsible ? filteredTeam : [];
    } else if (type === "Proyecto") {
      documentData.extensionDocType = extensionDocType;
      documentData.projectCode = finalProjectCode;
      documentData.executionPeriod = executionPeriod;
      documentData.director = { firstName: formatText(director.firstName), lastName: formatText(director.lastName) };
      documentData.authors = filteredTeam;
      if (extensionDocType === "Proyecto de Extensión" || foundProject) {
        documentData.objetivoGeneral = objetivoGeneral;
        documentData.objetivosEspecificos = objetivosEspecificos.filter(obj => obj.trim() !== "");
      }
    } else if (type === "Movilidad") {
      const startMonthIdx = MONTHS.indexOf(mobilityStartMonth) + 1;
      const endMonthIdx = MONTHS.indexOf(mobilityEndMonth) + 1;
      documentData.mobilityStartDate = `${mobilityStartYear}-${startMonthIdx.toString().padStart(2, '0')}-${mobilityStartDay.padStart(2, '0')}`;
      documentData.mobilityEndDate = `${mobilityEndYear}-${endMonthIdx.toString().padStart(2, '0')}-${mobilityEndDay.padStart(2, '0')}`;
      documentData.mobilityInstitution = formatText(mobilityInstitution);
      documentData.mobilityState = formatText(mobilityState);
      documentData.mobilityCountry = formatText(mobilityCountry);
      documentData.projectCode = projectCode; // Resolución
      documentData.authors = filteredTeam;
    } else {
      documentData.authors = filteredTeam;
      documentData.projectCode = projectCode;
      documentData.executionPeriod = executionPeriod;
    }

    try {
      await addDocumentNonBlocking(collection(db, 'documents'), documentData);
      toast({ title: "Registro almacenado", description: finalProjectCode ? `Código: ${finalProjectCode}` : "" });
      setIsSaving(false);
      router.push("/documents");
    } catch (error) {
      setIsSaving(false);
      toast({ variant: "destructive", title: "Error al guardar" });
    }
  };

  const isExtensionProyectoSubtype = type === "Proyecto" && extensionDocType === "Proyecto de Extensión";
  const isExtensionLinkedSubtype = type === "Proyecto" && ["Resolución de aprobación", "Informe de avance", "Informe final"].includes(extensionDocType);

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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { id: "Proyecto", label: "Extensión", icon: ArrowLeftRight },
                  { id: "Convenio", label: "Convenio", icon: Handshake },
                  { id: "Movilidad", label: "Movilidad", icon: Plane },
                  { id: "Pasantía", label: "Práctica", icon: GraduationCap },
                  { id: "Resolución", label: "Resolución", icon: ScrollText }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setType(item.id);
                      if (item.id !== "Proyecto") setExtensionDocType("");
                      setFoundProject(null);
                      setTitle("");
                      if (item.id === "Movilidad") {
                        setTechnicalTeam([{ firstName: "", lastName: "" }]);
                      } else {
                        setTechnicalTeam([{ firstName: "", lastName: "" }, { firstName: "", lastName: "" }, { firstName: "", lastName: "" }]);
                      }
                      setDirector({ firstName: "", lastName: "" });
                      setDescription("");
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                      type === item.id ? 'border-primary bg-primary/10 text-primary shadow-md' : 'border-muted-foreground/10 bg-white'
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="font-bold uppercase tracking-widest text-[9px]">{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {type === "Proyecto" && (
              <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-muted animate-in fade-in space-y-8">
                <div className="space-y-4">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Subtipo de Extensión</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    {["Proyecto de Extensión", "Resolución de aprobación", "Informe de avance", "Informe final"].map((subType) => (
                      <button
                        key={subType}
                        type="button"
                        onClick={() => {
                          setExtensionDocType(subType as any);
                          setFoundProject(null);
                        }}
                        className={`p-3 rounded-xl border-2 text-[9px] font-black uppercase tracking-tight transition-all text-center ${
                          extensionDocType === subType ? 'border-primary bg-primary/5 text-primary' : 'border-muted bg-white text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {subType}
                      </button>
                    ))}
                  </div>
                </div>

                {isExtensionLinkedSubtype && (
                  <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 space-y-6 animate-in slide-in-from-top-4">
                    <div className="flex items-center gap-3"><Search className="w-5 h-5 text-primary" /><h3 className="font-headline font-bold text-sm uppercase tracking-tight text-primary">Vincular Proyecto</h3></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2"><Label className="font-black uppercase text-[9px] tracking-widest text-muted-foreground">Número</Label><Input placeholder="Ej: 001" value={searchProjectNumber} onChange={(e) => setSearchProjectNumber(e.target.value)} className="h-10 rounded-lg font-bold" /></div>
                      <div className="space-y-2"><Label className="font-black uppercase text-[9px] tracking-widest text-muted-foreground">Año</Label><Select value={searchProjectYear} onValueChange={setSearchProjectYear}><SelectTrigger className="h-10 rounded-lg font-bold"><SelectValue /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select></div>
                      <div className="flex items-end"><Button type="button" onClick={handleSearchProject} disabled={isSearchingProject || !searchProjectNumber} className="w-full h-10 rounded-lg font-black uppercase text-[10px] tracking-widest bg-primary">{isSearchingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}</Button></div>
                    </div>
                  </div>
                )}

                {isExtensionProyectoSubtype && (
                  <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título del Proyecto</Label>
                      <Input placeholder="Título del Proyecto" className="h-12 rounded-xl font-bold" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-4 border-b pb-6">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2"><User className="w-4 h-4" /> Director del Proyecto</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <StaffAutocomplete 
                            label="Buscar Director" 
                            defaultValue={director.lastName ? `${director.lastName}, ${director.firstName}` : ""}
                            onSelect={(s) => setDirector({ firstName: s.firstName, lastName: s.lastName })}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="Apellido" className="h-12 rounded-xl font-bold" value={director.lastName} onChange={(e) => setDirector({ ...director, lastName: e.target.value })} />
                            <Input placeholder="Nombre" className="h-12 rounded-xl font-bold" value={director.firstName} onChange={(e) => setDirector({ ...director, firstName: e.target.value })} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2"><Users className="w-4 h-4" /> Equipo Técnico</Label>
                        <div className="space-y-4">
                          {technicalTeam.map((member, i) => (
                            <div key={i} className="space-y-2 p-4 bg-muted/20 rounded-2xl">
                              <StaffAutocomplete 
                                label={`Buscar Docente ${i + 1}`} 
                                defaultValue={member.lastName ? `${member.lastName}, ${member.firstName}` : ""}
                                onSelect={(s) => {
                                  const newTeam = [...technicalTeam];
                                  newTeam[i] = { firstName: s.firstName, lastName: s.lastName };
                                  setTechnicalTeam(newTeam);
                                }}
                              />
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 relative">
                                <Input placeholder="Apellido" className="h-11 rounded-lg font-medium" value={member.lastName} onChange={(e) => handleTechnicalTeamChange(i, 'lastName', e.target.value)} />
                                <div className="flex gap-2">
                                  <Input placeholder="Nombre" className="h-11 rounded-lg font-medium flex-1" value={member.firstName} onChange={(e) => handleTechnicalTeamChange(i, 'firstName', e.target.value)} />
                                  {technicalTeam.length > 3 && (
                                    <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-lg text-destructive" onClick={() => setTechnicalTeam(technicalTeam.filter((_, idx) => idx !== i))}><X className="w-4 h-4" /></Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button type="button" variant="outline" className="w-full h-10 border-dashed rounded-lg font-black text-[9px] uppercase" onClick={() => setTechnicalTeam([...technicalTeam, { firstName: "", lastName: "" }])}><Plus className="w-3.5 h-3.5 mr-2" /> Añadir integrante</Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Objetivo General</Label>
                      <Textarea placeholder="Objetivo General" className="min-h-[100px] rounded-xl font-medium" value={objetivoGeneral} onChange={(e) => setObjetivoGeneral(e.target.value)} />
                    </div>

                    <div className="space-y-6 bg-primary/[0.02] p-6 rounded-3xl border border-dashed border-primary/20">
                      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" /><span className="font-black uppercase text-[10px] tracking-widest text-primary">Objetivos Específicos</span></div><Switch checked={hasSpecificObjectives} onCheckedChange={setHasSpecificObjectives} /></div>
                      {hasSpecificObjectives && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                          {objetivosEspecificos.map((obj, i) => (
                            <div key={i} className="flex gap-2">
                              <div className="flex h-11 w-11 items-center justify-center bg-primary/10 rounded-lg shrink-0 font-bold text-primary text-[10px]">{i + 1}</div>
                              <Input placeholder={`Objetivo ${i + 1}`} className="h-11 rounded-lg font-medium" value={obj} onChange={(e) => handleObjectiveChange(i, e.target.value)} />
                              <Button type="button" variant="ghost" className="h-11 w-11 rounded-lg text-destructive" onClick={() => setObjetivosEspecificos(objetivosEspecificos.filter((_, idx) => idx !== i))}><X className="w-4 h-4" /></Button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" className="w-full h-10 rounded-lg border-dashed font-black uppercase text-[9px]" onClick={() => setObjetivosEspecificos([...objetivosEspecificos, ""])}><Plus className="w-3.5 h-3.5 mr-2" /> Añadir objetivo</Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isExtensionLinkedSubtype && foundProject && (
                  <div className="p-6 bg-muted/20 rounded-3xl border border-muted space-y-6 animate-in fade-in">
                    <div className="flex items-center gap-2 text-primary">
                      <FileUp className="w-5 h-5" />
                      <span className="font-black uppercase text-xs tracking-widest">Proyecto Vinculado</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Título:</p>
                        <p className="text-sm font-bold leading-tight">{foundProject.title}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Director:</p>
                        <p className="text-sm font-bold text-primary">
                          {foundProject.director ? `${foundProject.director.lastName}, ${foundProject.director.firstName}` : 'Sin director asignado'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {type === "Convenio" && (
              <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-muted animate-in fade-in space-y-8">
                <div className="space-y-2"><Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título del Convenio</Label><Input placeholder="Título" className="h-12 rounded-xl font-bold" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Fecha de Firma</Label>
                    <div className="grid grid-cols-3 gap-1">
                      <Select value={signingDay} onValueChange={setSigningDay}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                      <Select value={signingMonth} onValueChange={setSigningMonth}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                      <Select value={signingYearSelect} onValueChange={setSigningYearSelect}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Duración (Años)</Label><Input type="number" min="1" className="h-12 rounded-xl font-bold" value={durationYears} onChange={(e) => setDurationYears(e.target.value)} /></div>
                </div>
                <div className="space-y-4">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Contrapartes Institucionales</Label>
                  <div className="space-y-3">
                    {counterparts.map((cp, i) => (
                      <div key={i} className="flex gap-2">
                        <Input placeholder={`Contraparte ${i + 1}`} className="h-11 rounded-lg font-bold" value={cp} onChange={(e) => { const n = [...counterparts]; n[i] = e.target.value; setCounterparts(n); }} required={i === 0} />
                        <Button type="button" variant="ghost" className="h-11 w-11 rounded-lg" onClick={() => setCounterparts(counterparts.filter((_, idx) => idx !== i))}><X className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" className="rounded-lg text-[10px] font-black uppercase h-10 border-dashed" onClick={() => setCounterparts([...counterparts, ""])}><Plus className="w-3.5 h-3.5 mr-2" /> Agregar Institución</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10"><span className="font-black uppercase text-[10px] tracking-widest text-primary">Renovación Automática</span><Switch checked={hasAutomaticRenewal} onCheckedChange={setHasAutomaticRenewal} /></div>
                  <div className="flex flex-col gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="flex items-center justify-between"><span className="font-black uppercase text-[10px] tracking-widest text-primary">Responsable Institucional</span><Switch checked={hasInstitutionalResponsible} onCheckedChange={setHasInstitutionalResponsible} /></div>
                    {hasInstitutionalResponsible && (
                      <div className="animate-in slide-in-from-top-2 duration-300 space-y-4">
                        <Label className="font-black uppercase text-[9px] tracking-widest text-muted-foreground mb-1 block">Equipo Responsable</Label>
                        {technicalTeam.map((member, i) => (
                          <div key={i} className="space-y-2 p-3 bg-white/50 rounded-xl">
                            <StaffAutocomplete 
                              label={`Buscar Docente ${i + 1}`} 
                              defaultValue={member.lastName ? `${member.lastName}, ${member.firstName}` : ""}
                              onSelect={(s) => {
                                const newTeam = [...technicalTeam];
                                newTeam[i] = { firstName: s.firstName, lastName: s.lastName };
                                setTechnicalTeam(newTeam);
                              }}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <Input placeholder="Apellido" className="h-9 rounded-lg text-xs" value={member.lastName} onChange={(e) => handleTechnicalTeamChange(i, 'lastName', e.target.value)} />
                              <Input placeholder="Nombre" className="h-9 rounded-lg text-xs" value={member.firstName} onChange={(e) => handleTechnicalTeamChange(i, 'firstName', e.target.value)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {type === "Movilidad" && (
              <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-muted animate-in fade-in space-y-8">
                <div className="space-y-2"><Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título de la Movilidad</Label><Input placeholder="Ej: Pasantía de Investigación en INTA" className="h-12 rounded-xl font-bold" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-8">
                  <div className="space-y-4">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2"><Calendar className="w-4 h-4" /> Período - Desde</Label>
                    <div className="grid grid-cols-3 gap-1">
                      <Select value={mobilityStartDay} onValueChange={setMobilityStartDay}><SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                      <Select value={mobilityStartMonth} onValueChange={setMobilityStartMonth}><SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                      <Select value={mobilityStartYear} onValueChange={setMobilityStartYear}><SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2"><Calendar className="w-4 h-4" /> Período - Hasta</Label>
                    <div className="grid grid-cols-3 gap-1">
                      <Select value={mobilityEndDay} onValueChange={setMobilityEndDay}><SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                      <Select value={mobilityEndMonth} onValueChange={setMobilityEndMonth}><SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                      <Select value={mobilityEndYear} onValueChange={setMobilityEndYear}><SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2"><MapPin className="w-4 h-4" /> Destino de la Movilidad</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-muted-foreground">Institución/Universidad</Label><Input placeholder="Nombre" value={mobilityInstitution} onChange={(e) => setMobilityInstitution(e.target.value)} className="h-11 rounded-xl font-bold" required /></div>
                    <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-muted-foreground">Provincia/Estado</Label><Input placeholder="Provincia" value={mobilityState} onChange={(e) => setMobilityState(e.target.value)} className="h-11 rounded-xl font-bold" required /></div>
                    <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-muted-foreground">País</Label><Input placeholder="País" value={mobilityCountry} onChange={(e) => setMobilityCountry(e.target.value)} className="h-11 rounded-xl font-bold" required /></div>
                  </div>
                </div>

                <div className="space-y-4 md:col-span-2 border-t pt-6">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2"><Users className="w-4 h-4" /> Responsables Institucionales</Label>
                  {technicalTeam.map((member, i) => (
                    <div key={i} className="space-y-2 p-3 bg-muted/10 rounded-xl relative">
                      <StaffAutocomplete 
                        label={`Buscar Docente ${i + 1}`} 
                        defaultValue={member.lastName ? `${member.lastName}, ${member.firstName}` : ""}
                        onSelect={(s) => {
                          const newTeam = [...technicalTeam];
                          newTeam[i] = { firstName: s.firstName, lastName: s.lastName };
                          setTechnicalTeam(newTeam);
                        }}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Input placeholder="Apellido" className="h-10 rounded-lg text-xs" value={member.lastName} onChange={(e) => handleTechnicalTeamChange(i, 'lastName', e.target.value)} />
                        <div className="flex gap-2">
                          <Input placeholder="Nombre" className="h-10 rounded-lg text-xs flex-1" value={member.firstName} onChange={(e) => handleTechnicalTeamChange(i, 'firstName', e.target.value)} />
                          {technicalTeam.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={() => setTechnicalTeam(technicalTeam.filter((_, idx) => idx !== i))}><X className="w-4 h-4" /></Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="outline" className="w-full h-9 rounded-lg border-dashed text-[9px] uppercase font-black" onClick={() => setTechnicalTeam([...technicalTeam, { firstName: "", lastName: "" }])}>Añadir responsable</Button>
                </div>

                <div className="space-y-2 border-t pt-6"><Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Resolución</Label><Input placeholder="Ej: Resol. 123/24" className="h-12 rounded-xl font-bold" value={projectCode} onChange={(e) => setProjectCode(e.target.value)} /></div>
              </section>
            )}

            {type && type !== "Proyecto" && type !== "Convenio" && type !== "Movilidad" && (
              <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-muted animate-in fade-in space-y-8">
                <div className="space-y-2"><Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título del Documento</Label><Input placeholder="Título" className="h-12 rounded-xl font-bold" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Fecha de Registro</Label>
                    <div className="grid grid-cols-3 gap-1">
                      <Select value={signingDay} onValueChange={setSigningDay}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                      <Select value={signingMonth} onValueChange={setSigningMonth}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                      <Select value={signingYearSelect} onValueChange={setSigningYearSelect}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                    </div>
                  </div>
                  <div className="space-y-4 md:col-span-2 border-t pt-4">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Responsables</Label>
                    {technicalTeam.map((member, i) => (
                      <div key={i} className="space-y-2 p-3 bg-muted/10 rounded-xl">
                        <StaffAutocomplete 
                          label={`Buscar Docente ${i + 1}`} 
                          defaultValue={member.lastName ? `${member.lastName}, ${member.firstName}` : ""}
                          onSelect={(s) => {
                            const newTeam = [...technicalTeam];
                            newTeam[i] = { firstName: s.firstName, lastName: s.lastName };
                            setTechnicalTeam(newTeam);
                          }}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input placeholder="Apellido" className="h-10 rounded-lg text-xs" value={member.lastName} onChange={(e) => handleTechnicalTeamChange(i, 'lastName', e.target.value)} />
                          <Input placeholder="Nombre" className="h-10 rounded-lg text-xs" value={member.firstName} onChange={(e) => handleTechnicalTeamChange(i, 'firstName', e.target.value)} />
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="outline" className="w-full h-9 rounded-lg border-dashed text-[9px] uppercase font-black" onClick={() => setTechnicalTeam([...technicalTeam, { firstName: "", lastName: "" }])}>Añadir responsable</Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Código / Expediente</Label><Input placeholder="FCA-001" className="h-12 rounded-xl font-bold" value={projectCode} onChange={(e) => setProjectCode(e.target.value)} /></div>
                  <div className="space-y-2"><Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Período</Label><Input placeholder="2024" className="h-12 rounded-xl font-bold" value={executionPeriod} onChange={(e) => setExecutionPeriod(e.target.value)} /></div>
                </div>
              </section>
            )}

            {type && (!isExtensionLinkedSubtype || foundProject) && (
              <section className="bg-primary/5 p-8 rounded-[2.5rem] border border-dashed border-primary/20 space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <Button type="button" onClick={() => fileInputRef.current?.click()} className="h-14 px-10 rounded-xl bg-white border-2 border-primary/30 text-primary font-black uppercase text-[11px] tracking-widest hover:bg-primary/5 transition-all shadow-sm">
                    {fileName ? "Cambiar Archivo" : <span className="flex items-center gap-2"><FileUp className="w-5 h-5" /> Subir Archivo</span>}
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                  {fileName && (
                    <div className="flex-1 bg-white/50 p-4 rounded-xl border border-primary/10 flex items-center gap-3 animate-in fade-in">
                      <ScrollText className="w-5 h-5 text-primary/60" />
                      <span className="text-xs font-bold text-primary truncate max-w-[200px]">{fileName}</span>
                    </div>
                  )}
                </div>
                
                <div className="pt-6 border-t border-primary/10">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Descripción / Resumen</Label>
                    <Button type="button" onClick={handleSummarize} disabled={isSummarizing || !fileDataUri} className="bg-primary/10 hover:bg-primary/20 text-primary h-8 rounded-lg px-3 text-[9px] font-black uppercase tracking-widest border border-primary/20 shadow-none transition-all">
                      {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}Generar con IA
                    </Button>
                  </div>
                  <Textarea placeholder="Resumen institucional..." className="min-h-[120px] rounded-xl font-medium bg-white" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </section>
            )}

            {isExtensionLinkedSubtype && !foundProject && (
              <div className="py-20 text-center bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted animate-pulse">
                <FileCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-black uppercase text-xs tracking-widest px-8">Vincule un proyecto para habilitar la carga</p>
              </div>
            )}

            {type && (
              <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-dashed">
                <Button type="button" variant="ghost" className="h-12 font-black uppercase text-[10px]" onClick={() => router.push("/")}><ArrowLeft className="w-4 h-4 mr-2" /> Salir</Button>
                <Button type="submit" className="h-14 px-12 rounded-xl font-black bg-primary text-white uppercase text-[11px] shadow-lg shadow-primary/20" disabled={isSaving || (isExtensionLinkedSubtype && !foundProject)}>
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2"><Save className="w-5 h-5" /> Guardar Registro</span>}
                </Button>
              </div>
            )}
          </form>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
