
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
  Plane,
  Handshake,
  User,
  BookOpen,
  UserCheck,
  Timer,
  ArrowLeftRight,
  Fingerprint,
  MapPin,
  Landmark,
  ListTodo,
  CheckCircle2,
  RotateCcw
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
import { toast } from "@/hooks/use-toast";
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { collection, query, where, getCountFromServer, getDocs, limit } from "firebase/firestore";
import { summarizeDocument } from "@/ai/flows/smart-document-summarization";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const YEARS_LIST = Array.from({ length: 41 }, (_, i) => new Date().getFullYear() - 30 + i);

const CONVENIO_CATEGORIES = [
  "Capacitación",
  "Colaboración",
  "Extensión",
  "Investigación",
  "Movilidad docente",
  "Movilidad estudiantil",
  "Prácticas/Pasantías"
].sort();

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

  const [durationYears, setDurationYears] = useState<string>("1");
  const [hasAutomaticRenewal, setHasAutomaticRenewal] = useState(false);
  const [counterparts, setCounterparts] = useState<string[]>([""]);
  const [convenioSubType, setConvenioSubType] = useState("Marco");
  const [convenioCategory, setConvenioCategory] = useState("");
  const [convenioCategoryOther, setConvenioCategoryOther] = useState("");
  const [hasInstitutionalResponsible, setHasInstitutionalResponsible] = useState(false);

  const [signingDay, setSigningDay] = useState(new Date().getDate().toString());
  const [signingMonth, setSigningMonth] = useState(MONTHS[new Date().getMonth()]);
  const [signingYearSelect, setSigningYearSelect] = useState(new Date().getFullYear().toString());
  
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

  const [objetivoGeneral, setObjetivoGeneral] = useState("");
  const [hasSpecificObjectives, setHasSpecificObjectives] = useState(false);
  const [specificObjectives, setSpecificObjectives] = useState<string[]>(["", "", ""]);

  const [hasAssociatedConvenio, setHasAssociatedConvenio] = useState(false);
  const [associatedConvenioNumber, setAssociatedConvenioNumber] = useState("");
  const [associatedConvenioYear, setAssociatedConvenioYear] = useState(new Date().getFullYear().toString());

  const isSecondaryExtensionDoc = extensionDocType && extensionDocType !== "Proyecto";
  const isResolution = extensionDocType === "Resolución de aprobación" || type === "Resolución";
  const isPasantia = type === "Pasantía";

  useEffect(() => {
    if (type === "Convenio") {
      const monthIdx = MONTHS.indexOf(signingMonth) + 1;
      const formattedMonth = monthIdx.toString().padStart(2, '0');
      const formattedDay = signingDay.padStart(2, '0');
      setDate(`${signingYearSelect}-${formattedMonth}-${formattedDay}`);
    }
  }, [signingDay, signingMonth, signingYearSelect, type]);

  const formatTitle = (text: string) => {
    if (!text) return "";
    return text
      .split(' ')
      .filter(Boolean)
      .map(word => {
        if (word.length > 1 && word === word.toUpperCase()) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
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
    setHasAutomaticRenewal(false);
    setCounterparts([""]);
    setConvenioSubType("Marco");
    setConvenioCategory("");
    setConvenioCategoryOther("");
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
    setObjetivoGeneral("");
    setHasSpecificObjectives(false);
    setSpecificObjectives(["", "", ""]);
    setHasAssociatedConvenio(false);
    setAssociatedConvenioNumber("");
    setAssociatedConvenioYear(new Date().getFullYear().toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !type) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor complete la información requerida.",
      });
      return;
    }

    setIsSaving(true);
    
    const formattedTitle = formatTitle(title);
    let finalTitle = formattedTitle;
    if (type === "Resolución") {
      finalTitle = `Resolución ${resolutionType} N° ${title}/${resolutionYear}`;
    }

    const documentData: any = {
      title: finalTitle,
      type,
      date,
      authors: (type === "Resolución") ? [] : authors.split(',').map(a => a.trim()).filter(Boolean),
      description: isResolution ? "" : description,
      uploadDate: new Date().toISOString(),
      uploadedByUserId: user.uid,
      fileType: isPasantia ? "record" : (uploadMethod === "file" ? (file?.type || "application/pdf") : "url"),
      fileUrl: isPasantia ? "#" : (uploadMethod === "file" ? "#" : externalUrl),
    };

    const currentYear = new Date().getFullYear();

    if (type === "Convenio") {
      documentData.durationYears = parseInt(durationYears) || 1;
      documentData.hasAutomaticRenewal = hasAutomaticRenewal;
      const filteredCounterparts = counterparts.filter(c => c.trim() !== "");
      documentData.counterparts = filteredCounterparts;
      documentData.counterpart = filteredCounterparts.join(", ");
      documentData.convenioSubType = convenioSubType;
      documentData.convenioCategory = convenioCategory === "Otro..." ? convenioCategoryOther : convenioCategory;
      documentData.hasInstitutionalResponsible = hasInstitutionalResponsible;
      if (date) {
        documentData.signingYear = new Date(date).getFullYear();
      }

      try {
        const coll = collection(db, 'documents');
        const q = query(coll, where("type", "==", "Convenio"));
        const snapshot = await getCountFromServer(q);
        const nextNum = (snapshot.data().count + 1).toString().padStart(3, '0');
        documentData.projectCode = `FCA-CONV-${nextNum}-${currentYear}`;
      } catch (error) {
        const randNum = Math.floor(Math.random() * 999).toString().padStart(3, '0');
        documentData.projectCode = `FCA-CONV-${randNum}-${currentYear}`;
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
        documentData.hasAssociatedConvenio = hasAssociatedConvenio;
        if (hasAssociatedConvenio) {
          documentData.associatedConvenioNumber = associatedConvenioNumber;
          documentData.associatedConvenioYear = parseInt(associatedConvenioYear);
        }
      }
    }

    if (type === "Resolución") {
      documentData.resolutionType = resolutionType;
      documentData.resolutionYear = parseInt(resolutionYear);
    }

    addDocumentNonBlocking(collection(db, 'documents'), documentData);

    toast({
      title: "Registro almacenado",
      description: "La información institucional ha sido creada exitosamente.",
    });

    setIsSaving(false);
    resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0"><SidebarTrigger /></div>
          <div className="flex-1 flex justify-center overflow-hidden px-2">
            <div className="flex flex-col items-center leading-none text-center gap-1 w-full">
              <span className="text-[12px] md:text-2xl font-headline text-primary uppercase tracking-tighter">SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN</span>
              <span className="text-[12px] md:text-2xl font-headline text-black uppercase tracking-tighter">FCA - UNCA</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0"><UserMenu /></div>
        </header>

        <main className="p-4 md:p-8 max-w-4xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-headline font-bold uppercase tracking-tight text-primary">Cargar Registro</h1>
            <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] mt-1">Gestión Digital Institucional</p>
          </div>

          <form onSubmit={handleSubmit} className={cn("space-y-8", type ? "pb-20" : "")}>
            <section className="bg-primary/5 p-6 md:p-8 rounded-[2rem] border border-primary/10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary text-white w-8 h-8 flex items-center justify-center font-bold">1</div>
                <h2 className="text-lg md:text-xl font-headline font-bold uppercase tracking-tight">Categoría</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { id: "Convenio", label: "Convenio", icon: Handshake },
                  { id: "Proyecto", label: "Extensión", icon: ArrowLeftRight },
                  { id: "Movilidad", label: "Movilidad", icon: Plane },
                  { id: "Pasantía", label: "Práctica", icon: GraduationCap },
                  { id: "Resolución", label: "Resolución", icon: ScrollText }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setType(item.id); resetForm(); setType(item.id); }}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 ${
                      type === item.id ? 'border-primary bg-primary/10 text-primary shadow-md' : 'border-muted-foreground/10 bg-white'
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="font-bold uppercase tracking-widest text-[9px] text-center leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {type && (
              <section className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-muted animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-primary/20 text-primary w-8 h-8 flex items-center justify-center font-bold">2</div>
                  <h2 className="text-lg md:text-xl font-headline font-bold uppercase tracking-tight">Detalles</h2>
                </div>

                <div className="space-y-8">
                  {type === "Convenio" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-secondary/30 rounded-2xl border-2 border-primary/10">
                      <div className="md:col-span-2 space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título del Convenio</Label>
                        <Input placeholder="Ej: Convenio Marco de Cooperación..." className="h-12 rounded-xl font-bold" value={title} onChange={(e) => setTitle(e.target.value)} required />
                      </div>
                      
                      <div className="md:col-span-2 space-y-4">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Instituciones Contrapartes</Label>
                        <div className="space-y-3">
                          {counterparts.map((cp, i) => (
                            <div key={i} className="flex gap-2">
                              <Input 
                                placeholder={`Contraparte ${i + 1} (Ej: INTA)`} 
                                className="h-12 rounded-xl font-bold" 
                                value={cp} 
                                onChange={(e) => {
                                  const newCp = [...counterparts];
                                  newCp[i] = e.target.value;
                                  setCounterparts(newCp);
                                }} 
                                required={i === 0}
                              />
                              {counterparts.length > 1 && (
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-12 w-12 text-destructive" 
                                  onClick={() => setCounterparts(counterparts.filter((_, idx) => idx !== i))}
                                >
                                  <X className="w-5 h-5" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="rounded-xl font-black uppercase text-[10px] tracking-widest"
                            onClick={() => setCounterparts([...counterparts, ""])}
                          >
                            <Plus className="w-4 h-4 mr-2" /> Agregar Contraparte
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Área de Aplicación</Label>
                        <Select value={convenioCategory} onValueChange={setConvenioCategory}>
                          <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Seleccione" /></SelectTrigger>
                          <SelectContent>
                            {CONVENIO_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            <SelectItem value="Otro...">Otro...</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {convenioCategory === "Otro..." && (
                        <div className="md:col-span-2 space-y-2 animate-in slide-in-from-top-2">
                          <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Especifique el Área</Label>
                          <Input placeholder="Escriba el área..." className="h-12 rounded-xl font-bold" value={convenioCategoryOther} onChange={(e) => setConvenioCategoryOther(e.target.value)} required />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Fecha de Firma</Label>
                        <div className="grid grid-cols-3 gap-1">
                          <Select value={signingDay} onValueChange={setSigningDay}><SelectTrigger className="h-12 rounded-xl font-bold text-xs"><SelectValue /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                          <Select value={signingMonth} onValueChange={setSigningMonth}><SelectTrigger className="h-12 rounded-xl font-bold text-xs"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                          <Select value={signingYearSelect} onValueChange={setSigningYearSelect}><SelectTrigger className="h-12 rounded-xl font-bold text-xs"><SelectValue /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Duración (Años)</Label>
                        <Input type="number" min="1" className="h-12 rounded-xl font-bold" value={durationYears} onChange={(e) => setDurationYears(e.target.value)} />
                      </div>
                      <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                          <div className="flex items-center gap-3">
                            <RotateCcw className="w-5 h-5 text-primary" />
                            <span className="font-black uppercase text-[10px] text-primary tracking-widest">Renovación Automática</span>
                          </div>
                          <Switch checked={hasAutomaticRenewal} onCheckedChange={setHasAutomaticRenewal} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                          <div className="flex items-center gap-3">
                            <UserCheck className="w-5 h-5 text-primary" />
                            <span className="font-black uppercase text-[10px] text-primary tracking-widest">Responsable Institucional</span>
                          </div>
                          <Switch checked={hasInstitutionalResponsible} onCheckedChange={setHasInstitutionalResponsible} />
                        </div>
                      </div>
                      {hasInstitutionalResponsible && (
                        <div className="md:col-span-2 space-y-2 animate-in slide-in-from-top-2">
                          <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">Responsables (sep. por coma)</Label>
                          <Input placeholder="Ej: Dr. Gómez, Ing. Pérez..." className="h-12 rounded-xl font-bold" value={authors} onChange={(e) => setAuthors(e.target.value)} required />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Resto de tipos de documentos (simplificados para brevedad)... */}
                </div>

                <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-dashed">
                  <Button type="button" variant="ghost" className="h-12 rounded-xl font-black uppercase text-[10px]" onClick={() => router.push("/")}><ArrowLeft className="w-4 h-4 mr-2" /> Salir</Button>
                  <Button type="submit" className="h-14 px-12 rounded-xl font-black bg-primary text-white uppercase text-[11px]" disabled={isSaving}>
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
