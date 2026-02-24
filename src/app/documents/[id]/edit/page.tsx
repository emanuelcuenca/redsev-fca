
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
  Sparkles,
  User,
  Users,
  ScrollText
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { AgriculturalDocument, PersonName } from "@/lib/mock-data";
import { summarizeDocument } from "@/ai/flows/smart-document-summarization";

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
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

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
    extensionDocType: "",
    date: "",
    director: { firstName: "", lastName: "" },
    authors: [],
    description: "",
    durationYears: "1",
    hasAutomaticRenewal: false,
    counterparts: [""],
    hasInstitutionalResponsible: false,
    projectCode: "",
    objetivoGeneral: "",
    objetivosEspecificos: [],
    executionPeriod: ""
  });

  const [hasSpecificObjectives, setHasSpecificObjectives] = useState(false);
  const [signingDay, setSigningDay] = useState("");
  const [signingMonth, setSigningMonth] = useState("");
  const [signingYearSelect, setSigningYearSelect] = useState("");

  useEffect(() => {
    if (docData) {
      setFormData({
        ...docData,
        authors: docData.authors || [],
        director: docData.director || { firstName: "", lastName: "" },
        durationYears: docData.durationYears?.toString() || "1",
        counterparts: docData.counterparts || [""],
        objetivosEspecificos: docData.objetivosEspecificos || ["", "", ""],
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
      if (docData.fileUrl && docData.fileUrl !== "#") setFileName("Documento actual");
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
    if (!fileDataUri && !docData?.fileUrl) return toast({ variant: "destructive", title: "Archivo requerido" });
    setIsSummarizing(true);
    try {
      const result = await summarizeDocument({
        documentMediaUri: fileDataUri || docData?.fileUrl,
        documentContent: formData.title
      });
      if (result?.summary) {
        setFormData((prev: any) => ({ ...prev, description: result.summary }));
        toast({ title: "Resumen generado" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error de IA", description: error.message });
    } finally {
      setIsSummarizing(false);
    }
  };

  const formatText = (text: string) => {
    if (!text) return "";
    return text
      .split(' ')
      .filter(Boolean)
      .map(word => {
        if (word.length >= 2 && (word === "UNCA" || word === "FCA" || word === "INTA" || word === "CONICET")) return word;
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
    setIsSaving(true);
    let finalDate = formData.date;
    if (signingDay && signingMonth && signingYearSelect) {
      const monthIdx = MONTHS.indexOf(signingMonth) + 1;
      finalDate = `${signingYearSelect}-${monthIdx.toString().padStart(2, '0')}-${signingDay.padStart(2, '0')}`;
    }

    const filteredAuthors = formData.authors.filter((a: PersonName) => a.firstName.trim() !== "" || a.lastName.trim() !== "");

    const updateData: any = {
      ...formData,
      title: formatText(formData.title),
      authors: filteredAuthors,
      director: { firstName: formatText(formData.director.firstName), lastName: formatText(formData.director.lastName) },
      date: (formData.type === "Proyecto" && formData.extensionDocType === "Proyecto de Extensión") ? (formData.date || new Date().toISOString()) : finalDate,
      updatedAt: new Date().toISOString(),
      counterparts: Array.isArray(formData.counterparts) ? formData.counterparts.filter((c: string) => c.trim() !== "") : [],
      objetivosEspecificos: hasSpecificObjectives ? formData.objetivosEspecificos.filter((obj: string) => obj.trim() !== "") : [],
      durationYears: parseInt(formData.durationYears) || 1,
      fileUrl: fileDataUri || formData.fileUrl
    };

    updateDocumentNonBlocking(docRef, updateData);
    toast({ title: "Registro actualizado" });
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
  const isExtensionProyecto = isProyecto && formData.extensionDocType === "Proyecto de Extensión";

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0"><SidebarTrigger /></div>
          <div className="flex-1 text-center"><span className="font-headline font-bold text-primary uppercase">Editar Registro</span></div>
          <div className="flex items-center gap-3 shrink-0"><UserMenu /></div>
        </header>

        <main className="p-4 md:p-8 max-w-4xl mx-auto w-full pb-32">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
              <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                <CardTitle className="text-xl font-headline font-bold uppercase text-primary flex items-center gap-3"><Pencil className="w-5 h-5" /> Información General</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Título</Label>
                    <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="h-12 rounded-xl font-bold" />
                  </div>

                  {isExtensionProyecto && (
                    <div className="md:col-span-2 space-y-6">
                      <div className="space-y-4">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2"><User className="w-4 h-4" /> Director del Proyecto</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <Input placeholder="Nombre" className="h-12 rounded-xl font-bold" value={formData.director.firstName} onChange={(e) => setFormData({...formData, director: {...formData.director, firstName: e.target.value}})} />
                          <Input placeholder="Apellido" className="h-12 rounded-xl font-bold" value={formData.director.lastName} onChange={(e) => setFormData({...formData, director: {...formData.director, lastName: e.target.value}})} />
                        </div>
                      </div>
                      <div className="space-y-4 border-t pt-4">
                        <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1 flex items-center gap-2"><Users className="w-4 h-4" /> Equipo Técnico</Label>
                        <div className="space-y-3">
                          {formData.authors.map((member: PersonName, i: number) => (
                            <div key={i} className="grid grid-cols-2 gap-2 relative">
                              <Input placeholder="Nombre" className="h-11 rounded-lg font-medium" value={member.firstName} onChange={(e) => handleTechnicalTeamChange(i, 'firstName', e.target.value)} />
                              <div className="flex gap-2">
                                <Input placeholder="Apellido" className="h-11 rounded-lg font-medium flex-1" value={member.lastName} onChange={(e) => handleTechnicalTeamChange(i, 'lastName', e.target.value)} />
                                <Button type="button" variant="ghost" size="icon" className="h-11 w-11 rounded-lg text-destructive" onClick={() => setFormData({...formData, authors: formData.authors.filter((_: any, idx: number) => idx !== i)})}><X className="w-4 h-4" /></Button>
                              </div>
                            </div>
                          ))}
                          <Button type="button" variant="outline" className="w-full h-10 border-dashed rounded-lg font-black text-[9px] uppercase" onClick={() => setFormData({...formData, authors: [...formData.authors, { firstName: "", lastName: "" }]})}><Plus className="w-3.5 h-3.5 mr-2" /> Añadir integrante</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isConvenio && !isExtensionProyecto && (
                    <div className="md:col-span-2 space-y-4">
                      <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Responsables</Label>
                      {formData.authors.map((member: PersonName, i: number) => (
                        <div key={i} className="grid grid-cols-2 gap-2">
                          <Input placeholder="Nombre" className="h-10 rounded-lg text-xs" value={member.firstName} onChange={(e) => handleTechnicalTeamChange(i, 'firstName', e.target.value)} />
                          <div className="flex gap-2">
                            <Input placeholder="Apellido" className="h-10 rounded-lg text-xs flex-1" value={member.lastName} onChange={(e) => handleTechnicalTeamChange(i, 'lastName', e.target.value)} />
                            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-destructive" onClick={() => setFormData({...formData, authors: formData.authors.filter((_: any, idx: number) => idx !== i)})}><X className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" className="w-full h-9 rounded-lg border-dashed text-[9px] uppercase font-black" onClick={() => setFormData({...formData, authors: [...formData.authors, { firstName: "", lastName: "" }]})}>Añadir responsable</Button>
                    </div>
                  )}

                  {!isExtensionProyecto && (
                    <div className="space-y-2">
                      <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">{isConvenio ? "Fecha de Firma" : "Fecha"}</Label>
                      <div className="grid grid-cols-3 gap-1">
                        <Select value={signingDay} onValueChange={setSigningDay}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                        <Select value={signingMonth} onValueChange={setSigningMonth}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                        <Select value={signingYearSelect} onValueChange={setSigningYearSelect}><SelectTrigger className="h-12 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
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
                                <Input value={obj} onChange={(e) => { const n = [...formData.objetivosEspecificos]; n[i] = e.target.value; setFormData({...formData, objetivosEspecificos: n}); }} className="h-12 rounded-xl font-medium" />
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
                              <Input value={cp} onChange={(e) => { const n = [...formData.counterparts]; n[i] = e.target.value; setFormData({...formData, counterparts: n}); }} className="h-12 rounded-xl font-bold" />
                              <Button type="button" variant="ghost" className="text-destructive h-12 w-12 rounded-xl" onClick={() => setFormData({...formData, counterparts: formData.counterparts.filter((_: any, idx: number) => idx !== i)})}><X className="w-5 h-5" /></Button>
                            </div>
                          ))}
                          <Button type="button" variant="outline" className="rounded-xl text-[10px] font-black uppercase h-10 border-dashed" onClick={() => setFormData({...formData, counterparts: [...formData.counterparts, ""]})}><Plus className="w-4 h-4 mr-2" /> Añadir</Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10"><span className="font-black uppercase text-[10px] text-primary tracking-widest">Renovación Automática</span><Switch checked={formData.hasAutomaticRenewal} onCheckedChange={(v) => setFormData({...formData, hasAutomaticRenewal: v})} /></div>
                        <div className="flex flex-col gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                          <div className="flex items-center justify-between"><span className="font-black uppercase text-[10px] text-primary tracking-widest">Responsable Institucional</span><Switch checked={formData.hasInstitutionalResponsible} onCheckedChange={(v) => setFormData({...formData, hasInstitutionalResponsible: v})} /></div>
                          {formData.hasInstitutionalResponsible && (
                            <div className="animate-in slide-in-from-top-2 space-y-3">
                              <Label className="font-black uppercase text-[9px] text-muted-foreground mb-1 block">Nombres de Responsables</Label>
                              {formData.authors.map((member: PersonName, i: number) => (
                                <div key={i} className="grid grid-cols-2 gap-2">
                                  <Input placeholder="Nombre" className="h-9 rounded-lg text-xs" value={member.firstName} onChange={(e) => handleTechnicalTeamChange(i, 'firstName', e.target.value)} />
                                  <Input placeholder="Apellido" className="h-9 rounded-lg text-xs" value={member.lastName} onChange={(e) => handleTechnicalTeamChange(i, 'lastName', e.target.value)} />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!isConvenio && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2"><Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Código</Label><Input value={formData.projectCode || ""} onChange={(e) => setFormData({...formData, projectCode: e.target.value})} className="h-12 rounded-xl font-bold" /></div>
                      <div className="space-y-2"><Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Período</Label><Input value={formData.executionPeriod || ""} onChange={(e) => setFormData({...formData, executionPeriod: e.target.value})} className="h-12 rounded-xl font-bold" /></div>
                    </div>
                  )}
                </div>

                <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-dashed border-primary/20 space-y-6 mt-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <Button type="button" onClick={() => fileInputRef.current?.click()} className="h-14 px-10 rounded-xl bg-white border-2 border-primary/30 text-primary font-black uppercase text-[11px] tracking-widest hover:bg-primary/5 transition-all shadow-sm">
                      {fileName ? "Cambiar Archivo" : <span className="flex items-center gap-2"><FileUp className="w-5 h-5" /> Subir Archivo</span>}
                    </Button>
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
                      <Button type="button" onClick={handleSummarize} disabled={isSummarizing || (!fileDataUri && !docData?.fileUrl)} className="bg-primary/10 hover:bg-primary/20 text-primary h-8 rounded-lg px-3 text-[9px] font-black uppercase tracking-widest border border-primary/20 transition-all">
                        {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}Generar con IA
                      </Button>
                    </div>
                    <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="min-h-[120px] rounded-xl font-medium bg-white" />
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
