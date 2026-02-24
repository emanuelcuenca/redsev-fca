
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { 
  Save, 
  ArrowLeft,
  Loader2,
  Pencil,
  X,
  Plus
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
    counterparts: [""],
    convenioSubType: "Marco",
    convenioCategory: "",
    hasInstitutionalResponsible: false,
    beneficiaryName: "",
    programName: "",
    convocatoria: "",
    destinationInstitution: "",
    projectCode: "",
    objetivoGeneral: "",
    extensionDocType: "",
    executionPeriod: ""
  });

  const [signingDay, setSigningDay] = useState("");
  const [signingMonth, setSigningMonth] = useState("");
  const [signingYearSelect, setSigningYearSelect] = useState("");

  useEffect(() => {
    if (docData) {
      const isConvenio = docData.type === "Convenio";
      setFormData({
        ...docData,
        authors: docData.authors?.join(", ") || "",
        durationYears: docData.durationYears?.toString() || "1",
        counterparts: docData.counterparts || (docData.counterpart ? [docData.counterpart] : [""])
      });

      if (isConvenio && docData.date) {
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
        if (word.length >= 2 && word.length <= 5 && word === word.toUpperCase()) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docRef) return;

    setIsSaving(true);
    
    let finalDate = formData.date;
    if (formData.type === "Convenio" && signingDay && signingMonth && signingYearSelect) {
      const monthIdx = MONTHS.indexOf(signingMonth) + 1;
      finalDate = `${signingYearSelect}-${monthIdx.toString().padStart(2, '0')}-${signingDay.padStart(2, '0')}`;
    }

    const authorsArr = typeof formData.authors === 'string' 
      ? formData.authors.split(',').map((a: string) => a.trim()).filter(Boolean)
      : formData.authors;

    const filteredCounterparts = Array.isArray(formData.counterparts) ? formData.counterparts.filter((c: string) => c.trim() !== "") : [];

    const updateData: any = {
      ...formData,
      title: formatTitle(formData.title),
      authors: authorsArr,
      date: finalDate,
      updatedAt: new Date().toISOString(),
      counterparts: filteredCounterparts,
      counterpart: filteredCounterparts.join(", "),
      durationYears: parseInt(formData.durationYears) || 1
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

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0"><SidebarTrigger /></div>
          <div className="flex-1 flex justify-center text-center">
            <span className="text-[12px] md:text-xl font-headline text-primary uppercase font-bold">Editar Registro</span>
          </div>
          <div className="flex items-center gap-3 shrink-0"><UserMenu /></div>
        </header>

        <main className="p-4 md:p-8 max-w-4xl mx-auto w-full pb-32">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Título</Label>
                    <Input 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="h-12 rounded-xl font-bold"
                    />
                  </div>

                  {isConvenio && (
                    <>
                      <div className="md:col-span-2 space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Contrapartes</Label>
                        <div className="space-y-3">
                          {formData.counterparts?.map((cp: string, i: number) => (
                            <div key={i} className="flex gap-2">
                              <Input 
                                value={cp}
                                onChange={(e) => {
                                  const newCp = [...formData.counterparts];
                                  newCp[i] = e.target.value;
                                  setFormData({...formData, counterparts: newCp});
                                }}
                                className="h-12 rounded-xl font-bold"
                              />
                              <Button 
                                type="button" 
                                variant="ghost" 
                                className="text-destructive"
                                onClick={() => setFormData({...formData, counterparts: formData.counterparts.filter((_: any, idx: number) => idx !== i)})}
                              ><X className="w-5 h-5" /></Button>
                            </div>
                          ))}
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="rounded-xl text-[10px] font-black uppercase"
                            onClick={() => setFormData({...formData, counterparts: [...formData.counterparts, ""]})}
                          ><Plus className="w-4 h-4 mr-2" /> Agregar</Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Fecha de Firma</Label>
                        <div className="grid grid-cols-3 gap-1">
                          <Select value={signingDay} onValueChange={setSigningDay}><SelectTrigger className="h-12 rounded-xl font-bold text-xs"><SelectValue /></SelectTrigger><SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                          <Select value={signingMonth} onValueChange={setSigningMonth}><SelectTrigger className="h-12 rounded-xl font-bold text-xs"><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                          <Select value={signingYearSelect} onValueChange={setSigningYearSelect}><SelectTrigger className="h-12 rounded-xl font-bold text-xs"><SelectValue /></SelectTrigger><SelectContent>{YEARS_LIST.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Duración (Años)</Label>
                        <Input type="number" className="h-12 rounded-xl font-bold" value={formData.durationYears} onChange={(e) => setFormData({...formData, durationYears: e.target.value})} />
                      </div>
                      <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                          <span className="font-black uppercase text-[10px] text-primary tracking-widest">Renovación Automática</span>
                          <Switch checked={formData.hasAutomaticRenewal} onCheckedChange={(v) => setFormData({...formData, hasAutomaticRenewal: v})} />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                          <span className="font-black uppercase text-[10px] text-primary tracking-widest">Responsable Institucional</span>
                          <Switch checked={formData.hasInstitutionalResponsible} onCheckedChange={(v) => setFormData({...formData, hasInstitutionalResponsible: v})} />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {!isConvenio && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Responsables (sep. por coma)</Label>
                        <Input value={formData.authors} onChange={(e) => setFormData({...formData, authors: e.target.value})} className="h-12 rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Período / Referencia</Label>
                        <Input value={formData.executionPeriod || formData.programName || ""} onChange={(e) => setFormData({...formData, executionPeriod: e.target.value})} className="h-12 rounded-xl font-bold" />
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-8 border-t border-dashed flex items-center justify-between gap-4">
                  <Button type="button" variant="ghost" className="font-bold text-[10px] uppercase" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-2" /> Cancelar</Button>
                  <Button className="h-14 px-10 rounded-xl bg-primary font-black uppercase text-[11px]" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2"><Save className="w-5 h-5" /> Guardar</span>}
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
