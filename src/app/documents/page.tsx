"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  FileText, 
  Search, 
  User, 
  MoreVertical,
  Handshake,
  Loader2,
  ArrowLeftRight,
  Trash2,
  Fingerprint,
  Pencil,
  Plane,
  GraduationCap,
  ScrollText,
  UserCheck,
  AlertTriangle
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  
  const [docIdToDelete, setDocIdToDelete] = useState<string | null>(null);
  
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
    
    return rawDocs.filter(docItem => {
      if (!isAdmin) {
        if (docItem.type === 'Proyecto' && docItem.extensionDocType !== 'Proyecto de Extensión') {
          return false;
        }
      }

      if (category === 'convenios' && docItem.type !== 'Convenio') return false;
      if (category === 'extension' && docItem.type !== 'Proyecto') return false;
      if (category === 'movilidad' && !['Movilidad Estudiantil', 'Movilidad Docente'].includes(docItem.type)) return false;
      if (category === 'pasantias' && docItem.type !== 'Pasantía') return false;
      if (category === 'resoluciones' && docItem.type !== 'Resolución') return false;

      const searchableString = (
        (docItem.title || "") + 
        (docItem.projectCode || '') + 
        (docItem.resolutionNumber || '') +
        (docItem.authors?.map(a => a.lastName).join(' ') || '') +
        (docItem.director?.lastName || '') +
        (docItem.student?.lastName || '')
      ).toLowerCase();
      
      if (searchQuery && !searchableString.includes(searchQuery.toLowerCase())) return false;

      const dateToUse = (category === 'extension' ? docItem.uploadDate : (docItem.date || docItem.uploadDate));
      const docYear = dateToUse ? new Date(dateToUse).getFullYear().toString() : null;
      if (filterYear !== "all" && docYear !== filterYear) return false;
      
      if (category === 'convenios' && filterVigente !== "all") {
        const isVig = isDocumentVigente(docItem);
        if (isVig !== (filterVigente === "vigente")) return false;
      }

      if (category === 'extension' && filterDirector !== "all") {
        if (formatPersonName(docItem.director) !== filterDirector) return false;
      }

      if (isAdmin && category === 'extension' && filterExtensionType !== "all") {
        if (docItem.extensionDocType !== filterExtensionType) return false;
      }

      return true;
    });
  }, [rawDocs, searchQuery, category, filterVigente, filterYear, isAdmin, filterDirector, filterExtensionType]);

  const confirmDelete = () => {
    if (!isAdmin || !docIdToDelete) return;
    
    deleteDocumentNonBlocking(doc(db, 'documents', docIdToDelete));
    toast({ 
      title: "Registro eliminado", 
      description: "El documento ha sido borrado correctamente del sistema." 
    });
    setDocIdToDelete(null);
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
      case 'Convenio': return <Handshake className="w-4 h-4 md:w-6 md:h-6" />;
      case 'Proyecto': return <ArrowLeftRight className="w-4 h-4 md:w-6 md:h-6" />;
      case 'Movilidad Estudiantil':
      case 'Movilidad Docente': return <Plane className="w-4 h-4 md:w-6 md:h-6" />;
      case 'Pasantía': return <GraduationCap className="w-4 h-4 md:w-6 md:h-6" />;
      case 'Resolución': return <ScrollText className="w-4 h-4 md:w-6 md:h-6" />;
      default: return <FileText className="w-4 h-4 md:w-6 md:h-6" />;
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
              <span className="text-[10px] md:text-2xl font-headline text-primary uppercase tracking-tighter font-normal">SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN</span>
              <span className="text-[10px] md:text-2xl font-headline text-black uppercase tracking-tighter font-normal">FCA - UNCA</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0"><UserMenu /></div>
        </header>

        <main className="p-3 md:p-8 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4 md:mb-8">
            <div className="bg-primary/10 p-2 rounded-xl">
              <PageIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <h2 className="text-lg md:text-3xl font-headline font-bold tracking-tight uppercase">{pageTitle}</h2>
          </div>
          
          <div className="space-y-3 mb-6 md:mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 md:w-5 md:h-5" />
              <Input 
                placeholder="Buscar registros..." 
                className="pl-10 md:pl-12 h-12 md:h-14 rounded-xl md:rounded-2xl text-xs md:text-base border-muted-foreground/20 shadow-sm font-medium" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
            <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2 md:gap-3">
              {category === 'convenios' && (
                <Select value={filterVigente} onValueChange={setFilterVigente}>
                  <SelectTrigger className="h-10 w-full md:w-40 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-wider bg-white">
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
                    <SelectTrigger className="h-10 w-full md:w-56 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-wider bg-white">
                      <div className="flex items-center gap-2 truncate">
                        <UserCheck className="w-3 h-3 shrink-0" />
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
                      <SelectTrigger className="h-10 w-full md:w-56 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-wider bg-white">
                        <div className="flex items-center gap-2 truncate">
                          <Fingerprint className="w-3 h-3 shrink-0" />
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
                <SelectTrigger className="h-10 w-full md:w-40 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-wider bg-white">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cualquier Año</SelectItem>
                  {years.map(y => <SelectItem key={y as number} value={y!.toString()}>{y}</SelectItem>)}
                </SelectContent>
              </Select>

              <Button variant="ghost" onClick={() => { setFilterVigente("all"); setFilterYear("all"); setFilterDirector("all"); setFilterExtensionType("all"); setSearchQuery(""); }} className="h-10 text-[9px] md:text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-auto">Limpiar Filtros</Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-muted shadow-xl md:shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="py-4 md:py-7 pl-4 md:pl-12 font-black text-[10px] md:text-[12px] uppercase tracking-widest">Registro</TableHead>
                    <TableHead className="hidden md:table-cell font-black text-[12px] uppercase tracking-widest">Código / Categoría</TableHead>
                    <TableHead className="hidden sm:table-cell font-black text-[10px] md:text-[12px] uppercase tracking-widest">Fecha</TableHead>
                    {isAdmin && <TableHead className="pr-4 md:pr-12 text-right font-black text-[10px] md:text-[12px] uppercase tracking-widest">Acciones</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={isAdmin ? 4 : 3} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : filteredDocs.map((docItem) => (
                    <TableRow 
                      key={docItem.id} 
                      className="hover:bg-primary/[0.03] group transition-all duration-300"
                    >
                      <TableCell className="py-4 md:py-8 pl-4 md:pl-12">
                        <div className="flex items-center gap-3 md:gap-6">
                          <div className="bg-primary/10 p-2 md:p-4 rounded-lg md:rounded-[1.25rem] group-hover:bg-primary group-hover:text-white transition-all shadow-sm shrink-0">
                            {getDocIcon(docItem.type)}
                          </div>
                          <div className="max-w-xs md:max-w-md">
                            <Link href={`/documents/${docItem.id}`} className="block w-fit">
                              <p className="font-black text-sm md:text-lg leading-tight text-foreground hover:text-primary transition-colors line-clamp-2 cursor-pointer">
                                {docItem.title}
                              </p>
                            </Link>
                            <div className="flex flex-col gap-1 mt-1">
                              <p className="text-[10px] md:text-sm text-muted-foreground font-bold flex items-center gap-1.5">
                                <User className="w-3 h-3 md:w-4 md:h-4 text-primary/60" /> 
                                <span className="truncate">
                                  {formatPersonName(docItem.director) !== 'Sin asignar' ? formatPersonName(docItem.director) : 
                                   (docItem.student && formatPersonName(docItem.student) !== 'Sin asignar') ? formatPersonName(docItem.student) :
                                   (docItem.authors && docItem.authors.length > 0) ? formatPersonName(docItem.authors[0]) : 'Responsable SEyV'}
                                </span>
                              </p>
                              {/* Información adicional visible solo en móvil debajo del título */}
                              <div className="flex flex-wrap items-center gap-2 md:hidden">
                                <Badge variant="secondary" className="font-black text-[8px] uppercase px-2 py-0 h-4 bg-secondary text-primary">
                                  {docItem.extensionDocType || docItem.type}
                                </Badge>
                                <span className="text-[8px] font-bold text-muted-foreground">
                                  {new Date((category === 'extension' ? docItem.uploadDate : (docItem.date || docItem.uploadDate)) || 0).toLocaleDateString('es-ES')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="font-black text-[10px] uppercase px-3 py-1 bg-secondary text-primary w-fit">{docItem.extensionDocType || docItem.type}</Badge>
                          {(docItem.projectCode || docItem.resolutionNumber) && (
                            <span className="text-[10px] font-black text-primary/70 uppercase flex items-center gap-1">
                              <Fingerprint className="w-3 h-3" /> {docItem.projectCode || docItem.resolutionNumber}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground font-bold text-xs md:text-sm">
                        {new Date((category === 'extension' ? docItem.uploadDate : (docItem.date || docItem.uploadDate)) || 0).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right pr-4 md:pr-12">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 md:h-10 md:w-10">
                                <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem asChild className="gap-2 font-bold cursor-pointer">
                                <Link href={`/documents/${docItem.id}/edit`}>
                                  <Pencil className="w-4 h-4" /> Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="gap-2 text-destructive font-bold focus:bg-destructive/10 focus:text-destructive cursor-pointer" 
                                onSelect={() => setDocIdToDelete(docItem.id)}
                              >
                                <Trash2 className="w-4 h-4" /> Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {!isLoading && filteredDocs.length === 0 && (
                    <TableRow><TableCell colSpan={isAdmin ? 4 : 3} className="py-32 text-center text-muted-foreground font-bold uppercase tracking-widest text-[10px]">No se encontraron registros</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>

        <AlertDialog open={!!docIdToDelete} onOpenChange={(open) => !open && setDocIdToDelete(null)}>
          <AlertDialogContent className="rounded-2xl md:rounded-[2rem] max-w-[90vw] md:max-w-md">
            <AlertDialogHeader className="items-center text-center">
              <div className="bg-destructive/10 p-3 md:p-4 rounded-full mb-3 md:mb-4">
                <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-destructive" />
              </div>
              <AlertDialogTitle className="font-headline font-bold uppercase text-lg md:text-xl">¿Confirmar Eliminación?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground font-medium pt-2 text-xs md:text-sm">
                Esta acción es permanente y eliminará este registro de la base de datos institucional. No se podrá recuperar.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center gap-2 md:gap-3 mt-4 md:mt-6">
              <AlertDialogCancel className="rounded-xl font-bold uppercase text-[9px] md:text-[10px] tracking-widest h-10 md:h-12 px-4 md:px-6">Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black uppercase text-[9px] md:text-[10px] tracking-widest h-10 md:h-12 px-6 md:px-8"
              >
                Eliminar Registro
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
