
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
import { collection, query, where, getDocs, limit, addDoc } from "firebase/firestore";
import { summarizeDocument } from "@/ai/flows/smart-document-summarization";
import { PersonName, StaffMember } from "@/lib/mock-data";
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
  const [student, setStudent] = useState<PersonName>({ firstName: "", lastName: "" });
  const [technicalTeam, setTechnicalTeam] = useState<PersonName[]>([
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

  const generateProjectCode = async (prefix: string) => {
    const year = new Date().getFullYear();
    const q = query(
      collection(db, 'documents'), 
      where('type', '==', type)
    );
    const snapshot = await getDocs(q);
    const yearSuffix = `-${year}`;
    const yearDocs = snapshot.docs.filter(d => d.data().projectCode?.endsWith(yearSuffix));
    const nextNumber = yearDocs.length + 1;
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    return `FCA-${prefix}-${paddedNumber}-${year}`;
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
    if (type === "Proyecto" && !projectCode) {
      finalProjectCode = await generateProjectCode("EXT");
    }

    const filteredTeam = technicalTeam.filter(member => member.firstName.trim() !== "" || member.lastName.trim() !== "");

    if (director.lastName) await upsertStaff(director);
    for (const member of filteredTeam) {
      await upsertStaff(member);
    }

    const documentData: any = {
      title: formatText(title),
      type,
      date: (type === "Proyecto") ? (new Date().toISOString()) : finalDate,
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
      documentData.authors = hasInstitutionalResponsible ? filteredTeam : [];
    } else if (type === "Proyecto") {
      documentData.extensionDocType = extensionDocType;
      documentData.projectCode = finalProjectCode;
      documentData.executionPeriod = executionPeriod;
      documentData.director = { firstName: formatText(director.firstName), lastName: formatText(director.lastName) };
      documentData.authors = filteredTeam;
      documentData.objetivoGeneral = objetivoGeneral;
      documentData.objetivosEspecificos = objetivosEspecificos.filter(obj => obj.trim() !== "");
    } else if (type === "Movilidad Estudiantil" || type === "Movilidad Docente" || type === "Pasantía") {
      const startMonthIdx = MONTHS.indexOf(mobilityStartMonth) + 1;
      const endMonthIdx = MONTHS.indexOf(mobilityEndMonth) + 1;
      documentData.mobilityStartDate = `${mobilityStartYear}-${startMonthIdx.toString().padStart(2, '0')}-${mobilityStartDay.padStart(2, '0')}`;
      documentData.mobilityEndDate = `${mobilityEndYear}-${endMonthIdx.toString().padStart(2, '0')}-${mobilityEndDay.padStart(2, '0')}`;
      documentData.mobilityInstitution = formatText(mobilityInstitution);
      documentData.mobilityState = formatText(mobilityState);
      documentData.mobilityCountry = formatText(mobilityCountry);
      documentData.projectCode = projectCode;
      documentData.authors = filteredTeam;
      if (type === "Movilidad Estudiantil" || type === "Pasantía") {
        documentData.student = { firstName: formatText(student.firstName), lastName: formatText(student.lastName) };
      }
    } else if (type === "Resolución") {
      documentData.date = finalDate;
    }

    try {
      await addDocumentNonBlocking(collection(db, 'documents'), documentData);
      toast({ title: "Registro almacenado" });
      router.push("/documents");
    } catch (error) {
      setIsSaving(false);
      toast({ variant: "destructive", title: "Error al guardar" });
    }
  };

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
                      setTechnicalTeam([{ firstName: "", lastName: "" }]);
                      setDirector({ firstName: "", lastName: "" });
                      setDescription("");
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

            {type && type !== "Resolución" && (
              <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-muted animate-in fade-in space-y-8">
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título</Label>
                  <Input placeholder="Título del registro" className="h-12 rounded-xl font-bold" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                {type === "Proyecto" && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {["Proyecto de Extensión", "Resolución de aprobación", "Informe de avance", "Informe final"].map((sub) => (
                        <Button key={sub} type="button" variant={extensionDocType === sub ? "default" : "outline"} className="text-[9px] h-10 uppercase font-black" onClick={() => setExtensionDocType(sub)}>{sub}</Button>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2"><User className="w-4 h-4" /> Director</Label>
                        <StaffAutocomplete onSelect={(s) => setDirector({ firstName: s.firstName, lastName: s.lastName })} label="Director" />
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Apellido" value={director.lastName} onChange={(e) => setDirector({...director, lastName: e.target.value})} className="h-10 rounded-lg font-bold" />
                          <Input placeholder="Nombre" value={director.firstName} onChange={(e) => setDirector({...director, firstName: e.target.value})} className="h-10 rounded-lg font-bold" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Código / Período</Label>
                        <Input placeholder="Código" value={projectCode} onChange={(e) => setProjectCode(e.target.value)} className="h-10 rounded-lg font-bold mb-2" />
                        <Input placeholder="Período (Ej: 2024-2025)" value={executionPeriod} onChange={(e) => setExecutionPeriod(e.target.value)} className="h-10 rounded-lg font-bold" />
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
                          <Input placeholder="Apellido" value={student.lastName} onChange={(e) => setStudent({...student, lastName: e.target.value})} className="h-11 rounded-xl font-bold" />
                          <Input placeholder="Nombre" value={student.firstName} onChange={(e) => setStudent({...student, firstName: e.target.value})} className="h-11 rounded-xl font-bold" />
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
                      <Input placeholder={type === 'Pasantía' ? 'Institución/Empresa' : 'Institución/Universidad'} value={mobilityInstitution} onChange={(e) => setMobilityInstitution(e.target.value)} className="h-11 rounded-xl font-bold" />
                      <Input placeholder="Provincia" value={mobilityState} onChange={(e) => setMobilityState(e.target.value)} className="h-11 rounded-xl font-bold" />
                      <Input placeholder="País" value={mobilityCountry} onChange={(e) => setMobilityCountry(e.target.value)} className="h-11 rounded-xl font-bold" />
                    </div>
                  </div>
                )}

                {type === "Convenio" && (
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
                )}

                <div className="space-y-4 pt-4 border-t">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2">
                    <Users className="w-4 h-4" /> 
                    {type === 'Movilidad Docente' ? 'Beneficiario' : 'Responsables Institucionales'}
                  </Label>
                  <div className="space-y-3">
                    {technicalTeam.map((member, i) => (
                      <div key={i} className="flex gap-2">
                        <Input placeholder="Apellido" className="h-11 rounded-lg font-bold" value={member.lastName} onChange={(e) => handleTechnicalTeamChange(i, 'lastName', e.target.value)} />
                        <div className="flex gap-2 flex-1">
                          <Input placeholder="Nombre" className="h-11 rounded-lg font-bold flex-1" value={member.firstName} onChange={(e) => handleTechnicalTeamChange(i, 'firstName', e.target.value)} />
                          {technicalTeam.length > 1 && type !== 'Movilidad Docente' && (
                            <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-lg text-destructive" onClick={() => setTechnicalTeam(technicalTeam.filter((_, idx) => idx !== i))}><X className="w-4 h-4" /></Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {type !== 'Movilidad Docente' && (
                      <Button type="button" variant="outline" className="w-full h-10 border-dashed rounded-lg font-black text-[9px] uppercase" onClick={() => setTechnicalTeam([...technicalTeam, { firstName: "", lastName: "" }])}><Plus className="w-3.5 h-3.5 mr-2" /> Añadir integrante</Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                  <div className="space-y-2"><Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Resolución / Código</Label><Input placeholder="Número de resolución" value={projectCode} onChange={(e) => setProjectCode(e.target.value)} className="h-12 rounded-xl font-bold" /></div>
                </div>
              </section>
            )}

            {type === "Resolución" && (
              <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-muted animate-in fade-in space-y-8">
                <div className="space-y-2"><Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título</Label><Input placeholder="Título de la resolución" className="h-12 rounded-xl font-bold" value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                <div className="space-y-2"><Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Fecha de Aprobación</Label>
                  <div className="grid grid-cols-3 gap-1 max-w-sm">
                    <Select value={signingDay} onValueChange={setSigningDay}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                    <Select value={signingMonth} onValueChange={setSigningMonth}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                    <Select value={signingYearSelect} onValueChange={setSigningYearSelect}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                  </div>
                </div>
              </section>
            )}

            {type && (
              <section className="bg-primary/5 p-8 rounded-[2.5rem] border border-dashed border-primary/20 space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <Button type="button" onClick={() => fileInputRef.current?.click()} className="h-14 px-10 rounded-xl bg-white border-2 border-primary/30 text-primary font-black uppercase text-[11px] tracking-widest hover:bg-primary/5 transition-all shadow-sm">
                    {fileName ? "Cambiar Archivo" : <span className="flex items-center gap-2"><FileUp className="w-5 h-5" /> Subir Archivo</span>}
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                  {fileName && <div className="flex-1 bg-white/50 p-4 rounded-xl border border-primary/10 flex items-center gap-3"><ScrollText className="w-5 h-5 text-primary/60" /><span className="text-xs font-bold text-primary truncate max-w-[200px]">{fileName}</span></div>}
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
                <div className="flex justify-end gap-4 mt-8">
                  <Button type="button" variant="ghost" className="h-12 font-black uppercase text-[10px]" onClick={() => router.push("/")}><ArrowLeft className="w-4 h-4 mr-2" /> Salir</Button>
                  <Button type="submit" className="h-14 px-12 rounded-xl font-black bg-primary text-white uppercase text-[11px] shadow-lg shadow-primary/20" disabled={isSaving}>
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
