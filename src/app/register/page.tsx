
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Leaf, 
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
  Image as ImageIcon,
  AlertCircle
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
import { useAuth, initiateEmailSignUp } from "@/firebase";
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

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [academicRank, setAcademicRank] = useState("");
  const [department, setDepartment] = useState("");
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // VALIDACIÓN ESTRICTA DE DOMINIO INSTITUCIONAL
    const isInstitutional = email.endsWith('@unca.edu.ar') || email.endsWith('@est.unca.edu.ar');
    if (!isInstitutional) {
      setError("Solo se permiten correos institucionales (@unca.edu.ar o @est.unca.edu.ar).");
      toast({
        variant: "destructive",
        title: "Dominio no permitido",
        description: "Debe usar un correo institucional de la UNCA.",
      });
      return;
    }

    if (!academicRank || !department) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor seleccione su cargo docente y dependencia.",
      });
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
        academicRank,
        department,
        name: fullName
      }));
    }

    try {
      initiateEmailSignUp(auth, email, password);
      
      toast({
        title: "Registro iniciado",
        description: `Creando perfil para ${fullName}...`,
      });

      setTimeout(() => {
        router.push("/");
      }, 2500);
    } catch (error: any) {
      setLoading(false);
      setError("No se pudo crear la cuenta. Verifique sus datos.");
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: "No se pudo crear la cuenta. Intente nuevamente.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary to-background overflow-hidden relative">
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl relative z-10 py-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20 mb-4 hover:scale-105 transition-transform">
            <Leaf className="w-10 h-10 text-primary-foreground" />
          </Link>
          <h1 className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-xl font-headline text-primary uppercase tracking-tighter text-center leading-tight">SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN</h1>
          <p className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-xl font-headline text-black uppercase tracking-tighter text-center mt-1">
            FCA - UNCA
          </p>
        </div>

        <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-1 pt-8 px-8 text-center">
            <CardTitle className="text-2xl font-headline font-bold uppercase tracking-tight">Crear Cuenta Institucional</CardTitle>
            <CardDescription className="font-medium">
              Forme parte del Repositorio Digital de Extensión y Vinculación.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-4 pt-4">
            <form onSubmit={handleRegister} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col items-center justify-center space-y-3 mb-4">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex items-center justify-center bg-white overflow-hidden shadow-inner transition-all group-hover:border-primary/40">
                    <Avatar className="w-full h-full rounded-none">
                      <AvatarImage src={photoUrl} className="object-cover" />
                      <AvatarFallback className="bg-transparent">
                        <UserRound className="w-16 h-16 text-primary/20" strokeWidth={1.2} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-6 h-6 text-white mb-1" />
                      <span className="text-[8px] text-white font-black uppercase tracking-widest">Subir Foto</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">subir foto de perfil</Label>
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
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                    <Input 
                      id="firstName" 
                      type="text" 
                      placeholder="Juan" 
                      className="pl-11 h-12 rounded-xl border-muted-foreground/20 focus:ring-primary/10 bg-white/50 font-bold"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Apellido</Label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                    <Input 
                      id="lastName" 
                      type="text" 
                      placeholder="Pérez" 
                      className="pl-11 h-12 rounded-xl border-muted-foreground/20 focus:ring-primary/10 bg-white/50 font-bold"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargo Docente</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 z-10" />
                    <Select value={academicRank} onValueChange={setAcademicRank}>
                      <SelectTrigger className="pl-11 h-12 rounded-xl border-muted-foreground/20 bg-white/50 font-bold">
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
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dependencia</Label>
                  <div className="relative">
                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 z-10" />
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger className="pl-11 h-12 rounded-xl border-muted-foreground/20 bg-white/50 font-bold">
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

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Correo Institucional</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="usuario@unca.edu.ar" 
                    className="pl-11 h-12 rounded-xl border-muted-foreground/20 focus:ring-primary/10 bg-white/50 font-bold"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contraseña</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Mínimo 6 caracteres" 
                    className="pl-11 h-12 rounded-xl border-muted-foreground/20 focus:ring-primary/10 bg-white/50 font-bold"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">Registrarse <ArrowRight className="w-4 h-4" /></span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 px-8 pb-8 pt-2">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
            <div className="text-center space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-tight">¿Ya tiene una cuenta?</p>
              <Button asChild variant="ghost" className="w-full h-11 rounded-xl text-primary font-black uppercase tracking-widest text-[10px] hover:bg-primary/5">
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" /> Volver al ingreso
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
