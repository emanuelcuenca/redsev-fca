
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  Save, 
  ArrowLeft,
  Loader2,
  Pencil,
  RotateCcw,
  UserCheck,
  ListTodo,
  Plus,
  Trash2
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { AgriculturalDocument } from "@/lib/mock-data";

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

export default function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const docRef = useMemoFirebase(() => 
    (resolvedParams.id && user) ? doc(db, 'documents', resolvedParams.id) : null, 
    [db, resolvedParams.id, user]
  );
  const { data: docData, isLoading: isDocLoading } = useDoc<AgriculturalDocument>(docRef);

  const adminRef = useMemoFirebase(() => 
    user ? doc(db, 'roles_admin', user.uid) : null, 
    [db, user]
  );
  const { data: adminDoc, isLoading: isAdminLoading } = useDoc(adminRef);

  const [formData, setFormData] = useState<any>({
    title: "",
    type: "",
    date: "",
    authors: "",
    description: "",
    durationYears: "1",
    hasAutomaticRenewal: false,
    counterpart: "",
    convenioSubType: "Marco",
    convenioCategory: "",
    hasInstitutionalResponsible: false,
    beneficiaryName: "",
    programName: "",
    convocatoria: "",
    destinationInstitution: "",
    destinationProvince: "",
    destinationCountry: "",
    extensionDocType: "",
    presentationDate: "",
    reportPeriod: "",
    executionPeriod: "",
    projectCode: "",
    objetivoGeneral: "",
    hasSpecificObjectives: false,
    specificObjectives: ["", "", ""],
    hasAssociatedConvenio: false,
    associatedConvenioNumber: "",
    associatedConvenioYear: new Date().getFullYear().toString(),
    resolutionType: "",
    resolutionYear: new Date().getFullYear().toString()
  });

  const [signingDay, setSigningDay] = useState("");
  const [signingMonth, setSigningMonth] = useState("");
  const [signingYearSelect, setSigningYearSelect] = useState("");

  useEffect(() => {
    if (docData) {
      const authStr = docData.authors?.join(", ") || "";
      const isSpecObj = !!(docData.objetivosEspecificos && docData.objetivosEspecificos.length > 0);
      
      setFormData({
        ...docData,
        authors: authStr,
        hasSpecificObjectives: isSpecObj,
        specificObjectives: isSpecObj ? docData.objetivosEspecificos : ["", "", ""],
        durationYears: docData.durationYears?.toString() || "1",
        resolutionYear: docData.resolutionYear?.toString() || new Date().getFullYear().toString(),
        associatedConvenioYear: docData.associatedConvenioYear?.toString() || new Date().getFullYear().toString()
      });

      if (docData.date) {
        const d = new Date(docData.date);
        setSigningDay(d.getDate().toString());
        setSigningMonth(MONTHS[d.getMonth()]);
        setSigningYearSelect(d.getFullYear().toString());
      }
    }
  }, [docData]);

  useEffect(() => {
    if (mounted && !isUserLoading && !isAdminLoading) {
      if (!user || !adminDoc) {
        router.push('/');
        toast({ variant: "destructive", title: "Acceso denegado" });
      }
    }
  }, [user, adminDoc, isUserLoading, isAdminLoading, mounted, router]);

  const formatTitle = (text: string) => {
    if (!text) return "";
    return text
      .split(' ')
      .filter(Boolean)
      .map(word => {
        // Si la palabra es puramente mayúsculas (y tiene más de 1 letra), la dejamos igual para siglas
        if (word.length > 1 && word === word.toUpperCase()) {
          return word;
        }
        // De lo contrario, capitalizamos la primera y minúsculas el resto
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docRef) return;

    setIsSaving(true);
    
    const authorsArr = typeof formData.authors === 'string' 
      ? formData.authors.split(',').map((a: string) => a.trim()).filter(Boolean)
      : formData.authors;
    
    let finalDate = formData.date;
    if (formData.type === "Convenio" && signingDay && signingMonth && signingYearSelect) {
      const monthIdx = MONTHS.indexOf(signingMonth) + 1;
      finalDate = `${signingYearSelect}-${monthIdx.toString().padStart(2, '0')}-${signingDay.padStart(2, '0')}`;
    }

    const formattedTitle = formatTitle(formData.title);

    const updateData: any = {
      ...formData,
      title: formattedTitle,
      authors: authorsArr,
      date: finalDate,
      updatedAt: new Date().toISOString(),
      objetivosEspecificos: formData.hasSpecificObjectives ? formData.specificObjectives.filter((o: string) => o.trim() !== "") : [],
      durationYears: parseInt(formData.durationYears),
      resolutionYear: parseInt(formData.resolutionYear),
      associatedConvenioYear: parseInt(formData.associatedConvenioYear)
    };

    updateDocumentNonBlocking(docRef, updateData);

    toast({ title: "Registro actualizado", description: "Los cambios se guardaron correctamente." });
    setTimeout(() => router.push(`/documents/${resolvedParams.id}`), 1000);
  };

  if (!mounted || isUserLoading || isDocLoading || isAdminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const isConvenio = formData.type === "Convenio";
  const isProyecto = formData.type === "Proyecto";
  const isPasantia = formData.type === "Pasantía";
  const isMovilidad = formData.type === "Movilidad";

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
              <span className="text-[12px] md:text-2xl font-headline text-primary uppercase tracking-tighter">SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN</span>
              <span className="text-[12px] md:text-2xl font-headline text-black uppercase tracking-tighter">FCA - UNCA</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <UserMenu />
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-4xl mx-auto w-full pb-32">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary"><Pencil className="w-6 h-6" /></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-headline font-bold uppercase tracking-tight text-primary">Editar</h1>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Gestión total de metadatos institucionales</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
              <CardContent className="p-8 space-y-8">
                {/* CAMPOS COMUNES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Título del Documento</Label>
                    <Input 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="h-12 rounded-xl border-muted-foreground/20 font-bold"
                    />
                  </div>

                  {isConvenio && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Contraparte</Label>
                        <Input 
                          value={formData.counterpart}
                          onChange={(e) => setFormData({...formData, counterpart: e.target.value})}
                          className="h-12 rounded-xl border-muted-foreground/20 font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Área de Aplicación</Label>
                        <Select value={formData.convenioCategory} onValueChange={(v) => setFormData({...formData, convenioCategory: v})}>
                          <SelectTrigger className="h-12 rounded-xl font-bold">
                            <SelectValue placeholder="Seleccione área" />
                          </SelectTrigger>
                          <SelectContent>
                            {CONVENIO_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            <SelectItem value="Otro...">Otro...</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fecha de Firma</Label>
                        <div className="grid grid-cols-3 gap-1">
                          <Select value={signingDay} onValueChange={setSigningDay}>
                            <SelectTrigger className="h-12 rounded-xl font-bold">
                              <SelectValue placeholder="Día" />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={signingMonth} onValueChange={setSigningMonth}>
                            <SelectTrigger className="h-12 rounded-xl font-bold">
                              <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent>
                              {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Select value={signingYearSelect} onValueChange={setSigningYearSelect}>
                            <SelectTrigger className="h-12 rounded-xl font-bold">
                              <SelectValue placeholder="Año" />
                            </SelectTrigger>
                            <SelectContent>
                              {YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Duración (Años)</Label>
                        <Input 
                          type="number"
                          value={formData.durationYears}
                          onChange={(e) => setFormData({...formData, durationYears: e.target.value})}
                          className="h-12 rounded-xl font-bold"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                          <div className="flex items-center gap-3">
                            <RotateCcw className="w-5 h-5 text-primary" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Renovación Automática</span>
                            </div>
                          </div>
                          <Switch 
                            checked={formData.hasAutomaticRenewal} 
                            onCheckedChange={(v) => setFormData({...formData, hasAutomaticRenewal: v})} 
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                          <div className="flex items-center gap-3">
                            <UserCheck className="w-5 h-5 text-primary" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Responsable Institucional</span>
                            </div>
                          </div>
                          <Switch 
                            checked={formData.hasInstitutionalResponsible} 
                            onCheckedChange={(v) => setFormData({...formData, hasInstitutionalResponsible: v})} 
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Resumen / Descripción</Label>
                    <Textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="min-h-[150px] rounded-xl font-medium"
                    />
                  </div>

                  {(isProyecto || isConvenio || isMovilidad || isPasantia) && (
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Autores / Responsables (sep. por comas)</Label>
                      <Input 
                        value={formData.authors}
                        onChange={(e) => setFormData({...formData, authors: e.target.value})}
                        className="h-12 rounded-xl border-muted-foreground/20 font-bold"
                      />
                    </div>
                  )}

                  {isProyecto && (
                    <div className="md:col-span-2 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Objetivo General</Label>
                        <Textarea 
                          value={formData.objetivoGeneral}
                          onChange={(e) => setFormData({...formData, objetivoGeneral: e.target.value})}
                          className="min-h-[100px] rounded-xl bg-primary/5 border-primary/20 font-medium"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <div className="flex items-center gap-3">
                          <ListTodo className="w-5 h-5 text-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Objetivos Específicos</span>
                        </div>
                        <Switch 
                          checked={formData.hasSpecificObjectives} 
                          onCheckedChange={(v) => setFormData({...formData, hasSpecificObjectives: v})} 
                        />
                      </div>

                      {formData.hasSpecificObjectives && (
                        <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                          {formData.specificObjectives?.map((obj: string, i: number) => (
                            <div key={i} className="flex gap-2">
                              <Input 
                                value={obj}
                                onChange={(e) => {
                                  const newObj = [...formData.specificObjectives];
                                  newObj[i] = e.target.value;
                                  setFormData({...formData, specificObjectives: newObj});
                                }}
                                className="h-10 rounded-xl"
                                placeholder={`Objetivo ${i+1}`}
                              />
                            </div>
                          ))}
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary font-bold text-[10px] uppercase"
                            onClick={() => setFormData({...formData, specificObjectives: [...formData.specificObjectives, ""]})}
                          >
                            <Plus className="w-4 h-4 mr-2" /> Agregar Objetivo
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-dashed flex flex-col md:flex-row items-center justify-between gap-4">
                  <Button type="button" variant="ghost" className="w-full md:w-auto rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Cancelar
                  </Button>
                  <Button 
                    className="w-full md:w-auto h-14 px-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-[11px]"
                    disabled={isSaving}
                    onClick={handleSubmit}
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2"><Save className="w-5 h-5" /> Guardar Cambios</span>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

