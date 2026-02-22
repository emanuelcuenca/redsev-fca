"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Search, 
  FileText, 
  Calendar, 
  User, 
  ArrowRight,
  Plus,
  ShieldCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { MOCK_DOCUMENTS, AgriculturalDocument } from "@/lib/mock-data";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { user } = useUser();
  const db = useFirestore();

  const adminRef = useMemoFirebase(() => 
    user ? doc(db, 'roles_admin', user.uid) : null, 
    [db, user]
  );
  
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  const filteredDocuments = MOCK_DOCUMENTS.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType ? doc.type === selectedType : true;
    return matchesSearch && matchesType;
  });

  const types = Array.from(new Set(MOCK_DOCUMENTS.map(d => d.type)));

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 flex-1 overflow-hidden">
            <SidebarTrigger />
            <h1 className="text-sm md:text-base font-headline font-bold text-primary truncate uppercase tracking-tight">
              Secretaría de Extensión y Vinculación FCA - UNCA
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-2">
             {isAdmin && (
               <Button asChild size="sm" className="hidden sm:flex bg-accent hover:bg-accent/90 text-accent-foreground font-black rounded-xl h-9 uppercase tracking-widest text-[11px]">
                 <Link href="/upload" className="flex items-center gap-2">
                   <Plus className="w-4 h-4" /> Nuevo
                 </Link>
               </Button>
             )}
             <div className="flex items-center gap-2">
               {isAdmin && <ShieldCheck className="w-5 h-5 text-primary hidden md:block" title="Perfil Secretaría" />}
               <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary/20">
                 <Image 
                   src="https://picsum.photos/seed/prof1/100/100" 
                   alt="Avatar" 
                   width={36} 
                   height={36} 
                   className="object-cover" 
                 />
               </div>
             </div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <section className="mb-10 md:mb-16 text-center sm:text-left">
            <h2 className="text-4xl md:text-5xl font-headline font-bold mb-3 tracking-tight">Inicio</h2>
            <p className="text-muted-foreground text-lg md:text-2xl font-bold max-w-2xl leading-snug">
              Bienvenido al repositorio digital de gestión de Extensión y Vinculación de la Facultad.
            </p>
            {isAdmin && (
              <Badge className="mt-5 bg-primary/10 text-primary border-primary/30 font-black px-5 py-2 text-xs md:text-sm uppercase tracking-[0.2em] rounded-xl">
                Perfil Administrador - Secretaría
              </Badge>
            )}
          </section>

          <div className="flex flex-col md:flex-row gap-5 mb-12 md:mb-20">
            <div className="relative flex-1 group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6 group-focus-within:text-primary transition-all" />
              <Input 
                placeholder="Buscar por título, palabra clave..." 
                className="pl-14 h-16 text-lg md:text-xl rounded-[1.5rem] shadow-xl border-muted-foreground/10 focus:border-primary focus:ring-primary/10 transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3 md:pb-0 scrollbar-hide no-scrollbar">
              <Button 
                variant={selectedType === null ? "default" : "outline"}
                className="rounded-2xl h-16 px-8 transition-all text-base md:text-lg font-black uppercase tracking-widest"
                onClick={() => setSelectedType(null)}
              >
                Todos
              </Button>
              {types.map(type => (
                <Button 
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  className="rounded-2xl h-16 px-8 transition-all whitespace-nowrap text-base md:text-lg font-black uppercase tracking-widest"
                  onClick={() => setSelectedType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {filteredDocuments.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-24 md:py-40 bg-muted/30 rounded-[3rem] border-3 border-dashed border-muted-foreground/10 shadow-inner">
              <FileText className="w-24 h-24 text-muted-foreground mx-auto mb-8 opacity-20" />
              <h3 className="text-2xl md:text-4xl font-headline font-bold mb-3 uppercase tracking-tight">Sin resultados</h3>
              <p className="text-muted-foreground text-lg md:text-xl font-bold">Intente ajustando los filtros de búsqueda.</p>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DocumentCard({ document }: { document: AgriculturalDocument }) {
  return (
    <Card className="group overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-700 flex flex-col h-full bg-card rounded-[2.5rem] border-2 border-transparent hover:border-primary/5">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image 
          src={document.imageUrl} 
          alt={document.title} 
          fill 
          className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out" 
          data-ai-hint="agriculture landscape"
        />
        <div className="absolute top-5 left-5">
          <Badge variant="secondary" className="bg-background/95 backdrop-blur text-primary shadow-lg font-black text-[10px] px-4 py-1.5 uppercase tracking-widest border-none">
            {document.type}
          </Badge>
        </div>
      </div>
      <CardHeader className="p-8 pb-5 flex-grow">
        <CardTitle className="text-xl md:text-2xl font-headline font-bold leading-[1.2] group-hover:text-primary transition-colors line-clamp-2">
          {document.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 mt-4 font-black text-sm md:text-base uppercase tracking-widest text-primary/70">
          <Calendar className="w-5 h-5" /> {new Date(document.date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 py-0 flex flex-col gap-6">
        <div className="flex items-center gap-4 text-[17px] md:text-lg text-muted-foreground font-bold">
          <div className="bg-primary/10 p-2.5 rounded-xl shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <span className="truncate">{document.authors.join(', ')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {document.keywords.map(tag => (
            <Badge key={tag} variant="outline" className="text-[10px] md:text-[11px] uppercase tracking-[0.15em] py-1 font-black border-muted-foreground/10 bg-muted/50">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-8 mt-auto">
        <Button asChild variant="link" className="p-0 text-primary hover:text-primary/80 group/btn font-black h-auto text-[18px] md:text-[19px] hover:no-underline">
          <Link href={`/documents/${doc.id}`} className="flex items-center gap-2">
            Ver Detalles <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
