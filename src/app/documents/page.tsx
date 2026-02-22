"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  ArrowRight,
  MoreVertical,
  Download,
  Eye,
  FileDown
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
import { MOCK_DOCUMENTS, AgriculturalDocument } from "@/lib/mock-data";
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
            <h1 className="text-xs md:text-sm font-headline font-bold text-primary truncate uppercase tracking-tight">
              Secretaría de Extensión y Vinculación FCA - UNCA
            </h1>
          </div>
          {isAdmin && (
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 rounded-xl text-xs md:text-sm ml-2">
              <Link href="/upload">Subir</Link>
            </Button>
          )}
        </header>

        <main className="p-4 md:p-8 max-w-full mx-auto w-full">
          <div className="flex flex-col md:flex-row gap-3 mb-6 md:mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Filtrar documentos..." 
                className="pl-10 h-11 rounded-xl text-sm md:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-11 rounded-xl gap-2 text-sm">
              <Filter className="w-4 h-4" /> Filtros
            </Button>
          </div>

          <div className="bg-white rounded-2xl md:rounded-3xl border border-muted shadow-sm overflow-hidden overflow-x-auto">
            <Table className="min-w-[600px] md:min-w-full">
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold text-xs md:text-sm">Documento</TableHead>
                  <TableHead className="font-bold text-xs md:text-sm">Tipo</TableHead>
                  <TableHead className="font-bold hidden md:table-cell text-xs md:text-sm">Proyecto</TableHead>
                  <TableHead className="font-bold hidden lg:table-cell text-xs md:text-sm">Fecha</TableHead>
                  <TableHead className="font-bold text-right text-xs md:text-sm">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-3 md:py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                          <FileText className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-xs md:text-sm leading-tight truncate">{doc.title}</p>
                          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 flex items-center gap-1">
                            <User className="w-3 h-3" /> {doc.authors[0]} {doc.authors.length > 1 && `+${doc.authors.length - 1}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium text-[9px] md:text-[10px]">
                        {doc.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-medium text-muted-foreground text-xs">
                      {doc.project}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                      {new Date(doc.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 md:gap-2">
                        <Button asChild variant="ghost" size="icon" className="rounded-full h-8 w-8 md:h-10 md:w-10">
                          <Link href={`/documents/${doc.id}`}>
                            <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 md:h-10 md:w-10">
                              <MoreVertical className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem className="gap-2 text-xs md:text-sm">
                              <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> Descargar PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-xs md:text-sm">
                              <FileDown className="w-3.5 h-3.5 md:w-4 md:h-4" /> Metadatos
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredDocs.length === 0 && (
              <div className="p-12 md:p-20 text-center">
                <FileText className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium text-sm">No se encontraron documentos.</p>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
