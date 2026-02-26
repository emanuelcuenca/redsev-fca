
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  FileUser, 
  UploadCloud, 
  Loader2, 
  ArrowLeft,
  FileText,
  Trash2,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

export default function CVUploadPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fileDataUri, setFileDataUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(db, 'users', user.uid) : null, 
    [db, user]
  );
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (profile?.cvName) {
      setFileName(profile.cvName);
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({ variant: "destructive", title: "Formato no válido", description: "Solo se permiten archivos PDF." });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Archivo demasiado grande", description: "El CV no debe superar los 5MB." });
        return;
      }

      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setFileDataUri(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user || !userProfileRef || !fileDataUri) return;
    
    setIsSaving(true);
    try {
      updateDocumentNonBlocking(userProfileRef, { 
        cvUrl: fileDataUri, 
        cvName: fileName,
        updatedAt: new Date().toISOString() 
      });
      toast({ title: "CV Actualizado", description: "Su currículum ha sido guardado correctamente." });
      setFileDataUri(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error al guardar", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!userProfileRef) return;
    if (confirm("¿Está seguro de eliminar su CV del sistema?")) {
      updateDocumentNonBlocking(userProfileRef, { 
        cvUrl: null, 
        cvName: null,
        updatedAt: new Date().toISOString() 
      });
      setFileName(null);
      setFileDataUri(null);
      toast({ title: "CV Eliminado" });
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
          <div className="flex items-center gap-2 md:gap-4 shrink-0"><SidebarTrigger /></div>
          <div className="flex-1 flex justify-center overflow-hidden px-2">
            <div className="flex flex-col items-center leading-none text-center gap-1 w-full">
              <span className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-2xl font-headline text-primary uppercase tracking-tighter font-normal whitespace-nowrap">SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN</span>
              <span className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-2xl font-headline text-black uppercase tracking-tighter font-normal whitespace-nowrap">FCA - UNCA</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0"><UserMenu /></div>
        </header>

        <main className="p-4 md:p-8 max-w-3xl mx-auto w-full pb-32">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary/10 p-2.5 rounded-xl"><FileUser className="w-6 h-6 text-primary" /></div>
            <div>
              <h2 className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight">Mi Currículum Vitae</h2>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Documentación para el Banco de Extensionistas</p>
            </div>
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white mb-8">
            <CardHeader className="bg-primary/5 p-8 border-b border-primary/10 text-center">
              <CardTitle className="text-xl font-headline font-bold uppercase text-primary">Gestión de CV</CardTitle>
              <CardDescription className="text-[10px] font-black uppercase tracking-widest mt-2">Formatos aceptados: PDF (Máx. 5MB)</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center space-y-8">
                {profile?.cvUrl && !fileDataUri ? (
                  <div className="w-full space-y-6">
                    <div className="bg-green-50 border border-green-100 p-6 rounded-3xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-2xl text-green-600"><CheckCircle2 className="w-6 h-6" /></div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-green-600 tracking-widest">Estado</p>
                          <h4 className="font-bold text-sm">CV Cargado en el sistema</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px] md:max-w-md">{profile.cvName}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:bg-destructive/5" onClick={handleDelete} title="Eliminar CV">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl text-primary hover:bg-primary/5" asChild title="Ver CV">
                          <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-5 h-5" /></a>
                        </Button>
                      </div>
                    </div>
                    <div className="text-center pt-4 border-t border-dashed">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-4">¿Desea actualizar su archivo?</p>
                      <Button variant="outline" className="rounded-xl h-12 border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest w-full md:w-auto px-10" onClick={() => fileInputRef.current?.click()}>
                        <UploadCloud className="w-4 h-4 mr-2" /> Seleccionar Nuevo PDF
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-8">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-4 border-dashed rounded-[3rem] p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                        fileDataUri ? 'border-primary/40 bg-primary/[0.02]' : 'border-muted hover:border-primary/20 hover:bg-muted/30'
                      }`}
                    >
                      {fileDataUri ? (
                        <FileText className="w-16 h-16 text-primary" />
                      ) : (
                        <UploadCloud className="w-16 h-16 text-muted-foreground/30" />
                      )}
                      <div className="text-center">
                        <p className="font-bold text-sm">{fileName || "Haga clic para seleccionar archivo"}</p>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Solamente archivos .pdf</p>
                      </div>
                    </div>

                    {fileDataUri && (
                      <div className="flex flex-col md:flex-row gap-3 pt-4 justify-center">
                        <Button 
                          className="rounded-xl h-14 px-12 bg-primary font-black uppercase text-[11px] tracking-widest shadow-lg shadow-primary/20"
                          onClick={handleSave}
                          disabled={isSaving}
                        >
                          {isSaving ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <UploadCloud className="w-5 h-5 mr-2" />}
                          Guardar CV
                        </Button>
                        <Button variant="ghost" className="rounded-xl h-14 px-8 text-muted-foreground font-bold uppercase text-[10px]" onClick={() => { setFileDataUri(null); setFileName(profile?.cvName || null); }}>
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button variant="ghost" className="font-bold text-[10px] uppercase h-10 tracking-widest text-muted-foreground" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al perfil
            </Button>
          </div>

          <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
