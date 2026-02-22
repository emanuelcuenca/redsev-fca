
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

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

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
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-lg md:text-xl font-headline font-semibold text-primary truncate max-w-[200px] md:max-w-none">
              Repositorio Digital FCA - UNCA
            </h1>
          </div>
          <div className="flex items-center gap-3">
             <Button asChild size="sm" className="hidden sm:flex bg-accent hover:bg-accent/90 text-accent-foreground font-medium">
               <Link href="/upload" className="flex items-center gap-2">
                 <Plus className="w-4 h-4" /> Nuevo Documento
               </Link>
             </Button>
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
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <section className="mb-10 text-center sm:text-left">
            <h2 className="text-3xl font-headline font-bold mb-2">Bienvenido</h2>
            <p className="text-muted-foreground text-lg">
              Secretaría de Extensión y Vinculación - Facultad de Ciencias Agrarias.
            </p>
          </section>

          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Buscar convenios, proyectos o autores..." 
                className="pl-10 h-12 text-lg rounded-xl shadow-sm border-muted-foreground/20 focus:border-primary focus:ring-primary/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <Button 
                variant={selectedType === null ? "default" : "outline"}
                className="rounded-full h-12 px-6 transition-all"
                onClick={() => setSelectedType(null)}
              >
                Todos
              </Button>
              {types.map(type => (
                <Button 
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  className="rounded-full h-12 px-6 transition-all whitespace-nowrap"
                  onClick={() => setSelectedType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed border-muted">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-headline font-semibold mb-1">No se encontraron documentos</h3>
              <p className="text-muted-foreground">Intente con otra búsqueda o filtro.</p>
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
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur text-primary shadow-sm font-semibold">
            {document.type}
          </Badge>
        </div>
      </div>
      <CardHeader className="p-5 flex-grow">
        <CardTitle className="text-lg font-headline font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {document.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 mt-2 font-medium">
          <Calendar className="w-3.5 h-3.5" /> {new Date(document.date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 py-0 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-3.5 h-3.5" />
          <span className="truncate">{document.authors.join(', ')}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {document.keywords.map(tag => (
            <Badge key={tag} variant="outline" className="text-[10px] uppercase tracking-wider py-0 font-bold border-muted-foreground/20">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-5 mt-auto">
        <Button asChild variant="link" className="p-0 text-primary hover:text-primary/80 group/btn font-bold">
          <Link href={`/documents/${document.id}`} className="flex items-center gap-2">
            Ver Detalles <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
