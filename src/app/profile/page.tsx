
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  UserCircle, 
  Save, 
  Loader2, 
  ArrowLeft,
  Camera,
  UserRound,
  ShieldAlert
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const CARRERAS = [
  "Ingeniería Agronómica",
  "Ingeniería de Paisajes",
  "Ingeniería de Alimentos",
  "Tecnicatura Univ. de Paisajes",
  "Tecnicatura Univ. en Parques y Jardines",
  "Tecnicatura Univ. en Prod. Vegetal",
  "Tecnicatura Univ. en Prod. Animal"
].sort();

const compressImage = (file: File, maxWidth: number = 400, maxHeight: number = 400): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      };
    };
  });
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [isCompresing, setIsCompresing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    claustro: "",
    academicRank: "",
    department: "",
    carrera: "",
    profession: "",
    email: "",
    photoUrl: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        claustro: profile.claustro || "",
        academicRank: profile.academicRank || "",
        department: profile.department || "",
        carrera: profile.carrera || "",
        profession: profile.profession || "",
        email: profile.email || user?.email || "",
        photoUrl: profile.photoUrl || user?.photoURL || ""
      });
    }
  }, [profile, user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompresing(true);
      try {
        const compressedBase64 = await compressImage(file);
        setFormData(prev => ({ ...prev, photoUrl: compressedBase64 }));
      } catch (err) {
        toast({ variant: "destructive", title: "Error al procesar imagen" });
      } finally {
        setIsCompresing(false);
      }
    }
  };

  const handleSave = async () => {
    if (!user || !userProfileRef) return;
    setIsSaving(true);
    try {
      if (formData.email !== user.email && isAdmin) {
        if (!currentPassword) {
          toast({ variant: "destructive", title: "Contraseña requerida", description: "Debe ingresar su contraseña para cambiar el correo." });
          setIsSaving(false);
          return;
        }
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updateEmail(user, formData.email);
      }
      const fullName = `${formData.firstName} ${formData.lastName}`;
      await updateProfile(user, { displayName: isAdmin ? fullName : user.displayName });
      updateDocumentNonBlocking(userProfileRef, { ...formData, name: fullName, updatedAt: new Date().toISOString() });
      toast({ title: "Perfil actualizado" });
      setTimeout(() => router.push("/"), 1500);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al actualizar", description: error.message });
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

  const isDocente = formData.claustro === "Docente";
  const isNoDocente = formData.claustro === "No docente";
  const isEstudiante = formData.claustro === "Estudiante";
  const isEgresado = formData.claustro === "Egresado";

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
            <div className="bg-primary/10 p-2.5 rounded-xl"><UserCircle className="w-6 h-6 text-primary" /></div>
            <div>
              <h2 className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight">Mi Perfil</h2>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{formData.claustro || "Usuario FCA"}</p>
            </div>
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm mb-8">
            <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
              <CardTitle className="text-xl font-headline font-bold uppercase text-primary">Información Profesional</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex flex-col items-center justify-center mb-8 pb-8 border-b border-dashed">
                <div className="relative group cursor-pointer mb-4" onClick={() => !isCompresing && fileInputRef.current?.click()}>
                  <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center bg-secondary overflow-hidden shadow-inner transition-all group-hover:border-primary/40">
                    {isCompresing ? (
                      <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                    ) : (
                      <Avatar className="w-full h-full rounded-none">
                        <AvatarImage src={formData.photoUrl} className="object-cover" />
                        <AvatarFallback><UserRound className="w-16 h-16 text-primary/20" strokeWidth={1.2} /></AvatarFallback>
                      </Avatar>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] text-white font-black uppercase">Cambiar Foto</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white"><Camera className="w-4 h-4" /></div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Nombre</Label>
                  <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="h-12 rounded-xl bg-white font-bold" disabled={!isAdmin} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Apellido</Label>
                  <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="h-12 rounded-xl bg-white font-bold" disabled={!isAdmin} />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Correo Institucional</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12 rounded-xl bg-white font-bold" disabled={!isAdmin} />
                </div>

                {isDocente && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Cargo Docente</Label>
                      <Select value={formData.academicRank} onValueChange={(v) => setFormData({...formData, academicRank: v})}>
                        <SelectTrigger className="h-12 rounded-xl bg-white font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Auxiliar", "JTP", "Prof. Adjunto", "Prof. Asociado", "Prof. Titular"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Dependencia</Label>
                      <Select value={formData.department} onValueChange={(v) => setFormData({...formData, department: v})}>
                        <SelectTrigger className="h-12 rounded-xl bg-white font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {isNoDocente && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Dependencia</Label>
                    <Select value={formData.department} onValueChange={(v) => setFormData({...formData, department: v})}>
                      <SelectTrigger className="h-12 rounded-xl bg-white font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>{DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}

                {isEstudiante && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Facultad</Label>
                      <Select value={formData.department} onValueChange={(v) => setFormData({...formData, department: v})}>
                        <SelectTrigger className="h-12 rounded-xl bg-white font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>{DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Carrera</Label>
                      <Select value={formData.carrera} onValueChange={(v) => setFormData({...formData, carrera: v})}>
                        <SelectTrigger className="h-12 rounded-xl bg-white font-bold"><SelectValue placeholder="Seleccione carrera" /></SelectTrigger>
                        <SelectContent>
                          {CARRERAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {isEgresado && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Profesión</Label>
                    <Input value={formData.profession} onChange={(e) => setFormData({...formData, profession: e.target.value})} className="h-12 rounded-xl bg-white font-bold" />
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-dashed flex flex-col md:flex-row items-center justify-between gap-4">
                <Button variant="ghost" className="rounded-xl font-bold uppercase tracking-widest text-[10px]" onClick={() => router.push("/")}><ArrowLeft className="w-4 h-4 mr-2" /> Volver</Button>
                <Button className="h-14 px-10 rounded-xl bg-primary font-black uppercase tracking-widest text-[11px]" onClick={handleSave} disabled={isSaving || isCompresing}>
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar Cambios"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
