
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  X, 
  FileText, 
  Plus, 
  Save, 
  ArrowLeft,
  ChevronRight,
  Info
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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (tag: string) => {
    setKeywords(keywords.filter(k => k !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Documento cargado con éxito",
        description: "El documento y sus metadatos han sido almacenados.",
      });
      router.push("/");
    }, 2000);
  };

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 flex justify-center overflow-hidden px-2">
            <div className="flex flex-col items-center leading-none text-center gap-1 w-full">
              <span className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-2xl font-headline text-primary uppercase tracking-tighter font-normal whitespace-nowrap">
                SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN
              </span>
              <span className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-2xl font-headline text-black uppercase tracking-tighter font-normal whitespace-nowrap">
                FCA - UNCA
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <UserMenu />
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-4xl mx-auto w-full">
          <form onSubmit={handleSubmit} className="space-y-8">
            <section>
              <h2 className="text-2xl font-headline font-bold mb-4 flex items-center gap-2 uppercase tracking-tight">
                1. Archivo Digital
              </h2>
              <div className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary hover:bg-muted/30'}`}>
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="w-16 h-16 text-primary" />
                    <div className="text-center">
                      <p className="font-bold text-lg">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setFile(null)} className="rounded-full mt-2">
                      Cambiar Archivo
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                      <Upload className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold mb-1 uppercase tracking-tight">Arrastre su documento aquí</p>
                      <p className="text-muted-foreground mb-4">PDF, DOC, DOCX o Imágenes (Máx 20MB)</p>
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <div className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                          Seleccionar desde equipo
                        </div>
                        <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,image/*" />
                      </Label>
                    </div>
                  </>
                )}
              </div>
            </section>

            <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-muted-foreground/10 space-y-6">
              <h2 className="text-2xl font-headline font-bold mb-2 flex items-center gap-2 uppercase tracking-tight">
                2. Metadatos y Organización
              </h2>
              <p className="text-muted-foreground text-sm flex items-center gap-2 mb-6">
                <Info className="w-4 h-4" /> Estos datos facilitan la búsqueda inteligente en el repositorio.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="title" className="font-bold">Título del Documento</Label>
                  <Input id="title" placeholder="Ej: Convenio de Cooperación Interinstitucional..." className="h-12 rounded-xl border-muted-foreground/20" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="font-bold">Tipo de Documento</Label>
                  <Select required>
                    <SelectTrigger className="h-12 rounded-xl border-muted-foreground/20">
                      <SelectValue placeholder="Seleccione tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="convenio">Convenio</SelectItem>
                      <SelectItem value="proyecto">Proyecto de Extensión</SelectItem>
                      <SelectItem value="informe">Informe Técnico</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date" className="font-bold">Fecha de Documento</Label>
                  <Input id="date" type="date" className="h-12 rounded-xl border-muted-foreground/20" required />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="authors" className="font-bold">Autores / Responsables</Label>
                  <Input id="authors" placeholder="Dra. María García, Ing. Juan Pérez..." className="h-12 rounded-xl border-muted-foreground/20" required />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="keywords" className="font-bold">Palabras Clave</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Escriba y presione añadir..." 
                      className="h-12 rounded-xl border-muted-foreground/20"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    />
                    <Button type="button" variant="secondary" className="h-12 px-6 rounded-xl" onClick={addKeyword}>
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {keywords.map(tag => (
                      <Badge key={tag} className="bg-accent/20 text-accent-foreground hover:bg-accent/30 py-1.5 px-3 flex items-center gap-2 border-none transition-all">
                        {tag}
                        <button type="button" onClick={() => removeKeyword(tag)}>
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description" className="font-bold">Breve Descripción</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Resumen del contenido del documento..." 
                    className="min-h-[120px] rounded-xl border-muted-foreground/20" 
                  />
                </div>
              </div>
            </section>

            <div className="flex items-center justify-end gap-4 py-6">
              <Button type="button" variant="outline" className="h-12 px-8 rounded-xl font-bold" onClick={() => router.push("/")}>
                Cancelar
              </Button>
              <Button type="submit" className="h-12 px-10 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" disabled={isSaving || !file}>
                {isSaving ? "Almacenando..." : "Guardar en Repositorio"}
              </Button>
            </div>
          </form>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
