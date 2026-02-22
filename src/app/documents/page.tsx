"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  Filter, 
  User, 
  MoreVertical,
  Download,
  Eye,
  FileDown,
  Calendar
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
  const { user } = useUser();
  const db = useFirestore();

  const adminRef = useMemoFirebase(() => 
    user ? doc(db, 'roles_admin', user.uid) : null, 
    [db, user]
  );
  
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  const filteredDocs = MOCK_DOCUMENTS.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 rounded-xl text-xs md:text-sm ml-2 px-4 h-9">
              <Link href="/upload">Subir</Link>
            </Button>
          )}
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row gap-3 mb-6 md:mb-10">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="Filtrar por título, proyecto o autor..." 
                className="pl-12 h-14 rounded-2xl text-base md:text-lg border-muted-foreground/20 focus:ring-primary/10 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-14 rounded-2xl gap-2 text-base font-bold px-6 border-muted-foreground/20">
              <Filter className="w-5 h-5" /> Filtros
            </Button>
          </div>

          {/* Mobile View: Cards (Refined for better readability) */}
          <div className="grid grid-cols-1 gap-5 md:hidden">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="rounded-[2rem] border-muted shadow-lg overflow-hidden border-2">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant="secondary" className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 bg-secondary text-primary">
                      {doc.type}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 -mt-2 -mr-2 rounded-full">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[180px]">
                        <DropdownMenuItem asChild className="rounded-xl py-3">
                          <Link href={`/documents/${doc.id}`} className="flex items-center gap-3">
                            <Eye className="w-4 h-4" /> <span className="font-bold">Ver Detalles</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl py-3 gap-3">
                          <Download className="w-4 h-4" /> <span className="font-bold">Descargar PDF</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-headline font-bold text-xl leading-tight mb-4 text-foreground">{doc.title}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-[15px] font-medium text-muted-foreground truncate">{doc.authors.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-[15px] font-medium text-muted-foreground">{new Date(doc.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-5 border-t border-dashed flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-primary/60">{doc.project}</span>
                    <Button asChild variant="link" className="p-0 h-auto font-bold text-primary text-base">
                      <Link href={`/documents/${doc.id}`}>Acceder →</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block bg-white rounded-[2.5rem] border border-muted shadow-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="font-bold text-[13px] py-6 pl-10 uppercase tracking-[0.2em] text-muted-foreground/80">Documento</TableHead>
                  <TableHead className="font-bold text-[13px] uppercase tracking-[0.2em] text-muted-foreground/80">Tipo</TableHead>
                  <TableHead className="font-bold text-[13px] uppercase tracking-[0.2em] text-muted-foreground/80">Proyecto</TableHead>
                  <TableHead className="font-bold text-[13px] uppercase tracking-[0.2em] text-muted-foreground/80">Fecha</TableHead>
                  <TableHead className="font-bold text-right pr-10 text-[13px] uppercase tracking-[0.2em] text-muted-foreground/80">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-primary/[0.02] transition-colors group border-muted/50">
                    <TableCell className="py-7 pl-10">
                      <div className="flex items-center gap-5">
                        <div className="bg-primary/10 p-3.5 rounded-2xl shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-lg leading-tight truncate group-hover:text-primary transition-colors">{doc.title}</p>
                          <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
                            <User className="w-4 h-4 text-primary/60" /> {doc.authors.join(', ')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-bold text-[11px] uppercase tracking-widest py-1 px-3 bg-secondary/80">
                        {doc.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-muted-foreground/80 text-[15px]">
                      {doc.project}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium text-[15px]">
                      {new Date(doc.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right pr-10">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="ghost" size="icon" className="rounded-full h-11 w-11 hover:bg-primary/10 hover:text-primary transition-all">
                          <Link href={`/documents/${doc.id}`}>
                            <Eye className="w-5 h-5" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-11 w-11">
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[200px] shadow-2xl border-muted/50">
                            <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer font-bold">
                              <Download className="w-5 h-5" /> <span>Descargar PDF</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer font-bold">
                              <FileDown className="w-5 h-5" /> <span>Metadatos</span>
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
            <div className="py-24 text-center bg-muted/20 rounded-[3rem] border-2 border-dashed border-muted">
              <FileText className="w-20 h-20 text-muted-foreground/20 mx-auto mb-6" />
              <h3 className="text-2xl font-headline font-bold text-muted-foreground/60 mb-2">No se encontraron documentos</h3>
              <p className="text-muted-foreground font-medium">Pruebe ajustando los filtros de búsqueda.</p>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
