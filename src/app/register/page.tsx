"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Mail, 
  Lock, 
  Loader2, 
  ArrowRight, 
  User, 
  LogIn, 
  Camera, 
  Briefcase, 
  Landmark,
  UserRound,
  ImageIcon,
  AlertCircle,
  GraduationCap,
  BookOpen,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { toast } from "@/hooks/use-toast";

const CLAUSTROS = ["Docente", "Egresado", "Estudiante", "No docente"];

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

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [isCompresing, setIsCompresing] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [claustro, setClaustro] = useState("");
  const [academicRank, setAcademicRank] = useState("");
  const [department, setDepartment] = useState("");
  const [carrera, setCarrera] = useState("");
  const [profession, setProfession] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  const auth = useAuth();

  const formatName = (text: string) => {
    return text
      .toLowerCase()
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompresing(true);
      try {
        const compressed = await compressImage(file);
        setPhotoUrl(compressed);
      } catch (err) {
        toast({ variant: "destructive", title: "Error al cargar imagen" });
      } finally {
        setIsCompresing(false);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const cleanEmail = email.trim().toLowerCase();
    const isInstitutional = cleanEmail.endsWith('@unca.edu.ar') || cleanEmail.endsWith('@agrarias.unca.edu.ar');
    
    if (!isInstitutional) {
      const msg = "Solo se permiten correos institucionales de la UNCA (@unca.edu.ar o @agrarias.unca.edu.ar).";
      setError(msg);
      toast({
        variant: "destructive",
        title: "Dominio no institucional",
        description: msg,
      });
      return;
    }

    if (!claustro) {
      toast({ variant: "destructive", title: "Debe seleccionar su claustro" });
      return;
    }

    setLoading(true);
    
    const formattedFirstName = formatName(firstName);
    const formattedLastName = formatName(lastName);
    const fullName = `${formattedFirstName} ${formattedLastName}`;

    if (typeof window !== 'undefined') {
      localStorage.setItem('pending_profile_data', JSON.stringify({
        firstName: formattedFirstName,
        lastName: formattedLastName,
        photoUrl,
        claustro,
        academicRank: claustro === 'Docente' ? academicRank : "",
        department: (claustro === 'Docente' || claustro === 'No docente' || claustro === 'Estudiante') ? department : "",
        carrera: claustro === 'Estudiante' ? carrera : "",
        profession: claustro === 'Egresado' ? profession : "",
        name: fullName
      }));
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      
      // Establecer idioma a Español para que el mensaje llegue como "Validar correo electrónico"
      auth.languageCode = 'es';
      
      // Enviar correo de verificación
      await sendEmailVerification(userCredential.user);
      
      toast({
        title: "Cuenta creada",
        description: "Verifique su correo para activar el acceso.",
      });
      
      setVerificationSent(true);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      let message = "No se pudo crear la cuenta. Intente nuevamente.";
      if (error.code === 'auth/email-already-in-use') message = "El correo ya está registrado.";
      if (error.code === 'auth/weak-password') message = "La contraseña es muy débil.";
      
      setError(message);
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: message,
      });
    }
  };

  return (
    <div className="min-h-[100svh] w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-background relative overflow-x-hidden py-10 md:py-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="bg-primary w-16 h-16 rounded-none shadow-lg shadow-primary/20 mb-4 hover:scale-105 transition-transform flex items-center justify-center">
            <span className="text-2xl font-black text-primary-foreground tracking-tighter">SEV</span>
          </Link>
          <h1 className="text-sm md:text-xl font-headline text-primary uppercase tracking-tighter font-normal text-center leading-tight">SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN</h1>
          <p className="text-sm md:text-xl font-headline text-black uppercase tracking-tighter font-normal text-center mt-1">
            FCA - UNCA
          </p>
        </div>

        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm rounded-[2.5rem] overflow-hidden w-full">
          {verificationSent ? (
            <CardContent className="px-8 pb-12 pt-12 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/20">
                <Mail className="w-12 h-12 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-headline font-bold uppercase tracking-tight text-primary">Validar correo electrónico</h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">REDSEV FCA</p>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Hemos enviado un enlace de confirmación a: <br />
                  <span className="font-bold text-foreground text-base">{email}</span>
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl text-left shadow-sm">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[11px] text-amber-900 font-black uppercase tracking-tight">Acción Requerida</p>
                    <p className="text-xs text-amber-800 font-medium leading-snug">
                      Debe hacer clic en el enlace del correo para activar su cuenta. Si no lo ve en su bandeja de entrada, revise la carpeta de <span className="font-bold">Spam</span>.
                    </p>
                  </div>
                </div>
              </div>
              <Button asChild className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-widest bg-primary hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">
                <Link href="/login">Volver al Ingreso <LogIn className="w-4 h-4 ml-2" /></Link>
              </Button>
            </CardContent>
          ) : (
            <>
              <CardHeader className="space-y-1 pt-8 px-8 text-center">
                <CardTitle className="text-2xl font-headline font-bold uppercase tracking-tight">Crear cuenta</CardTitle>
                <CardDescription className="font-medium">
                  Forme parte del Repositorio Digital de Extensión y Vinculación.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-4 pt-4">
                <form onSubmit={handleRegister} className="space-y-6">
                  {error && (
                    <Alert variant="destructive" className="rounded-xl">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error de Registro</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col items-center justify-center space-y-3 mb-4">
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => !isCompresing && fileInputRef.current?.click()}
                    >
                      <div className="w-28 h-28 rounded-full border-4 border-primary/20 flex items-center justify-center bg-white overflow-hidden shadow-inner transition-all group-hover:border-primary/40">
                        {isCompresing ? (
                          <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                        ) : (
                          <Avatar className="w-full h-full rounded-none">
                            <AvatarImage src={photoUrl} className="object-cover" />
                            <AvatarFallback className="bg-transparent">
                              <UserRound className="w-14 h-14 text-primary/20" strokeWidth={1.2} />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="w-6 h-6 text-white mb-1" />
                          <span className="text-[8px] text-white font-black uppercase tracking-widest">Subir Foto</span>
                        </div>
                      </div>
                      <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white">
                        <Camera className="w-4 h-4" />
                      </div>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre</Label>
                      <Input id="firstName" placeholder="Juan" className="h-12 rounded-xl bg-white/50 font-bold" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Apellido</Label>
                      <Input id="lastName" placeholder="Pérez" className="h-12 rounded-xl bg-white/50 font-bold" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Claustro</Label>
                    <Select value={claustro} onValueChange={setClaustro}>
                      <SelectTrigger className="h-12 rounded-xl bg-white/50 font-bold">
                        <SelectValue placeholder="Seleccione su claustro" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLAUSTROS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {claustro === "Docente" && (
                      <>
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargo Docente</Label>
                          <Select value={academicRank} onValueChange={setAcademicRank}>
                            <SelectTrigger className="h-12 rounded-xl bg-white/50 font-bold">
                              <SelectValue placeholder="Seleccione cargo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Auxiliar">Auxiliar</SelectItem>
                              <SelectItem value="JTP">JTP</SelectItem>
                              <SelectItem value="Prof. Adjunto">Prof. Adjunto</SelectItem>
                              <SelectItem value="Prof. Asociado">Prof. Asociado</SelectItem>
                              <SelectItem value="Prof. Titular">Prof. Titular</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dependencia</Label>
                          <Select value={department} onValueChange={setDepartment}>
                            <SelectTrigger className="h-12 rounded-xl bg-white/50 font-bold">
                              <SelectValue placeholder="Seleccione dependencia" />
                            </SelectTrigger>
                            <SelectContent>
                              {DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {claustro === "No docente" && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dependencia</Label>
                        <Select value={department} onValueChange={setDepartment}>
                          <SelectTrigger className="h-12 rounded-xl bg-white/50 font-bold">
                            <SelectValue placeholder="Seleccione dependencia" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {claustro === "Estudiante" && (
                      <>
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Facultad</Label>
                          <Select value={department} onValueChange={setDepartment}>
                            <SelectTrigger className="h-12 rounded-xl bg-white/50 font-bold">
                              <SelectValue placeholder="Seleccione facultad" />
                            </SelectTrigger>
                            <SelectContent>
                              {DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Carrera</Label>
                          <Select value={carrera} onValueChange={setCarrera}>
                            <SelectTrigger className="h-12 rounded-xl bg-white/50 font-bold">
                              <SelectValue placeholder="Seleccione su carrera" />
                            </SelectTrigger>
                            <SelectContent>
                              {CARRERAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {claustro === "Egresado" && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Profesión</Label>
                        <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                          <Input placeholder="Su título profesional" className="pl-11 h-12 rounded-xl bg-white/50 font-bold" required value={profession} onChange={(e) => setProfession(e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Correo Institucional</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                      <Input id="email" type="email" placeholder="usuario@unca.edu.ar" className="pl-11 h-12 rounded-xl bg-white/50 font-bold" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" title="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contraseña</Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                      <Input id="password" type="password" placeholder="Mínimo 6 caracteres" className="pl-11 h-12 rounded-xl bg-white/50 font-bold" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest bg-primary shadow-lg shadow-primary/20 mt-2" disabled={loading || isCompresing}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="flex items-center gap-2">Registrarse <ArrowRight className="w-4 h-4" /></span>}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 px-8 pb-8 pt-2">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
                <div className="text-center space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">¿Ya tiene una cuenta?</p>
                  <Button asChild variant="ghost" className="w-full h-11 rounded-xl text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/5">
                    <Link href="/login"><LogIn className="w-4 h-4 ml-2" /> Volver al ingreso</Link>
                  </Button>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
