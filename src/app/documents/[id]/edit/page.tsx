
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
  Plus,
  X
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
    counterparts: [""],
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
        associatedConvenioYear: docData.associatedConvenioYear?.toString() || new Date().getFullYear().toString(),
        counterparts: docData.counterparts || [docData.counterpart || ""]
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
        if (word.length > 1 && word === word.toUpperCase()) {
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
    
    const authorsArr = typeof formData.authors === 'string' 
      ? formData.authors.split(',').map((a: string) => a.trim()).filter(Boolean)
      : formData.authors;
    
    let finalDate = formData.date;
    if (formData.type === "Convenio" && signingDay && signingMonth && signingYearSelect) {
      const monthIdx = MONTHS.indexOf(signingMonth) + 1;
      finalDate = `${signingYearSelect}-${monthIdx.toString().padStart(2, '0')}-${signingDay.padStart(2, '0')}`;
    }

    const formattedTitle = formatTitle(formData.title);
    const filteredCounterparts = formData.counterparts.filter((c: string) => c.trim() !== "");

    const updateData: any = {
      ...formData,
      title: formattedTitle,
      authors: authorsArr,
      date: finalDate,
      updatedAt: new Date().toISOString(),
      counterparts: filteredCounterparts,
      counterpart: filteredCounterparts.join(", "),
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
                    <div className="md:col-span-2 space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Instituciones Contrapartes</Label>
                      <div className="space-y-3">
                        {formData.counterparts.map((cp: string, i: number) => (
                          <div key={i} className="flex gap-2">
                            <Input 
                              value={cp}
                              onChange={(e) => {
                                const newCp = [...formData.counterparts];
                                newCp[i] = e.target.value;
                                setFormData({...formData, counterparts: newCp});
                              }}
                              className="h-12 rounded-xl border-muted-foreground/20 font-bold"
                            />
                            {formData.counterparts.length > 1 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-12 w-12 text-destructive"
                                onClick={() => setFormData({...formData, counterparts: formData.counterparts.filter((_: any, idx: number) => idx !== i)})}
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
                          onClick={() => setFormData({...formData, counterparts: [...formData.counterparts, ""]})}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Agregar Contraparte
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Resto de campos (simplificados)... */}
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
