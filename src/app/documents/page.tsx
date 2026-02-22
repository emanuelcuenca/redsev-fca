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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="Filtrar documentos por título, proyecto o autor..." 
                className="pl-11 h-12 rounded-xl text-base md:text-lg border-muted-foreground/20 focus:ring-primary/10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-12 rounded-xl gap-2 text-base font-semibold px-6 border-muted-foreground/20">
              <Filter className="w-5 h-5" /> Filtros
            </Button>
          </div>

          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="rounded-2xl border-muted-foreground/10 overflow-hidden shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                      {doc.type}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem asChild>
                          <Link href={`/documents/${doc.id}`} className="flex items-center gap-2">
                            <Eye className="w-4 h-4" /> Ver Detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Download className="w-4 h-4" /> Descargar PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-bold text-base leading-snug mb-2">{doc.title}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 shrink-0 text-primary" />
                      <span className="truncate">{doc.authors.join(', ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 shrink-0 text-primary" />
                      <span>{new Date(doc.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-muted flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-primary/70">{doc.project}</span>
                      <Button asChild variant="link" className="p-0 h-auto font-bold text-primary">
                        <Link href={`/documents/${doc.id}`}>Acceder →</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block bg-white rounded-3xl border border-muted-foreground/10 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-sm py-5 pl-8 uppercase tracking-widest text-muted-foreground/70">Documento</TableHead>
                  <TableHead className="font-bold text-sm uppercase tracking-widest text-muted-foreground/70">Tipo</TableHead>
                  <TableHead className="font-bold text-sm uppercase tracking-widest text-muted-foreground/70">Proyecto</TableHead>
                  <TableHead className="font-bold text-sm uppercase tracking-widest text-muted-foreground/70">Fecha</TableHead>
                  <TableHead className="font-bold text-right pr-8 text-sm uppercase tracking-widest text-muted-foreground/70">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="py-5 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2.5 rounded-xl shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-base leading-tight truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-primary/70" /> {doc.authors.join(', ')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-bold text-[10px] uppercase tracking-wider py-0.5">
                        {doc.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-muted-foreground text-sm">
                      {doc.project}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(doc.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-primary/10 hover:text-primary">
                          <Link href={`/documents/${doc.id}`}>
                            <Eye className="w-5 h-5" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl p-2 min-w-[160px]">
                            <DropdownMenuItem className="gap-3 py-2.5 rounded-lg cursor-pointer">
                              <Download className="w-4 h-4" /> <span>Descargar PDF</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-3 py-2.5 rounded-lg cursor-pointer">
                              <FileDown className="w-4 h-4" /> <span>Metadatos</span>
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
            <div className="py-20 md:py-32 text-center bg-muted/30 rounded-3xl border-2 border-dashed border-muted">
              <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
              <h3 className="text-xl font-headline font-bold text-muted-foreground mb-2">No se encontraron documentos</h3>
              <p className="text-muted-foreground">Pruebe ajustando los filtros de búsqueda.</p>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
