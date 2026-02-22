"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  FileText, 
  Search, 
  Filter, 
  User, 
  MoreVertical,
  Download,
  Eye,
  FileDown,
  Calendar,
  Handshake,
  Sprout
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { MOCK_DOCUMENTS } from "@/lib/mock-data";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export default function DocumentsListPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  
  const { user } = useUser();
  const db = useFirestore();

  const adminRef = useMemoFirebase(() => 
    user ? doc(db, 'roles_admin', user.uid) : null, 
    [db, user]
  );
  
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  const filteredDocs = useMemo(() => {
    return MOCK_DOCUMENTS.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            doc.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            doc.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;

      if (category === 'convenios') {
        return doc.type === 'Convenio';
      }
      
      if (category === 'extension') {
        return doc.type !== 'Convenio';
      }

      return true;
    });
  }, [searchQuery, category]);

  const pageTitle = category === 'convenios' ? 'Convenios Oficiales' : 
                    category === 'extension' ? 'Extensión Universitaria' : 
                    'Todos los Documentos';

  const PageIcon = category === 'convenios' ? Handshake : 
                   category === 'extension' ? Sprout : 
                   FileText;

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
          {isAdmin && (
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 rounded-xl text-xs md:text-sm ml-2 px-4 h-9 font-bold">
              <Link href="/upload">Subir</Link>
            </Button>
          )}
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <PageIcon className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-headline font-bold tracking-tight">{pageTitle}</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mb-8 md:mb-12">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="Buscar por título, proyecto o autor..." 
                className="pl-12 h-14 rounded-2xl text-base md:text-lg border-muted-foreground/20 focus:ring-primary/10 shadow-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-14 rounded-2xl gap-2 text-base font-black px-6 border-muted-foreground/20 uppercase tracking-widest text-primary">
              <Filter className="w-5 h-5" /> Filtros
            </Button>
          </div>

          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 gap-6 md:hidden">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="rounded-[2.5rem] border-muted shadow-lg overflow-hidden border-2 bg-card">
                <CardContent className="p-7">
                  <div className="flex items-start justify-between mb-5">
                    <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-[0.15em] px-4 py-1.5 bg-secondary text-primary border border-primary/10">
                      {doc.type}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 -mt-2 -mr-2 rounded-full hover:bg-primary/10">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[200px] shadow-2xl">
                        <DropdownMenuItem asChild className="rounded-xl py-3 cursor-pointer">
                          <Link href={`/documents/${doc.id}`} className="flex items-center gap-3">
                            <Eye className="w-4 h-4 text-primary" /> <span className="font-bold">Ver Detalles</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl py-3 gap-3 cursor-pointer">
                          <Download className="w-4 h-4 text-primary" /> <span className="font-bold">Descargar PDF</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-headline font-bold text-xl leading-snug mb-5 text-foreground">{doc.title}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-xl">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-[16px] font-bold text-muted-foreground truncate">{doc.authors.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-xl">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-[16px] font-bold text-muted-foreground">{new Date(doc.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="mt-7 pt-6 border-t border-dashed border-muted-foreground/20 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 max-w-[150px] truncate">{doc.project}</span>
                    <Button asChild variant="link" className="p-0 h-auto font-black text-primary text-[17px] hover:no-underline">
                      <Link href={`/documents/${doc.id}`}>ACCEDER →</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block bg-white rounded-[2.5rem] border border-muted shadow-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="font-black text-[12px] py-7 pl-12 uppercase tracking-[0.2em] text-muted-foreground/70">Documento</TableHead>
                  <TableHead className="font-black text-[12px] uppercase tracking-[0.2em] text-muted-foreground/70">Tipo</TableHead>
                  <TableHead className="font-black text-[12px] uppercase tracking-[0.2em] text-muted-foreground/70">Proyecto</TableHead>
                  <TableHead className="font-black text-[12px] uppercase tracking-[0.2em] text-muted-foreground/70">Fecha</TableHead>
                  <TableHead className="font-black text-right pr-12 text-[12px] uppercase tracking-[0.2em] text-muted-foreground/70">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-primary/[0.03] transition-all duration-300 group border-muted/60">
                    <TableCell className="py-8 pl-12">
                      <div className="flex items-center gap-6">
                        <div className="bg-primary/10 p-4 rounded-[1.25rem] shrink-0 group-hover:bg-primary group-hover:text-white group-hover:rotate-3 transition-all duration-500 shadow-sm">
                          <FileText className="w-7 h-7" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-black text-xl leading-tight truncate group-hover:text-primary transition-colors">{doc.title}</p>
                          <p className="text-base text-muted-foreground mt-2 flex items-center gap-2 font-bold">
                            <User className="w-4 h-4 text-primary/60" /> {doc.authors.join(', ')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-black text-[11px] uppercase tracking-[0.15em] py-1.5 px-4 bg-secondary/80 text-primary border border-primary/5">
                        {doc.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-muted-foreground/90 text-[16px]">
                      {doc.project}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-bold text-[16px]">
                      {new Date(doc.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right pr-12">
                      <div className="flex justify-end gap-3">
                        <Button asChild variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-primary/10 hover:text-primary transition-all">
                          <Link href={`/documents/${doc.id}`}>
                            <Eye className="w-6 h-6" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 hover:bg-secondary transition-all">
                              <MoreVertical className="w-6 h-6" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[220px] shadow-2xl border-muted/50">
                            <DropdownMenuItem className="gap-3 py-3.5 rounded-xl cursor-pointer font-black text-sm uppercase tracking-widest">
                              <Download className="w-5 h-5 text-primary" /> <span>Descargar PDF</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-3 py-3.5 rounded-xl cursor-pointer font-black text-sm uppercase tracking-widest">
                              <FileDown className="w-5 h-5 text-primary" /> <span>Metadatos</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredDocs.length === 0 && (
            <div className="py-24 text-center bg-muted/20 rounded-[4rem] border-3 border-dashed border-muted shadow-inner">
              <FileText className="w-24 h-24 text-muted-foreground/10 mx-auto mb-8" />
              <h3 className="text-2xl md:text-3xl font-headline font-bold text-muted-foreground/60 mb-3 uppercase tracking-tight">No se encontraron registros</h3>
              <p className="text-muted-foreground font-black text-lg">Pruebe ajustando los filtros de búsqueda.</p>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
