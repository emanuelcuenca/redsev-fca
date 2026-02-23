
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
  Mail,
  Lock,
  Camera,
  UserCircle,
  ShieldAlert,
  UserRound
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { updateEmail, EmailAuthProvider, reauthenticateWithCredential, updateProfile } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

const DEPARTMENTS = [
  "Cs. Agrarias",
  "Cs. de la Salud",
  "Cs. Económicas y de Adm.",
  "Cs. Exactas y Naturales",
  "Derecho",
  "Esc. de Arqueología",
  "Humanidades",
  "Tecnología y Cs. Aplicadas"
].sort();

export default function ProfilePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(db, 'users', user.uid) : null, 
    [db, user]
  );
  
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const adminCheckRef = useMemoFirebase(() => 
    user ? doc(db, 'roles_admin', user.uid) : null, 
    [db, user]
  );
  const { data: adminDoc } = useDoc(adminCheckRef);
  const isAdmin = !!adminDoc;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    academicRank: "",
    department: "",
    email: "",
    photoUrl: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        academicRank: profile.academicRank || "",
        department: profile.department || "",
        email: profile.email || user?.email || "",
        photoUrl: profile.photoUrl || user?.photoURL || ""
      });
    }
  }, [profile, user]);

  const handleSave = async () => {
    if (!user || !userProfileRef) return;
    
    setIsSaving(true);
    
    try {
      if (formData.email !== user.email && isAdmin) {
        if (!currentPassword) {
          toast({
            variant: "destructive",
            title: "Contraseña requerida",
            description: "Debe ingresar su contraseña actual para cambiar el correo electrónico.",
          });
          setIsSaving(false);
          return;
        }

        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updateEmail(user, formData.email);
      }

      const fullName = `${formData.firstName} ${formData.lastName}`;
      if (isAdmin) {
        await updateProfile(user, {
          displayName: fullName,
          photoURL: formData.photoUrl
        });
      } else {
        await updateProfile(user, {
          photoURL: formData.photoUrl
        });
      }

      updateDocumentNonBlocking(userProfileRef, {
        ...formData,
        name: fullName,
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Perfil actualizado",
        description: "Tus datos han sido guardados correctamente. Redirigiendo...",
      });

      setTimeout(() => {
        router.push("/");
      }, 1500);

    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: error.message || "No se pudieron guardar los cambios.",
      });
      setIsSaving(false);
    }
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
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Gestión de identidad y datos institucionales</p>
            </div>
          </div>

          {!isAdmin && (
            <div className="mb-6 p-4 bg-muted/50 rounded-2xl flex items-center gap-3 border border-dashed border-muted-foreground/20 animate-in fade-in duration-700">
              <ShieldAlert className="w-5 h-5 text-muted-foreground" />
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">
                Los campos de nombre y correo están protegidos. Contacte a un administrador para realizar cambios en estos datos.
              </p>
            </div>
          )}

          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm mb-8">
            <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
              <CardTitle className="text-xl font-headline font-bold uppercase text-primary">Información Profesional</CardTitle>
              <CardDescription className="font-medium text-muted-foreground">
                Gestione sus datos de acceso y su cargo dentro de la facultad.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Sección de Foto de Perfil con esquema de cabeza */}
              <div className="flex flex-col items-center justify-center mb-8 pb-8 border-b border-dashed">
                <div className="relative group cursor-pointer mb-4">
                  <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center bg-secondary overflow-hidden shadow-inner transition-all group-hover:border-primary/40">
                    <Avatar className="w-full h-full rounded-none">
                      <AvatarImage src={formData.photoUrl} className="object-cover" />
                      <AvatarFallback className="bg-transparent">
                        <UserRound className="w-16 h-16 text-primary/30" strokeWidth={1.5} />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>
                <div className="w-full max-w-sm space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex justify-center">Foto de Perfil (Enlace / URL)</Label>
                  <Input 
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({...formData, photoUrl: e.target.value})}
                    placeholder="Pegue aquí el enlace de su imagen..."
                    className="h-10 rounded-xl bg-white border-muted-foreground/20 text-center text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre</Label>
                  <Input 
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    placeholder="Su nombre"
                    className="h-12 rounded-xl bg-white border-muted-foreground/20 font-bold disabled:opacity-70 disabled:bg-muted/30"
                    disabled={!isAdmin}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Apellido</Label>
                  <Input 
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    placeholder="Su apellido"
                    className="h-12 rounded-xl bg-white border-muted-foreground/20 font-bold disabled:opacity-70 disabled:bg-muted/30"
                    disabled={!isAdmin}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Correo Institucional</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 z-10" />
                    <Input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="usuario@unca.edu.ar"
                      className="pl-11 h-12 rounded-xl bg-white border-muted-foreground/20 font-bold disabled:opacity-70 disabled:bg-muted/30"
                      disabled={!isAdmin}
                    />
                  </div>
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
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Dependencia Académica</Label>
                  <div className="relative">
                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 z-10" />
                    <Select value={formData.department} onValueChange={(v) => setFormData({...formData, department: v})}>
                      <SelectTrigger className="pl-11 h-12 rounded-xl bg-white border-muted-foreground/20 font-bold">
                        <SelectValue placeholder="Seleccione dependencia" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map(dept => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {isAdmin && formData.email !== user?.email && (
                <div className="p-6 bg-accent/5 border-2 border-accent/20 rounded-2xl animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Lock className="w-5 h-5 text-accent" />
                    <h4 className="font-headline font-bold text-accent-foreground uppercase text-sm tracking-tight">Confirmación de Seguridad</h4>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium mb-4">
                    Para cambiar su correo electrónico, por favor ingrese su contraseña actual.
                  </p>
                  <Input 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Contraseña actual"
                    className="h-12 rounded-xl bg-white border-accent/20 font-bold"
                  />
                </div>
              )}

              <div className="pt-6 border-t border-dashed flex items-center justify-between gap-4">
                <Button variant="ghost" className="rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => router.push("/")}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                </Button>
                <Button 
                  className="h-14 px-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-[11px]"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2"><Save className="w-5 h-5" /> Guardar y Finalizar</span>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
