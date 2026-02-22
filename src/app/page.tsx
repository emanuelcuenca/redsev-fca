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
  Plus
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
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <SidebarTrigger />
          </div>
          <div className="flex-1 flex justify-center overflow-hidden px-2">
            <div className="flex flex-col items-center leading-tight text-center">
              <span className="text-[13px] md:text-base font-headline text-primary uppercase tracking-tight">
                Secretaría de Extensión y Vinculación
              </span>
              <span className="text-[13px] md:text-base font-headline text-black uppercase tracking-tight">
                FCA - UNCA
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
             {isAdmin && (
               <Button asChild size="sm" className="hidden sm:flex bg-accent hover:bg-accent/90 text-accent-foreground font-black rounded-xl h-9 uppercase tracking-widest text-[11px]">
                 <Link href="/upload" className="flex items-center gap-2">
                   <Plus className="w-4 h-4" /> Nuevo
                 </Link>
               </Button>
             )}
             <div className="flex items-center gap-2">
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
          <section className="mb-6 md:mb-10">
            <h2 className="text-xl md:text-2xl font-headline font-bold mb-1 tracking-tight">
              Bienvenido{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
            </h2>
            <p className="text-muted-foreground text-[13px] md:text-base font-medium max-w-2xl leading-snug">
              Repositorio digital de gestión de Extensión y Vinculación de la Facultad.
            </p>
            {isAdmin && (
              <Badge className="mt-3 bg-primary/10 text-primary border-primary/30 font-black px-3 py-1 text-[9px] md:text-xs uppercase tracking-[0.2em] rounded-lg">
                Perfil Administrador
              </Badge>
            )}
          </section>

          <div className="flex flex-col md:flex-row gap-4 mb-8 md:mb-12">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-all" />
              <Input 
                placeholder="Buscar por título, palabra clave..." 
                className="pl-12 h-14 text-sm md:text-base rounded-2xl shadow-lg border-muted-foreground/10 focus:border-primary focus:ring-primary/10 transition-all font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide no-scrollbar">
              <Button 
                variant={selectedType === null ? "default" : "outline"}
                className="rounded-xl h-14 px-6 transition-all text-[9px] md:text-xs font-black uppercase tracking-widest"
                onClick={() => setSelectedType(null)}
              >
                Todos
              </Button>
              {types.map(type => (
                <Button 
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  className="rounded-xl h-14 px-6 transition-all whitespace-nowrap text-[9px] md:text-xs font-black uppercase tracking-widest"
                  onClick={() => setSelectedType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredDocuments.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-16 md:py-24 bg-muted/30 rounded-[2rem] border-2 border-dashed border-muted-foreground/10">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-20" />
              <h3 className="text-lg md:text-2xl font-headline font-bold mb-2 uppercase tracking-tight">Sin resultados</h3>
              <p className="text-muted-foreground text-xs md:text-base font-bold">Intente ajustando los filtros de búsqueda.</p>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DocumentCard({ document }: { document: AgriculturalDocument }) {
  return (
    <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-500 flex flex-col h-full bg-card rounded-3xl border-2 border-transparent hover:border-primary/5">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image 
          src={document.imageUrl} 
          alt={document.title} 
          fill 
          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
          data-ai-hint="agriculture landscape"
        />
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-background/95 backdrop-blur text-primary shadow-sm font-black text-[9px] px-3 py-1 uppercase tracking-widest border-none">
            {document.type}
          </Badge>
        </div>
      </div>
      <CardHeader className="p-6 pb-4 flex-grow">
        <CardTitle className="text-lg md:text-xl font-headline font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {document.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 mt-3 font-black text-[10px] md:text-xs uppercase tracking-widest text-primary/70">
          <Calendar className="w-4 h-4" /> {new Date(document.date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-0 flex flex-col gap-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground font-bold">
          <User className="w-4 h-4 text-primary" />
          <span className="truncate">{document.authors.join(', ')}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {document.keywords.map(tag => (
            <Badge key={tag} variant="outline" className="text-[9px] uppercase tracking-[0.1em] py-0.5 font-bold border-muted-foreground/10 bg-muted/50">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-6 mt-auto">
        <Button asChild variant="link" className="p-0 text-primary hover:text-primary/80 group/btn font-black h-auto text-sm md:text-base hover:no-underline">
          <Link href={`/documents/${document.id}`} className="flex items-center gap-2">
            Ver Detalles <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
