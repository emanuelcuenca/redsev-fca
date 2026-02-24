
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
  GraduationCap,
  Plane,
  Handshake,
  ArrowLeftRight,
  Target,
  FileUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  UserCheck
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
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection } from "firebase/firestore";
import { summarizeDocument } from "@/ai/flows/smart-document-summarization";

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
  const [authors, setAuthors] = useState("");
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

  const formatTitle = (text: string) => {
    if (!text) return "";
    return text
      .split(' ')
      .filter(Boolean)
      .map(word => {
        if (word.length >= 2 && word === word.toUpperCase()) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  const generateProjectCode = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `FCA-EXT-${random}-${new Date().getFullYear()}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileDataUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSummarize = async () => {
    if (!fileDataUri) {
      toast({
        variant: "destructive",
        title: "Archivo requerido",
        description: "Por favor, suba un documento para que la IA pueda analizarlo."
      });
      return;
    }

    setIsSummarizing(true);
    try {
      const result = await summarizeDocument({
        documentMediaUri: fileDataUri,
        documentContent: title
      });
      
      if (result?.summary) {
        setDescription(result.summary);
        toast({
          title: "Resumen generado",
          description: "La IA ha analizado el documento exitosamente."
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de IA",
        description: error.message || "No se pudo generar el resumen."
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...objetivosEspecificos];
    newObjectives[index] = value;
    setObjetivosEspecificos(newObjectives);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !type) return;

    setIsSaving(true);
    const monthIdx = MONTHS.indexOf(signingMonth) + 1;
    const finalDate = `${signingYearSelect}-${monthIdx.toString().padStart(2, '0')}-${signingDay.padStart(2, '0')}`;

    let finalProjectCode = projectCode;
    if (type === "Proyecto" && extensionDocType === "Proyecto de Extensión" && !projectCode) {
      finalProjectCode = generateProjectCode();
    }

    const documentData: any = {
      title: formatTitle(title),
      type,
      date: extensionDocType === "Proyecto de Extensión" ? new Date().toISOString() : finalDate,
      uploadDate: new Date().toISOString(),
      uploadedByUserId: user.uid,
      description,
      fileUrl: fileDataUri || "#",
      fileType: fileName ? fileName.split('.').pop() : "application/pdf"
    };

    if (type === "Convenio") {
      documentData.durationYears = parseInt(durationYears);
      documentData.hasAutomaticRenewal = hasAutomaticRenewal;
      const filteredCp = counterparts.filter(c => c.trim() !== "");
      documentData.counterparts = filteredCp;
      documentData.counterpart = filteredCp.join(", ");
      documentData.hasInstitutionalResponsible = hasInstitutionalResponsible;
      documentData.authors = hasInstitutionalResponsible ? authors.split(',').map(a => a.trim()).filter(Boolean) : [];
    } else if (type === "Proyecto") {
      documentData.extensionDocType = extensionDocType;
      documentData.projectCode = finalProjectCode;
      documentData.executionPeriod = executionPeriod;
      documentData.authors = authors.split(',').map(a => a.trim()).filter(Boolean);
      
      if (extensionDocType === "Proyecto de Extensión") {
        documentData.objetivoGeneral = objetivoGeneral;
        if (hasSpecificObjectives) {
          documentData.objetivosEspecificos = objetivosEspecificos.filter(obj => obj.trim() !== "");
        }
      }
    } else {
      documentData.authors = authors.split(',').map(a => a.trim()).filter(Boolean);
      documentData.projectCode = projectCode;
      documentData.executionPeriod = executionPeriod;
    }

    try {
      await addDocumentNonBlocking(collection(db, 'documents'), documentData);
      toast({ 
        title: "Registro institucional almacenado",
        description: finalProjectCode ? `Código generado: ${finalProjectCode}` : "Información guardada correctamente."
      });
      setIsSaving(false);
      router.push("/documents");
    } catch (error) {
      setIsSaving(false);
      toast({ variant: "destructive", title: "Error al guardar el documento" });
    }
  };

  const isExtensionProyectoSubtype = type === "Proyecto" && extensionDocType === "Proyecto de Extensión";

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
              <h2 className="text-lg font-headline font-bold uppercase tracking-tight">Seleccione Categoría Principal</h2>
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
                  <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Tipo de Documento de Extensión</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    {[
                      "Proyecto de Extensión",
                      "Resolución de Aprobación",
                      "Informe de Avance",
                      "Informe Final"
                    ].map((subType) => (
                      <button
                        key={subType}
                        type="button"
                        onClick={() => setExtensionDocType(subType)}
                        className={`p-3 rounded-xl border-2 text-[9px] font-black uppercase tracking-tight transition-all text-center ${
                          extensionDocType === subType 
                            ? 'border-primary bg-primary/5 text-primary' 
                            : 'border-muted bg-white text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {subType}
                      </button>
                    ))}
                  </div>
                </div>

                {extensionDocType && (
                  <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">
                        {extensionDocType === "Proyecto de Extensión" ? "Título del Proyecto" : "Título del Documento"}
                      </Label>
                      <Input 
                        placeholder="Ej: Desarrollo de Huertas Comunitarias..." 
                        className="h-12 rounded-xl font-bold" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        required 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {!isExtensionProyectoSubtype && (
                        <div className="space-y-2">
                          <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Fecha de Registro / Aprobación</Label>
                          <div className="grid grid-cols-3 gap-1">
                            <Select value={signingDay} onValueChange={setSigningDay}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                            <Select value={signingMonth} onValueChange={setSigningMonth}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                            <Select value={signingYearSelect} onValueChange={setSigningYearSelect}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Responsables / Equipo Técnico</Label>
                        <Input placeholder="Dr. Mario Rojas, Lic. Ana Gómez" className="h-12 rounded-xl font-bold" value={authors} onChange={(e) => setAuthors(e.target.value)} />
                      </div>
                    </div>

                    {extensionDocType === "Proyecto de Extensión" && (
                      <>
                        <div className="space-y-2">
                          <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Objetivo General</Label>
                          <Textarea 
                            placeholder="Escriba el propósito central del proyecto..." 
                            className="min-h-[100px] rounded-xl font-medium" 
                            value={objetivoGeneral} 
                            onChange={(e) => setObjetivoGeneral(e.target.value)} 
                          />
                        </div>

                        <div className="space-y-6 bg-primary/[0.02] p-6 rounded-3xl border border-dashed border-primary/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Target className="w-5 h-5 text-primary" />
                              <span className="font-black uppercase text-[10px] tracking-widest text-primary">¿Tiene objetivos específicos?</span>
                            </div>
                            <Switch checked={hasSpecificObjectives} onCheckedChange={setHasSpecificObjectives} />
                          </div>

                          {hasSpecificObjectives && (
                            <div className="space-y-4 animate-in fade-in duration-300">
                              {objetivosEspecificos.map((obj, i) => (
                                <div key={i} className="flex gap-2">
                                  <div className="flex h-12 w-12 items-center justify-center bg-primary/10 rounded-xl shrink-0 font-bold text-primary">
                                    {i + 1}
                                  </div>
                                  <Input 
                                    placeholder={`Objetivo específico ${i + 1}`} 
                                    className="h-12 rounded-xl font-medium" 
                                    value={obj} 
                                    onChange={(e) => handleObjectiveChange(i, e.target.value)} 
                                  />
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    className="h-12 w-12 rounded-xl text-destructive"
                                    onClick={() => setObjetivosEspecificos(objetivosEspecificos.filter((_, idx) => idx !== i))}
                                  >
                                    <X className="w-5 h-5" />
                                  </Button>
                                </div>
                              ))}
                              <Button 
                                type="button" 
                                variant="outline" 
                                className="w-full h-12 rounded-xl border-dashed font-black uppercase text-[10px] tracking-widest"
                                onClick={() => setObjetivosEspecificos([...objetivosEspecificos, ""])}
                              >
                                <Plus className="w-4 h-4 mr-2" /> Añadir otro objetivo específico
                              </Button>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {!isExtensionProyectoSubtype && (
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Código de Proyecto Asociado</Label>
                        <Input 
                          placeholder="FCA-EXT-XXXX-YYYY" 
                          className="h-12 rounded-xl font-bold" 
                          value={projectCode} 
                          onChange={(e) => setProjectCode(e.target.value)} 
                          required
                        />
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {type === "Convenio" && (
              <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-muted animate-in fade-in space-y-8">
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título del Convenio</Label>
                  <Input placeholder="Ej: Acuerdo de Cooperación Técnica..." className="h-12 rounded-xl font-bold" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Fecha de Firma</Label>
                    <div className="grid grid-cols-3 gap-1">
                      <Select value={signingDay} onValueChange={setSigningDay}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                      <Select value={signingMonth} onValueChange={setSigningMonth}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                      <Select value={signingYearSelect} onValueChange={setSigningYearSelect}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Duración (Años)</Label>
                    <Input type="number" min="1" className="h-12 rounded-xl font-bold" value={durationYears} onChange={(e) => setDurationYears(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Contrapartes Institucionales</Label>
                  <div className="space-y-3">
                    {counterparts.map((cp, i) => (
                      <div key={i} className="flex gap-2">
                        <Input placeholder={`Contraparte ${i + 1}`} className="h-12 rounded-xl font-bold" value={cp} onChange={(e) => {
                          const newCp = [...counterparts];
                          newCp[i] = e.target.value;
                          setCounterparts(newCp);
                        }} required={i === 0} />
                        <Button type="button" variant="ghost" className="h-12 w-12 rounded-xl" onClick={() => setCounterparts(counterparts.filter((_, idx) => idx !== i))}><X className="w-5 h-5 text-destructive" /></Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" className="rounded-xl text-[10px] font-black uppercase h-10 border-dashed" onClick={() => setCounterparts([...counterparts, ""])}><Plus className="w-4 h-4 mr-2" /> Agregar Institución</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <span className="font-black uppercase text-[10px] tracking-widest text-primary">Renovación Automática</span>
                    <Switch checked={hasAutomaticRenewal} onCheckedChange={setHasAutomaticRenewal} />
                  </div>
                  <div className="flex flex-col gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="flex items-center justify-between">
                      <span className="font-black uppercase text-[10px] tracking-widest text-primary">Responsable Institucional</span>
                      <Switch checked={hasInstitutionalResponsible} onCheckedChange={setHasInstitutionalResponsible} />
                    </div>
                    {hasInstitutionalResponsible && (
                      <div className="animate-in slide-in-from-top-2 duration-300">
                        <Label className="font-black uppercase text-[9px] tracking-widest text-muted-foreground mb-1 block">Nombres de Responsables</Label>
                        <div className="relative">
                          <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary/40" />
                          <Input 
                            placeholder="Dr. Mario Rojas, Lic. Ana Gómez..." 
                            className="h-9 rounded-lg text-xs font-bold pl-9" 
                            value={authors} 
                            onChange={(e) => setAuthors(e.target.value)} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {type && type !== "Proyecto" && type !== "Convenio" && (
              <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-muted animate-in fade-in space-y-8">
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título del Documento</Label>
                  <Input placeholder="Ej: Registro de..." className="h-12 rounded-xl font-bold" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Fecha de Registro</Label>
                    <div className="grid grid-cols-3 gap-1">
                      <Select value={signingDay} onValueChange={setSigningDay}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                      <Select value={signingMonth} onValueChange={setSigningMonth}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                      <Select value={signingYearSelect} onValueChange={setSigningYearSelect}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Responsables (sep. por coma)</Label>
                    <Input placeholder="Dr. Mario Rojas, Lic. Ana Gómez" className="h-12 rounded-xl font-bold" value={authors} onChange={(e) => setAuthors(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Código / Expediente</Label>
                    <Input placeholder="FCA-001-2024" className="h-12 rounded-xl font-bold" value={projectCode} onChange={(e) => setProjectCode(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Período</Label>
                    <Input placeholder="2024" className="h-12 rounded-xl font-bold" value={executionPeriod} onChange={(e) => setExecutionPeriod(e.target.value)} />
                  </div>
                </div>
              </section>
            )}

            {type && (
              <section className="bg-primary/5 p-8 rounded-[2.5rem] border border-dashed border-primary/20 space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2.5 rounded-xl"><FileUp className="w-5 h-5 text-primary" /></div>
                    <div>
                      <h3 className="font-headline font-bold uppercase text-sm tracking-tight text-primary">Documentación de Respaldo</h3>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase">Suba el archivo original para el registro y análisis por IA</p>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border-primary/30 text-primary font-black uppercase text-[10px] h-10 px-6 hover:bg-primary/5"
                  >
                    {fileName ? "Cambiar Archivo" : "Seleccionar Archivo"}
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                </div>

                {fileName && (
                  <div className="flex items-center gap-2 bg-white/50 p-3 rounded-xl border border-primary/10 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-bold text-primary truncate">{fileName}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-primary/10">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Descripción / Resumen Ejecutivo</Label>
                    <Button 
                      type="button" 
                      onClick={handleSummarize}
                      disabled={isSummarizing || !fileDataUri}
                      className="bg-primary/10 hover:bg-primary/20 text-primary h-8 rounded-lg px-3 text-[9px] font-black uppercase tracking-widest border border-primary/20 shadow-none transition-all"
                    >
                      {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                      Generar Resumen con IA
                    </Button>
                  </div>
                  <Textarea 
                    placeholder="Resumen del alcance y objetivos del registro..." 
                    className="min-h-[120px] rounded-xl font-medium bg-white" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                  />
                  {!fileDataUri && (
                    <p className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase">
                      <AlertCircle className="w-3 h-3" /> Suba un documento para habilitar el asistente de IA
                    </p>
                  )}
                </div>
              </section>
            )}

            {type && (
              <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-dashed">
                <Button type="button" variant="ghost" className="h-12 font-black uppercase text-[10px]" onClick={() => router.push("/")}><ArrowLeft className="w-4 h-4 mr-2" /> Salir</Button>
                <Button type="submit" className="h-14 px-12 rounded-xl font-black bg-primary text-white uppercase text-[11px] shadow-lg shadow-primary/20" disabled={isSaving}>
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
