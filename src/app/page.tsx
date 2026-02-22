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
               <Button asChild size="sm" className="hidden sm:flex bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl h-9">
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
          <section className="mb-8 md:mb-12 text-center sm:text-left">
            <h2 className="text-3xl md:text-4xl font-headline font-bold mb-2 tracking-tight">Bienvenido</h2>
            <p className="text-muted-foreground text-base md:text-xl font-medium">
              Gestión documental de Extensión y Vinculación.
            </p>
            {isAdmin && (
              <Badge className="mt-3 bg-primary/10 text-primary border-primary/20 font-bold px-4 py-1.5 text-xs md:text-sm uppercase tracking-widest">
                Perfil Administrador - Secretaría
              </Badge>
            )}
          </section>

          <div className="flex flex-col md:flex-row gap-4 mb-10">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Buscar por título, palabra clave..." 
                className="pl-12 h-14 text-base md:text-lg rounded-2xl shadow-sm border-muted-foreground/20 focus:border-primary focus:ring-primary/10 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide no-scrollbar">
              <Button 
                variant={selectedType === null ? "default" : "outline"}
                className="rounded-full h-12 md:h-14 px-6 transition-all text-sm md:text-base font-bold"
                onClick={() => setSelectedType(null)}
              >
                Todos
              </Button>
              {types.map(type => (
                <Button 
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  className="rounded-full h-12 md:h-14 px-6 transition-all whitespace-nowrap text-sm md:text-base font-bold"
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
            <div className="text-center py-20 md:py-32 bg-muted/30 rounded-3xl border-2 border-dashed border-muted">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-30" />
              <h3 className="text-xl md:text-2xl font-headline font-bold mb-2">Sin resultados</h3>
              <p className="text-muted-foreground text-base">Intente ajustando los filtros de búsqueda.</p>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DocumentCard({ document }: { document: AgriculturalDocument }) {
  return (
    <Card className="group overflow-hidden border-none shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full bg-card rounded-3xl">
      <div className="relative aspect-video overflow-hidden">
        <Image 
          src={document.imageUrl} 
          alt={document.title} 
          fill 
          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
          data-ai-hint="agriculture landscape"
        />
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur text-primary shadow-sm font-bold text-xs px-3 py-1">
            {document.type}
          </Badge>
        </div>
      </div>
      <CardHeader className="p-6 pb-4 flex-grow">
        <CardTitle className="text-lg md:text-xl font-headline font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {document.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 mt-3 font-semibold text-sm md:text-base">
          <Calendar className="w-4 h-4 text-primary" /> {new Date(document.date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-0 flex flex-col gap-4">
        <div className="flex items-center gap-3 text-sm md:text-base text-muted-foreground font-medium">
          <User className="w-4 h-4 text-primary/70 shrink-0" />
          <span className="truncate">{document.authors.join(', ')}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {document.keywords.map(tag => (
            <Badge key={tag} variant="outline" className="text-[10px] md:text-xs uppercase tracking-widest py-0.5 font-bold border-muted-foreground/20">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-6 mt-auto">
        <Button asChild variant="link" className="p-0 text-primary hover:text-primary/80 group/btn font-bold h-auto text-base">
          <Link href={`/documents/${document.id}`} className="flex items-center gap-2">
            Ver Detalles <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
