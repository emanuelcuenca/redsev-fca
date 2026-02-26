"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  FileText, 
  Search, 
  User, 
  MoreVertical,
  Eye,
  Handshake,
  Loader2,
  ArrowLeftRight,
  Trash2,
  Fingerprint,
  Pencil,
  Plane,
  GraduationCap,
  ScrollText,
  UserCheck
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, deleteDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { AgriculturalDocument, isDocumentVigente, formatPersonName } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";

export default function DocumentsListPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVigente, setFilterVigente] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterDirector, setFilterDirector] = useState<string>("all");
  const [filterExtensionType, setFilterExtensionType] = useState<string>("all");
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  useEffect(() => {
    if (mounted && !isUserLoading && !user) router.push('/login');
  }, [user, isUserLoading, mounted, router]);

  const adminRef = useMemoFirebase(() => user ? doc(db, 'roles_admin', user.uid) : null, [db, user]);
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  const docsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'documents'), orderBy('uploadDate', 'desc'));
  }, [db, user]);
  const { data: rawDocs, isLoading } = useCollection<AgriculturalDocument>(docsQuery);

  const directorsList = useMemo(() => {
    if (!rawDocs) return [];
    const list = rawDocs
      .filter(d => d.type === 'Proyecto')
      .map(d => formatPersonName(d.director))
      .filter(name => name !== 'Sin asignar');
    return Array.from(new Set(list)).sort();
  }, [rawDocs]);

  const filteredDocs = useMemo(() => {
    if (!rawDocs) return [];
    
    return rawDocs.filter(doc => {
      // 1. Filtro jerárquico para no administradores
      if (!isAdmin) {
        if (doc.type === 'Proyecto' && doc.extensionDocType !== 'Proyecto de Extensión') {
          return false;
        }
      }

      // 2. Filtro por categoría de sidebar
      if (category === 'convenios' && doc.type !== 'Convenio') return false;
      if (category === 'extension' && doc.type !== 'Proyecto') return false;
      if (category === 'movilidad' && !['Movilidad Estudiantil', 'Movilidad Docente'].includes(doc.type)) return false;
      if (category === 'pasantias' && doc.type !== 'Pasantía') return false;
      if (category === 'resoluciones' && doc.type !== 'Resolución') return false;

      // 3. Búsqueda por texto
      const searchableString = (
        (doc.title || "") + 
        (doc.projectCode || '') + 
        (doc.resolutionNumber || '') +
        (doc.authors?.map(a => a.lastName).join(' ') || '') +
        (doc.director?.lastName || '') +
        (doc.student?.lastName || '')
      ).toLowerCase();
      
      if (!searchQuery) return true;
      if (!searchableString.includes(searchQuery.toLowerCase())) return false;

      // 4. Filtros adicionales
      const dateToUse = (category === 'extension' ? doc.uploadDate : (doc.date || doc.uploadDate));
      const docYear = dateToUse ? new Date(dateToUse).getFullYear().toString() : null;
      if (filterYear !== "all" && docYear !== filterYear) return false;
      
      if (category === 'convenios' && filterVigente !== "all") {
        const isVig = isDocumentVigente(doc);
        if (isVig !== (filterVigente === "vigente")) return false;
      }

      // 5. Filtro de Director (Extensión)
      if (category === 'extension' && filterDirector !== "all") {
        if (formatPersonName(doc.director) !== filterDirector) return false;
      }

      // 6. Filtro de Tipo de Extensión (Solo Admin)
      if (isAdmin && category === 'extension' && filterExtensionType !== "all") {
        if (doc.extensionDocType !== filterExtensionType) return false;
      }

      return true;
    }).filter(doc => {
      // Si no es admin y es extensión, solo mostrar "Proyecto de Extensión"
      if (!isAdmin && category === 'extension') {
        return doc.extensionDocType === 'Proyecto de Extensión';
      }
      return true;
    });
  }, [rawDocs, searchQuery, category, filterVigente, filterYear, isAdmin, filterDirector, filterExtensionType]);

  const handleDelete = (docId: string) => {
    if (!isAdmin) return;
    if (confirm("¿Está seguro de que desea eliminar este registro permanentemente? Esta acción no se puede deshacer.")) {
      deleteDocumentNonBlocking(doc(db, 'documents', docId));
      toast({ title: "Registro eliminado correctamente" });
    }
  };

  const years = useMemo(() => {
    if (!rawDocs) return [];
    const allYears = rawDocs.map(d => {
      const dateToUse = (category === 'extension' ? d.uploadDate : (d.date || d.uploadDate));
      return dateToUse ? new Date(dateToUse).getFullYear() : null;
    }).filter(Boolean);
    return Array.from(new Set(allYears)).sort((a, b) => (b as number) - (a as number));
  }, [rawDocs, category]);

  const getPageInfo = () => {
    switch(category) {
      case 'convenios': return { title: 'Convenios', icon: Handshake };
      case 'extension': return { title: 'Extensión y Proyectos', icon: ArrowLeftRight };
      case 'movilidad': return { title: 'Movilidad Estudiantil/Docente', icon: Plane };
      case 'pasantias': return { title: 'Prácticas y Pasantías', icon: GraduationCap };
      case 'resoluciones': return { title: 'Resoluciones y Reglamentos', icon: ScrollText };
      default: return { title: 'Repositorio Institucional', icon: FileText };
    }
  };

  const { title: pageTitle, icon: PageIcon } = getPageInfo();

  const getDocIcon = (type: string) => {
    switch(type) {
      case 'Convenio': return <Handshake className="w-6 h-6" />;
      case 'Proyecto': return <ArrowLeftRight className="w-6 h-6" />;
      case 'Movilidad Estudiantil':
      case 'Movilidad Docente': return <Plane className="w-6 h-6" />;
      case 'Pasantía': return <GraduationCap className="w-6 h-6" />;
      case 'Resolución': return <ScrollText className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  if (isUserLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background w-full overflow-hidden">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0"><SidebarTrigger /></div>
          <div className="flex-1 flex justify-center text-center">
            <div className="flex flex-col items-center">
              <span className="text-[12px] md:text-2xl font-headline text-primary uppercase tracking-tighter font-normal">SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN</span>
              <span className="text-[12px] md:text-2xl font-headline text-black uppercase tracking-tighter font-normal">FCA - UNCA</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0"><UserMenu /></div>
        </header>

        <main className="p-4 md:p-8 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6 md:mb-8"><div className="bg-primary/10 p-2.5 rounded-xl"><PageIcon className="w-6 h-6 text-primary" /></div><h2 className="text-xl md:text-3xl font-headline font-bold tracking-tight uppercase">{pageTitle}</h2></div>
          
          <div className="space-y-4 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input 
                placeholder="Buscar por título, código, responsable o resolución..." 
                className="pl-12 h-14 rounded-2xl text-sm md:text-base border-muted-foreground/20 shadow-sm font-medium" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
            <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-3">
              {category === 'convenios' && (
                <Select value={filterVigente} onValueChange={setFilterVigente}>
                  <SelectTrigger className="h-11 w-full md:w-40 rounded-xl font-bold text-xs uppercase tracking-wider bg-white">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="vigente">Vigente</SelectItem>
                    <SelectItem value="vencido">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {category === 'extension' && (
                <>
                  <Select value={filterDirector} onValueChange={setFilterDirector}>
                    <SelectTrigger className="h-11 w-full md:w-56 rounded-xl font-bold text-xs uppercase tracking-wider bg-white">
                      <div className="flex items-center gap-2 truncate">
                        <UserCheck className="w-3.5 h-3.5 shrink-0" />
                        <SelectValue placeholder="Director/a" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Directores</SelectItem>
                      {directorsList.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  {isAdmin && (
                    <Select value={filterExtensionType} onValueChange={setFilterExtensionType}>
                      <SelectTrigger className="h-11 w-full md:w-56 rounded-xl font-bold text-xs uppercase tracking-wider bg-white">
                        <div className="flex items-center gap-2 truncate">
                          <Fingerprint className="w-3.5 h-3.5 shrink-0" />
                          <SelectValue placeholder="Tipo / Código" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las Categorías</SelectItem>
                        <SelectItem value="Proyecto de Extensión">Proyecto de Extensión</SelectItem>
                        <SelectItem value="Resolución de aprobación">Resolución de aprobación</SelectItem>
                        <SelectItem value="Informe de avance">Informe de avance</SelectItem>
                        <SelectItem value="Informe final">Informe final</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}

              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="h-11 w-full md:w-40 rounded-xl font-bold text-xs uppercase tracking-wider bg-white">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquier Año</SelectItem>
                  {years.map(y => <SelectItem key={y as number} value={y!.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>

              <Button variant="ghost" onClick={() => { setFilterVigente("all"); setFilterYear("all"); setFilterDirector("all"); setFilterExtensionType("all"); setSearchQuery(""); }} className="h-11 text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-auto">Limpiar Filtros</Button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-muted shadow-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="py-7 pl-12 font-black text-[12px] uppercase tracking-widest">Documento / Trámite</TableHead>
                  <TableHead className="font-black text-[12px] uppercase tracking-widest">Código / Categoría</TableHead>
                  <TableHead className="font-black text-[12px] uppercase tracking-widest">Fecha</TableHead>
                  <TableHead className="pr-12 text-right font-black text-[12px] uppercase tracking-widest">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredDocs.map((doc) => (
                  <TableRow 
                    key={doc.id} 
                    className="hover:bg-primary/[0.03] group transition-all duration-300"
                  >
                    <TableCell className="py-8 pl-12">
                      <div className="flex items-center gap-6">
                        <div className="bg-primary/10 p-4 rounded-[1.25rem] group-hover:bg-primary group-hover:text-white transition-all shadow-sm shrink-0">
                          {getDocIcon(doc.type)}
                        </div>
                        <div className="max-w-md">
                          <Link href={`/documents/${doc.id}`} className="block w-fit">
                            <p className="font-black text-lg leading-tight text-foreground hover:text-primary transition-colors line-clamp-2 cursor-pointer">{doc.title}</p>
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1 font-bold flex items-center gap-2">
                            <User className="w-4 h-4 text-primary/60" /> 
                            {formatPersonName(doc.director) !== 'Sin asignar' ? formatPersonName(doc.director) : 
                             (doc.student && formatPersonName(doc.student) !== 'Sin asignar') ? formatPersonName(doc.student) :
                             (doc.authors && doc.authors.length > 0) ? formatPersonName(doc.authors[0]) : 'Responsable SEyV'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className="font-black text-[10px] uppercase px-3 py-1 bg-secondary text-primary w-fit">{doc.extensionDocType || doc.type}</Badge>
                        {(doc.projectCode || doc.resolutionNumber) && (
                          <span className="text-[10px] font-black text-primary/70 uppercase flex items-center gap-1">
                            <Fingerprint className="w-3 h-3" /> {doc.projectCode || doc.resolutionNumber}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-bold">
                      {new Date((category === 'extension' ? doc.uploadDate : (doc.date || doc.uploadDate)) || 0).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-right pr-12">
                      <div className="flex justify-end gap-2">
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                                <MoreVertical className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem asChild className="gap-2 font-bold cursor-pointer">
                                <Link href={`/documents/${doc.id}/edit`}>
                                  <Pencil className="w-4 h-4" /> Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="gap-2 text-destructive font-bold focus:bg-destructive/10 focus:text-destructive cursor-pointer" 
                                onClick={() => handleDelete(doc.id)}
                              >
                                <Trash2 className="w-4 h-4" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && filteredDocs.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="py-32 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs">No se encontraron registros con los filtros seleccionados</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
