
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Briefcase, 
  Landmark, 
  Save, 
  Loader2, 
  ArrowLeft,
  ShieldCheck,
  UserCircle
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(db, 'users', user.uid) : null, 
    [db, user]
  );
  
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    academicRank: "",
    department: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        academicRank: profile.academicRank || "",
        department: profile.department || ""
      });
    }
  }, [profile]);

  const handleSave = () => {
    if (!user || !userProfileRef) return;
    
    setIsSaving(true);
    
    const fullName = `${formData.firstName} ${formData.lastName}`;
    
    updateDocumentNonBlocking(userProfileRef, {
      ...formData,
      name: fullName,
      updatedAt: new Date().toISOString()
    });

    toast({
      title: "Perfil actualizado",
      description: "Tus datos institucionales han sido guardados correctamente.",
    });
    
    setIsSaving(false);
  };

  if (!mounted || isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

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
              <span className="text-[11px] md:text-2xl font-headline text-primary uppercase tracking-tighter font-normal whitespace-nowrap">
                SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN
              </span>
              <span className="text-[11px] md:text-2xl font-headline text-black uppercase tracking-tighter font-normal whitespace-nowrap">
                FCA - UNCA
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <UserMenu />
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <UserCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-headline font-bold tracking-tight uppercase">Relación Laboral</h2>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Gestión de datos institucionales</p>
            </div>
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
            <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
              <CardTitle className="text-xl font-headline font-bold uppercase text-primary">Información del Docente</CardTitle>
              <CardDescription className="font-medium text-muted-foreground">
                Actualice su cargo y dependencia académica para la correcta asignación en el repositorio.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre</Label>
                  <Input 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Su nombre"
                    className="h-12 rounded-xl bg-white border-muted-foreground/20 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Apellido</Label>
                  <Input 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Su apellido"
                    className="h-12 rounded-xl bg-white border-muted-foreground/20 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cargo Docente</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 z-10" />
                    <Select value={formData.academicRank} onValueChange={(v) => setFormData({...formData, academicRank: v})}>
                      <SelectTrigger className="pl-11 h-12 rounded-xl bg-white border-muted-foreground/20 font-bold">
                        <SelectValue placeholder="Seleccione cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Auxiliar">Auxiliar</SelectItem>
                        <SelectItem value="JTP">JTP</SelectItem>
                        <SelectItem value="Adjunto">Adjunto</SelectItem>
                        <SelectItem value="Asociado">Asociado</SelectItem>
                        <SelectItem value="Titular">Titular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Dependencia Académica</Label>
                  <div className="relative">
                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 z-10" />
                    <Select value={formData.department} onValueChange={(v) => setFormData({...formData, department: v})}>
                      <SelectTrigger className="pl-11 h-12 rounded-xl bg-white border-muted-foreground/20 font-bold">
                        <SelectValue placeholder="Seleccione dependencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tecnología y Cs. Aplicadas">Tecnología y Cs. Aplicadas</SelectItem>
                        <SelectItem value="Cs. Exactas y Naturales">Cs. Exactas y Naturales</SelectItem>
                        <SelectItem value="Cs. Agrarias">Cs. Agrarias</SelectItem>
                        <SelectItem value="Cs. Económicas y de Adm.">Cs. Económicas y de Adm.</SelectItem>
                        <SelectItem value="Cs. de la Salud">Cs. de la Salud</SelectItem>
                        <SelectItem value="Derecho">Derecho</SelectItem>
                        <SelectItem value="Humanidades">Humanidades</SelectItem>
                        <SelectItem value="Esc. de Arqueología">Esc. de Arqueología</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-dashed flex items-center justify-between gap-4">
                <Button variant="ghost" className="rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                </Button>
                <Button 
                  className="h-14 px-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-[11px]"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2"><Save className="w-5 h-5" /> Guardar Cambios</span>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
