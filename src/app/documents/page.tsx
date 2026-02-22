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
      <SidebarInset className="bg-background w-full overflow-hidden">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 flex-1 overflow-hidden">
            <SidebarTrigger />
            <h1 className="text-[11px] md:text-sm font-headline font-bold text-primary truncate uppercase tracking-tight">
              Secretaría de Extensión y Vinculación FCA - UNCA
            </h1>
          </div>
          {isAdmin && (
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 rounded-xl text-[10px] md:text-xs ml-2 px-3 h-8 font-bold">
              <Link href="/upload">Subir</Link>
            </Button>
          )}
        </header>

        <main className="p-4 md:p-8 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <PageIcon className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl md:text-3xl font-headline font-bold tracking-tight">{pageTitle}</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="Buscar por título, proyecto o autor..." 
                className="pl-12 h-14 rounded-2xl text-base border-muted-foreground/20 focus:ring-primary/10 shadow-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-14 rounded-2xl gap-2 text-base font-black px-6 border-muted-foreground/20 uppercase tracking-widest text-primary">
              <Filter className="w-5 h-5" /> Filtros
            </Button>
          </div>

          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 gap-6 md:hidden w-full">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="rounded-[2rem] border-muted shadow-lg overflow-hidden border-2 bg-card w-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 bg-secondary text-primary">
                      {doc.type}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1 rounded-full">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem asChild>
                          <Link href={`/documents/${doc.id}`} className="flex items-center gap-2">
                            <Eye className="w-4 h-4" /> <span>Ver</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-headline font-bold text-lg leading-tight mb-4">{doc.title}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-bold truncate">{doc.authors.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="font-bold">{new Date(doc.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="mt-5 pt-4 border-t border-dashed border-muted-foreground/20 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70 truncate max-w-[120px]">{doc.project}</span>
                    <Button asChild variant="link" className="p-0 h-auto font-black text-primary text-sm hover:no-underline">
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
                  <TableRow key={doc.id} className="hover:bg-primary/[0.03] transition-all duration-300 group">
                    <TableCell className="py-8 pl-12">
                      <div className="flex items-center gap-6">
                        <div className="bg-primary/10 p-4 rounded-[1.25rem] group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-black text-lg leading-tight group-hover:text-primary transition-colors">{doc.title}</p>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 font-bold">
                            <User className="w-4 h-4 text-primary/60" /> {doc.authors.join(', ')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-black text-[10px] uppercase tracking-[0.15em] py-1 px-3 bg-secondary text-primary">
                        {doc.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-muted-foreground/90">
                      {doc.project}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-bold">
                      {new Date(doc.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right pr-12">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-primary/10">
                          <Link href={`/documents/${doc.id}`}>
                            <Eye className="w-5 h-5" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem className="gap-2 font-bold">
                              <Download className="w-4 h-4" /> Descargar
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
            <div className="py-20 text-center bg-muted/20 rounded-[3rem] border-2 border-dashed border-muted">
              <FileText className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="text-xl font-headline font-bold text-muted-foreground/60 uppercase">Sin resultados</h3>
              <p className="text-muted-foreground font-bold">Intente ajustando los filtros.</p>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
