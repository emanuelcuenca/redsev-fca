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
            <h1 className="text-xs md:text-sm font-headline font-bold text-primary truncate uppercase tracking-tight">
              Secretaría de Extensión y Vinculación FCA - UNCA
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
             {isAdmin && (
               <Button asChild size="sm" className="hidden sm:flex bg-accent hover:bg-accent/90 text-accent-foreground font-bold rounded-xl">
                 <Link href="/upload" className="flex items-center gap-2">
                   <Plus className="w-4 h-4" /> Nuevo
                 </Link>
               </Button>
             )}
             <div className="flex items-center gap-2">
               {isAdmin && <ShieldCheck className="w-4 h-4 text-primary hidden md:block" title="Perfil Secretaría" />}
               <div className="w-8 h-8 rounded-full overflow-hidden border">
                 <Image 
                   src="https://picsum.photos/seed/prof1/100/100" 
                   alt="Avatar" 
                   width={32} 
                   height={32} 
                   className="object-cover" 
                 />
               </div>
             </div>
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-full mx-auto w-full">
          <section className="mb-6 md:mb-10 text-center sm:text-left">
            <h2 className="text-2xl md:text-3xl font-headline font-bold mb-1 md:mb-2">Bienvenido</h2>
            <p className="text-muted-foreground text-sm md:text-lg">
              Gestión documental de Extensión y Vinculación.
            </p>
            {isAdmin && (
              <Badge className="mt-2 bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1 text-[10px] md:text-xs">
                Perfil Administrador - Secretaría
              </Badge>
            )}
          </section>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Buscar convenios..." 
                className="pl-10 h-11 md:h-12 text-base md:text-lg rounded-xl shadow-sm border-muted-foreground/20 focus:border-primary focus:ring-primary/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <Button 
                variant={selectedType === null ? "default" : "outline"}
                className="rounded-full h-10 md:h-12 px-4 md:px-6 transition-all text-xs md:text-sm"
                onClick={() => setSelectedType(null)}
              >
                Todos
              </Button>
              {types.map(type => (
                <Button 
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  className="rounded-full h-10 md:h-12 px-4 md:px-6 transition-all whitespace-nowrap text-xs md:text-sm"
                  onClick={() => setSelectedType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredDocuments.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12 md:py-20 bg-muted/30 rounded-2xl border-2 border-dashed border-muted">
              <FileText className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg md:text-xl font-headline font-semibold mb-1">Sin resultados</h3>
              <p className="text-xs md:text-sm text-muted-foreground">Intente con otros filtros.</p>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DocumentCard({ document }: { document: AgriculturalDocument }) {
  return (
    <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full bg-card">
      <div className="relative aspect-video overflow-hidden">
        <Image 
          src={document.imageUrl} 
          alt={document.title} 
          fill 
          className="object-cover group-hover:scale-105 transition-transform duration-500" 
          data-ai-hint="agriculture landscape"
        />
        <div className="absolute top-2 left-2 md:top-3 md:left-3">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur text-primary shadow-sm font-semibold text-[10px] md:text-xs">
            {document.type}
          </Badge>
        </div>
      </div>
      <CardHeader className="p-4 md:p-5 flex-grow">
        <CardTitle className="text-base md:text-lg font-headline font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {document.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 mt-2 font-medium text-xs md:text-sm">
          <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" /> {new Date(document.date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 md:px-5 py-0 flex flex-col gap-2 md:gap-3">
        <div className="flex items-center gap-2 text-[10px] md:text-sm text-muted-foreground">
          <User className="w-3 h-3 md:w-3.5 md:h-3.5" />
          <span className="truncate">{document.authors.join(', ')}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {document.keywords.map(tag => (
            <Badge key={tag} variant="outline" className="text-[9px] md:text-[10px] uppercase tracking-wider py-0 font-bold border-muted-foreground/10">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 md:p-5 mt-auto">
        <Button asChild variant="link" className="p-0 text-primary hover:text-primary/80 group/btn font-bold h-auto text-xs md:text-sm">
          <Link href={`/documents/${document.id}`} className="flex items-center gap-2">
            Ver Detalles <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
