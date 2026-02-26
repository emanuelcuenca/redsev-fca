
"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Save, 
  ArrowLeft,
  Loader2,
  Pencil,
  X,
  Plus,
  FileUp,
  User,
  Users,
  ScrollText,
  Calendar,
  MapPin,
  Clock,
  Globe
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { AgriculturalDocument, PersonName } from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const YEARS_LIST = Array.from({ length: 41 }, (_, i) => new Date().getFullYear() - 30 + i);

export default function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState("");
  const [fileSourceMode, setFileMode] = useState<"upload" | "link">("upload");

  useEffect(() => {
    setMounted(true);
  }, []);

  const docRef = useMemoFirebase(() => 
    (resolvedParams.id && user) ? doc(db, 'documents', resolvedParams.id) : null, 
    [db, resolvedParams.id, user]
  );
  const { data: docData, isLoading: isDocLoading } = useDoc<AgriculturalDocument>(docRef);

  const [formData, setFormData] = useState<any>({
    title: "",
    type: "",
    extensionDocType: "",
    date: "",
    resolutionNumber: "",
    director: { firstName: "", lastName: "" },
    student: { firstName: "", lastName: "" },
    authors: [],
    description: "",
    durationYears: "1",
    hasAutomaticRenewal: false,
    counterparts: [""],
    hasInstitutionalResponsible: false,
    projectCode: "",
    objetivoGeneral: "",
    objetivosEspecificos: [],
    executionPeriod: "",
    executionStartDate: "",
    executionEndDate: "",
    mobilityStartDate: "",
    mobilityEndDate: "",
    mobilityInstitution: "",
    mobilityState: "",
    mobilityCountry: ""
  });

  const [hasSpecificObjectives, setHasSpecificObjectives] = useState(false);
  const [signingDay, setSigningDay] = useState("");
  const [signingMonth, setSigningMonth] = useState("");
  const [signingYearSelect, setSigningYearSelect] = useState("");

  const [execStartDay, setExecStartDay] = useState("");
  const [execStartMonth, setExecStartMonth] = useState("");
  const [execStartYear, setExecStartYear] = useState("");
  const [execEndDay, setExecEndDay] = useState("");
  const [execEndMonth, setExecEndMonth] = useState("");
  const [execEndYear, setExecEndYear] = useState("");

  const [mobilityStartDay, setMobilityStartDay] = useState("");
  const [mobilityStartMonth, setMobilityStartMonth] = useState("");
  const [mobilityStartYear, setMobilityStartYear] = useState("");
  const [mobilityEndDay, setMobilityEndDay] = useState("");
  const [mobilityEndMonth, setMobilityEndMonth] = useState("");
  const [mobilityEndYear, setMobilityEndYear] = useState("");

  useEffect(() => {
    if (docData) {
      setFormData({
        ...docData,
        authors: Array.isArray(docData.authors) ? docData.authors : [],
        director: docData.director || { firstName: "", lastName: "" },
        student: docData.student || { firstName: "", lastName: "" },
        durationYears: docData.durationYears?.toString() || "1",
        counterparts: Array.isArray(docData.counterparts) ? docData.counterparts : [""],
        objetivosEspecificos: Array.isArray(docData.objetivosEspecificos) ? docData.objetivosEspecificos : ["", "", ""],
        resolutionNumber: docData.resolutionNumber || ""
      });

      if (docData.objetivosEspecificos && docData.objetivosEspecificos.length > 0) {
        setHasSpecificObjectives(true);
      }

      if (docData.date) {
        const d = new Date(docData.date);
        setSigningDay(d.getDate().toString());
        setSigningMonth(MONTHS[d.getMonth()]);
        setSigningYearSelect(d.getFullYear().toString());
      }

      if (docData.executionStartDate) {
        const d = new Date(docData.executionStartDate);
        setExecStartDay(d.getDate().toString());
        setExecStartMonth(MONTHS[d.getMonth()]);
        setExecStartYear(d.getFullYear().toString());
      }
      if (docData.executionEndDate) {
        const d = new Date(docData.executionEndDate);
        setExecEndDay(d.getDate().toString());
        setExecEndMonth(MONTHS[d.getMonth()]);
        setExecEndYear(d.getFullYear().toString());
      }

      if (docData.mobilityStartDate) {
        const d = new Date(docData.mobilityStartDate);
        setMobilityStartDay(d.getDate().toString());
        setMobilityStartMonth(MONTHS[d.getMonth()]);
        setMobilityStartYear(d.getFullYear().toString());
      }
      if (docData.mobilityEndDate) {
        const d = new Date(docData.mobilityEndDate);
        setMobilityEndDay(d.getDate().toString());
        setMobilityEndMonth(MONTHS[d.getMonth()]);
        setMobilityEndYear(d.getFullYear().toString());
      }

      if (docData.fileUrl && docData.fileUrl !== "#") {
        if (docData.fileUrl.startsWith('http')) {
          setExternalUrl(docData.fileUrl);
          setFileMode('link');
        } else {
          setFileName("Documento actual");
          setFileMode('upload');
        }
      }
    }
  }, [docData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setFileDataUri(reader.result as string);
      reader.readAsDataURL(file);
    }
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

  const handleTechnicalTeamChange = (index: number, field: keyof PersonName, value: string) => {
    const newTeam = [...formData.authors];
    newTeam[index] = { ...newTeam[index], [field]: formatText(value) };
    setFormData({ ...formData, authors: newTeam });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docRef) return;

    // Validaciones obligatorias para Resolución de Aprobación
    if (formData.type === "Proyecto" && formData.extensionDocType === "Resolución de aprobación") {
      if (!formData.resolutionNumber.trim()) {
        toast({ variant: "destructive", title: "Número de Resolución obligatorio" });
        return;
      }
      if (!signingDay || !signingMonth || !signingYearSelect) {
        toast({ variant: "destructive", title: "Fecha de Resolución obligatoria" });
        return;
      }
    }

    setIsSaving(true);
    
    let finalDate = formData.date;
    if (signingDay && signingMonth && signingYearSelect) {
      const monthIdx = MONTHS.indexOf(signingMonth) + 1;
      finalDate = `${signingYearSelect}-${monthIdx.toString().padStart(2, '0')}-${signingDay.padStart(2, '0')}`;
    }

    let finalExecStart = formData.executionStartDate;
    if (execStartDay && execStartMonth && execStartYear) {
      const monthIdx = MONTHS.indexOf(execStartMonth) + 1;
      finalExecStart = `${execStartYear}-${monthIdx.toString().padStart(2, '0')}-${execStartDay.padStart(2, '0')}`;
    }
    let finalExecEnd = formData.executionEndDate;
    if (execEndDay && execEndMonth && execEndYear) {
      const monthIdx = MONTHS.indexOf(execEndMonth) + 1;
      finalExecEnd = `${execEndYear}-${monthIdx.toString().padStart(2, '0')}-${execEndDay.padStart(2, '0')}`;
    }

    let finalMobilityStart = formData.mobilityStartDate;
    if (mobilityStartDay && mobilityStartMonth && mobilityStartYear) {
      const monthIdx = MONTHS.indexOf(mobilityStartMonth) + 1;
      finalMobilityStart = `${mobilityStartYear}-${monthIdx.toString().padStart(2, '0')}-${mobilityStartDay.padStart(2, '0')}`;
    }

    let finalMobilityEnd = formData.mobilityEndDate;
    if (mobilityEndDay && mobilityEndMonth && mobilityEndYear) {
      const monthIdx = MONTHS.indexOf(mobilityEndMonth) + 1;
      finalMobilityEnd = `${mobilityEndYear}-${monthIdx.toString().padStart(2, '0')}-${mobilityEndDay.padStart(2, '0')}`;
    }

    const filteredAuthors = formData.authors.filter((a: PersonName) => a.firstName.trim() !== "" || a.lastName.trim() !== "");

    const updateData: any = {
      ...formData,
      title: formatText(formData.title),
      authors: filteredAuthors,
      director: { firstName: formatText(formData.director.firstName), lastName: formatText(formData.director.lastName) },
      student: { firstName: formatText(formData.student.firstName), lastName: formatText(formData.student.lastName) },
      date: finalDate,
      executionStartDate: finalExecStart,
      executionEndDate: finalExecEnd,
      mobilityStartDate: finalMobilityStart,
      mobilityEndDate: finalMobilityEnd,
      updatedAt: new Date().toISOString(),
      counterparts: Array.isArray(formData.counterparts) ? formData.counterparts.filter((c: string) => c.trim() !== "") : [],
      objetivosEspecificos: hasSpecificObjectives ? formData.objetivosEspecificos.filter((obj: string) => obj.trim() !== "") : [],
      durationYears: parseInt(formData.durationYears) || 1,
      fileUrl: fileSourceMode === "upload" ? (fileDataUri || formData.fileUrl) : externalUrl
    };

    updateDocumentNonBlocking(docRef, updateData);
    toast({ title: "Registro actualizado" });
    setTimeout(() => router.push(`/documents/${resolvedParams.id}`), 500);
  };

  if (!mounted || isUserLoading || isDocLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const isConvenio = formData.type === "Convenio";
  const isProyecto = formData.type === "Proyecto";
  const isMobilityEstudiantil = formData.type === 'Movilidad Estudiantil';
  const isMobilityDocente = formData.type === 'Movilidad Docente';
  const isPasantia = formData.type === 'Pasantía';
  const isMobilityLike = isMobilityEstudiantil || isMobilityDocente || isPasantia;
  const isExtensionProyecto = isProyecto && formData.extensionDocType === "Proyecto de Extensión";
  const isResolucionAprobacion = isProyecto && formData.extensionDocType === "Resolución de aprobación";
  const isInformeAvance = isProyecto && formData.extensionDocType === "Informe de avance";
  const isInformeFinal = isProyecto && formData.extensionDocType === "Informe final";

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0"><SidebarTrigger /></div>
          <div className="flex-1 flex justify-center overflow-hidden px-2">
            <div className="flex flex-col items-center leading-none text-center gap-1 w-full">
              <span className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-2xl font-headline text-primary uppercase tracking-tighter font-normal whitespace-nowrap">SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN</span>
              <span className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-2xl font-headline text-black uppercase tracking-tighter font-normal whitespace-nowrap">FCA - UNCA</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0"><UserMenu /></div>
        </header>

        <main className="p-4 md:p-8 max-w-4xl mx-auto w-full pb-32">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary/10 p-2.5 rounded-xl"><Pencil className="w-6 h-6 text-primary" /></div>
            <div>
              <h2 className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight">Editar Registro</h2>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Actualización de datos institucionales</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
              <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                <CardTitle className="text-xl font-headline font-bold uppercase text-primary flex items-center gap-3">Información General</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título</Label>
                    <input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" />
                  </div>

                  {isMobilityDocente && (
                    <div className="md:col-span-2 space-y-4 pt-4 border-t">
                      <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2"><User className="w-4 h-4" /> Beneficiario</Label>
                      <div className="space-y-3">
                        {formData.authors.map((member: PersonName, i: number) => (
                          <div key={i} className="grid grid-cols-2 gap-2 relative">
                            <input placeholder="Nombre" className="flex h-11 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-medium" value={member.firstName} onChange={(e) => handleTechnicalTeamChange(i, 'firstName', e.target.value)} />
                            <div className="flex gap-2">
                              <input placeholder="Apellido" className="flex h-11 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-medium flex-1" value={member.lastName} onChange={(e) => handleTechnicalTeamChange(i, 'lastName', e.target.value)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isMobilityLike && (
                    <div className="md:col-span-2 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-8">
                        <div className="space-y-4">
                          <Label className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2"><Calendar className="w-4 h-4" /> Período - Desde</Label>
                          <div className="grid grid-cols-3 gap-1">
                            <Select value={mobilityStartDay} onValueChange={setMobilityStartDay}><SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue placeholder="Día" /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                            <Select value={mobilityStartMonth} onValueChange={setMobilityStartMonth}><SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue placeholder="Mes" /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                            <Select value={mobilityStartYear} onValueChange={setMobilityStartYear}><SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue placeholder="Año" /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <Label className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2"><Calendar className="w-4 h-4" /> Período - Hasta</Label>
                          <div className="grid grid-cols-3 gap-1">
                            <Select value={mobilityEndDay} onValueChange={setMobilityEndDay}><SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue placeholder="Día" /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                            <Select value={mobilityEndMonth} onValueChange={setMobilityEndMonth}><SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue placeholder="Mes" /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                            <Select value={mobilityEndYear} onValueChange={setMobilityEndYear}><SelectTrigger className="h-10 rounded-xl text-xs"><SelectValue placeholder="Año" /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                          </div>
                        </div>
                      </div>

                      {(isMobilityEstudiantil || isPasantia) && (
                        <div className="space-y-4 border-b pb-8">
                          <Label className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2"><User className="w-4 h-4" /> Datos del Estudiante</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Nombre" className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" value={formData.student.firstName} onChange={(e) => setFormData({...formData, student: {...formData.student, firstName: e.target.value}})} />
                            <input placeholder="Apellido" className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" value={formData.student.lastName} onChange={(e) => setFormData({...formData, student: {...formData.student, lastName: e.target.value}})} />
                          </div>
                        </div>
                      )}

                      <div className="space-y-6">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2"><MapPin className="w-4 h-4" /> Destino</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-black uppercase text-muted-foreground">{formData.type === 'Pasantía' ? 'Institución/Empresa' : 'Institución/Universidad'}</Label>
                            <input placeholder="Nombre" value={formData.mobilityInstitution} onChange={(e) => setMobilityInstitution(e.target.value)} className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" />
                          </div>
                          <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-muted-foreground">Estado/Provincia</Label><input placeholder="Provincia" value={formData.mobilityState} onChange={(e) => setMobilityState(e.target.value)} className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" /></div>
                          <div className="space-y-2"><Label className="text-[9px] font-black uppercase text-muted-foreground">País</Label><input placeholder="País" value={formData.mobilityCountry} onChange={(e) => setMobilityCountry(e.target.value)} className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" /></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isExtensionProyecto && (
                    <div className="md:col-span-2 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2"><User className="w-4 h-4" /> Director del Proyecto</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <input placeholder="Nombre" className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" value={formData.director.firstName} onChange={(e) => setFormData({...formData, director: {...formData.director, firstName: e.target.value}})} />
                            <input placeholder="Apellido" className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" value={formData.director.lastName} onChange={(e) => setFormData({...formData, director: {...formData.director, lastName: e.target.value}})} />
                          </div>
                        </div>
                        <div className="space-y-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                          <Label className="font-black uppercase text-[10px] tracking-widest text-primary flex items-center gap-2"><Clock className="w-4 h-4" /> Período de Ejecución</Label>
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
                    </div>
                  )}

                  {!isMobilityDocente && (
                    <div className="md:col-span-2 space-y-4 border-t pt-4">
                      <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2"><Users className="w-4 h-4" /> {isMobilityLike || isConvenio ? "Responsables Institucionales" : "Responsables"}</Label>
                      <div className="space-y-3">
                        {formData.authors.map((member: PersonName, i: number) => (
                          <div key={i} className="grid grid-cols-2 gap-2 relative">
                            <input placeholder="Nombre" className="flex h-11 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-medium" value={member.firstName} onChange={(e) => handleTechnicalTeamChange(i, 'firstName', e.target.value)} />
                            <div className="flex gap-2">
                              <input placeholder="Apellido" className="flex h-11 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-medium flex-1" value={member.lastName} onChange={(e) => handleTechnicalTeamChange(i, 'lastName', e.target.value)} />
                              <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-lg text-destructive" onClick={() => setFormData({...formData, authors: formData.authors.filter((_: any, idx: number) => idx !== i)})}><X className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        ))}
                        <Button type="button" variant="outline" className="w-full h-10 border-dashed rounded-lg font-black text-[9px] uppercase" onClick={() => setFormData({...formData, authors: [...formData.authors, { firstName: "", lastName: "" }]})}><Plus className="w-3.5 h-3.5 mr-2" /> Añadir responsable</Button>
                      </div>
                    </div>
                  )}

                  {!isMobilityLike && !isProyecto && !isConvenio && formData.type !== 'Pasantía' && (
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Fecha de Firma / Registro</Label>
                      <div className="grid grid-cols-3 gap-1">
                        <Select value={signingDay} onValueChange={setSigningDay}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue placeholder="Día" /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                        <Select value={signingMonth} onValueChange={setSigningMonth}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue placeholder="Mes" /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                        <Select value={signingYearSelect} onValueChange={setSigningYearSelect}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue placeholder="Año" /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                      </div>
                    </div>
                  )}

                  {isExtensionProyecto && (
                    <div className="md:col-span-2 space-y-6">
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Objetivo General</Label>
                        <Textarea value={formData.objetivoGeneral} onChange={(e) => setFormData({...formData, objetivoGeneral: e.target.value})} className="min-h-[100px] rounded-xl font-medium" />
                      </div>
                      <div className="space-y-6 bg-primary/[0.02] p-6 rounded-3xl border border-dashed border-primary/20">
                        <div className="flex items-center justify-between"><span className="font-black uppercase text-[10px] tracking-widest text-primary">Objetivos Específicos</span><Switch checked={hasSpecificObjectives} onCheckedChange={setHasSpecificObjectives} /></div>
                        {hasSpecificObjectives && (
                          <div className="space-y-4">
                            {formData.objetivosEspecificos.map((obj: string, i: number) => (
                              <div key={i} className="flex gap-2">
                                <input value={obj} onChange={(e) => { const n = [...formData.objetivosEspecificos]; n[i] = e.target.value; setFormData({...formData, objetivosEspecificos: n}); }} className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-medium" />
                                <Button type="button" variant="ghost" className="h-12 w-12 rounded-xl text-destructive" onClick={() => setFormData({...formData, objetivosEspecificos: formData.objetivosEspecificos.filter((_: any, idx: number) => idx !== i)})}><X className="w-5 h-5" /></Button>
                              </div>
                            ))}
                            <Button type="button" variant="outline" className="w-full h-10 border-dashed rounded-xl font-black text-[9px] uppercase" onClick={() => setFormData({...formData, objetivosEspecificos: [...formData.objetivosEspecificos, ""]})}><Plus className="w-4 h-4 mr-2" /> Añadir objetivo</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isConvenio && (
                    <div className="md:col-span-2 space-y-6">
                      <div className="space-y-4">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Contrapartes</Label>
                        <div className="space-y-3">
                          {formData.counterparts?.map((cp: string, i: number) => (
                            <div key={i} className="flex gap-2">
                              <input value={cp} onChange={(e) => { const n = [...formData.counterparts]; n[i] = e.target.value; setFormData({...formData, counterparts: n}); }} className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" />
                              <Button type="button" variant="ghost" className="text-destructive h-12 w-12 rounded-xl" onClick={() => setFormData({...formData, counterparts: formData.counterparts.filter((_: any, idx: number) => idx !== i)})}><X className="w-5 h-5" /></Button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" className="rounded-xl text-[10px] font-black uppercase h-10 border-dashed" onClick={() => setFormData({...formData, counterparts: [...formData.counterparts, ""]})}><Plus className="w-4 h-4 mr-2" /> Añadir</Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10"><span className="font-black uppercase text-[10px] text-primary tracking-widest">Renovación Automática</span><Switch checked={formData.hasAutomaticRenewal} onCheckedChange={(v) => setFormData({...formData, hasAutomaticRenewal: v})} /></div>
                      </div>
                    </div>
                  )}

                  {!isMobilityEstudiantil && !isMobilityDocente && !isConvenio && formData.type !== 'Pasantía' && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2"><Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">{isMobilityLike ? "Resolución" : "Código / Expediente"}</Label><input value={formData.projectCode || ""} onChange={(e) => setFormData({...formData, projectCode: e.target.value})} className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" /></div>
                    </div>
                  )}
                </div>

                <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-dashed border-primary/20 space-y-6 mt-8">
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
                    {isResolucionAprobacion && (
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

                    {isInformeAvance ? (
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
                            {formData.extensionDocType === "Resolución de aprobación" ? "Número de Resolución *" : "Descripción / Resumen"}
                          </Label>
                        </div>
                        {formData.extensionDocType === "Resolución de aprobación" ? (
                          <Input 
                            placeholder="Ej: RES-FCA-001/2026" 
                            className="h-14 rounded-xl font-bold bg-white border-primary/20" 
                            value={formData.resolutionNumber} 
                            onChange={(e) => setFormData({...formData, resolutionNumber: e.target.value})} 
                          />
                        ) : (
                          <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="min-h-[120px] rounded-xl font-medium bg-white" />
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-8 border-t border-dashed flex items-center justify-between gap-4">
                  <Button type="button" variant="ghost" className="font-bold text-[10px] uppercase h-12 px-6" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" /> Cancelar</Button>
                  <Button className="h-14 px-10 rounded-xl bg-primary font-black uppercase text-[11px] shadow-lg shadow-primary/20" disabled={isSaving}>{isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2"><Save className="w-5 h-5" /> Guardar Cambios</span>}</Button>
                </div>
              </CardContent>
            </Card>
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
          </form>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
