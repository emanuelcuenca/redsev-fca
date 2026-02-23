
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  FileText, 
  Search, 
  User, 
  MoreVertical,
  Download,
  Eye,
  Calendar,
  Handshake,
  Building2,
  Loader2,
  ArrowLeftRight,
  ScrollText,
  GraduationCap,
  Gavel,
  Trash2,
  Plane,
  CheckCircle2,
  XCircle
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
import { Card, CardContent } from "@/components/ui/card";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, deleteDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, orderBy } from "firebase/firestore";
import { AgriculturalDocument } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";

export default function DocumentsListPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVigente, setFilterVigente] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCounterpart, setFilterCounterpart] = useState<string>("all");
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  useEffect(() => {
    if (mounted && !isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, mounted, router]);

  const adminRef = useMemoFirebase(() => 
    user ? doc(db, 'roles_admin', user.uid) : null, 
    [db, user]
  );
  
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  const docsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, 'documents'), orderBy('uploadDate', 'desc'));
  }, [db, user]);
  
  const { data: allDocs, isLoading } = useCollection<AgriculturalDocument>(docsQuery);

  const isConvenios = category === 'convenios';

  const filteredDocs = useMemo(() => {
    if (!allDocs) return [];
    return allDocs.filter(doc => {
      if (category === 'convenios' && doc.type !== 'Convenio') return false;
      if (category === 'extension' && !['Proyecto', 'Informe'].includes(doc.type)) return false;
      if (category === 'resoluciones' && doc.type !== 'Resolución') return false;
      if (category === 'pasantias' && doc.type !== 'Pasantía') return false;
      if (category === 'reglamentos' && doc.type !== 'Reglamento') return false;
      if (category === 'movilidad-estudiantil' && doc.type !== 'Movilidad Estudiantil') return false;
      if (category === 'movilidad-docente' && doc.type !== 'Movilidad Docente') return false;

      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (doc.project && doc.project.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (doc.counterpart && doc.counterpart.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            doc.authors?.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchesSearch) return false;

      if (isConvenios) {
        if (filterVigente !== "all") {
          const isVig = filterVigente === "vigente";
          if (doc.isVigente !== isVig) return false;
        }
        if (filterYear !== "all" && doc.signingYear?.toString() !== filterYear) {
          return false;
        }
        if (filterType !== "all" && doc.convenioSubType !== filterType) {
          return false;
        }
        if (filterCounterpart !== "all" && doc.counterpart !== filterCounterpart) {
          return false;
        }
      }

      return true;
    });
  }, [allDocs, searchQuery, category, isConvenios, filterVigente, filterYear, filterType, filterCounterpart]);

  const handleDelete = (docId: string, title: string) => {
    if (!isAdmin) return;
    
    deleteDocumentNonBlocking(doc(db, 'documents', docId));
    toast({
      title: "Documento eliminado",
      description: `El documento "${title}" ha sido removido del repositorio.`,
    });
  };

  const years = useMemo(() => {
    if (!allDocs) return [];
    return Array.from(new Set(allDocs.map(d => d.signingYear).filter(Boolean))).sort((a, b) => (b as number) - (a as number));
  }, [allDocs]);

  const counterparts = useMemo(() => {
    if (!allDocs) return [];
    return Array.from(new Set(allDocs.map(d => d.counterpart).filter(Boolean))).sort();
  }, [allDocs]);

  const pageTitle = category === 'convenios' ? 'Convenios' : 
                    category === 'extension' ? 'Extensión' : 
                    category === 'resoluciones' ? 'Resoluciones' :
                    category === 'pasantias' ? 'Prácticas y Pasantías' :
                    category === 'reglamentos' ? 'Reglamentos' :
                    category === 'movilidad-estudiantil' ? 'Movilidad Estudiantil' :
                    category === 'movilidad-docente' ? 'Movilidad Docente' :
                    'Todos los Documentos';

  const PageIcon = category === 'convenios' ? Handshake : 
                   category === 'extension' ? ArrowLeftRight : 
                   category === 'resoluciones' ? ScrollText :
                   category === 'pasantias' ? GraduationCap :
                   category === 'reglamentos' ? Gavel :
                   category === 'movilidad-estudiantil' ? Plane :
                   category === 'movilidad-docente' ? Plane :
                   FileText;

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
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <SidebarTrigger />
          </div>
          <div className="flex-1 flex justify-center overflow-hidden px-2">
            <div className="flex flex-col items-center leading-none text-center gap-1 w-full">
              <span className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-2xl font-headline text-primary uppercase tracking-tighter font-normal whitespace-nowrap">
                SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN
              </span>
              <span className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-2xl font-headline text-black uppercase tracking-tighter font-normal whitespace-nowrap">
                FCA - UNCA
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <UserMenu />
          </div>
        </header>

        <main className="p-4 md:p-8 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <PageIcon className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl md:text-3xl font-headline font-bold tracking-tight uppercase">{pageTitle}</h2>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input 
                  placeholder={isConvenios ? "Buscar convenios..." : "Buscar por título, proyecto o autor..."} 
                  className="pl-12 h-14 rounded-2xl text-sm md:text-base border-muted-foreground/20 focus:ring-primary/10 shadow-sm font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {isConvenios && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Select value={filterVigente} onValueChange={setFilterVigente}>
                  <SelectTrigger className="h-11 rounded-xl border-muted-foreground/20 bg-white font-bold text-xs uppercase tracking-wider">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Estados</SelectItem>
                    <SelectItem value="vigente">Vigente</SelectItem>
                    <SelectItem value="vencido">No Vigente</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger className="h-11 rounded-xl border-muted-foreground/20 bg-white font-bold text-xs uppercase tracking-wider">
                    <SelectValue placeholder="Año de firma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Cualquier Año</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year as number} value={year!.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterCounterpart} onValueChange={setFilterCounterpart}>
                  <SelectTrigger className="h-11 rounded-xl border-muted-foreground/20 bg-white font-bold text-xs uppercase tracking-wider">
                    <SelectValue placeholder="Contraparte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las Contrapartes</SelectItem>
                    {counterparts.map(cp => (
                      <SelectItem key={cp as string} value={cp as string}>{cp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-11 rounded-xl border-muted-foreground/20 bg-white font-bold text-xs uppercase tracking-wider">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Marco o Específico</SelectItem>
                    <SelectItem value="Marco">Marco</SelectItem>
                    <SelectItem value="Específico">Específico</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setFilterVigente("all");
                    setFilterYear("all");
                    setFilterType("all");
                    setFilterCounterpart("all");
                    setSearchQuery("");
                  }}
                  className="h-11 text-[10px] uppercase font-black tracking-widest text-muted-foreground hover:text-primary col-span-2 md:col-span-1"
                >
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="font-bold uppercase tracking-widest text-xs text-muted-foreground">Actualizando repositorio...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:hidden w-full">
                {filteredDocs.map((doc) => (
                  <Card key={doc.id} className="rounded-[2rem] border-muted shadow-lg overflow-hidden border-2 bg-card w-full">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 bg-secondary text-primary">
                            {doc.type}
                          </Badge>
                          {isConvenios && (
                            <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 ${doc.isVigente ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                              {doc.isVigente ? 'Vigente' : 'Vencido'}
                            </Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1 rounded-full">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem asChild>
                              <Link href={`/documents/${doc.id}`} className="flex items-center gap-2">
                                <Eye className="w-4 h-4" /> <span>Ver Detalles</span>
                              </Link>
                            </DropdownMenuItem>
                            {isAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="gap-2 text-destructive font-bold focus:bg-destructive/10 focus:text-destructive"
                                  onClick={() => handleDelete(doc.id, doc.title)}
                                >
                                  <Trash2 className="w-4 h-4" /> <span>Eliminar</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h3 className="font-headline font-bold text-lg leading-tight mb-4 uppercase">{doc.title}</h3>
                      <div className="space-y-3">
                        {isConvenios && doc.counterpart && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4 text-primary" />
                            <span className="font-bold text-primary">{doc.counterpart}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="w-4 h-4 text-primary" />
                          <span className="font-bold truncate">{doc.authors?.join(', ') || 'SEyV FCA'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className="font-bold">
                            {mounted ? new Date(doc.date || doc.uploadDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '...'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-5 pt-4 border-t border-dashed border-muted-foreground/20 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/70 truncate max-w-[120px]">{isConvenios ? `${doc.convenioSubType} | ${doc.signingYear}` : (doc.project || doc.type)}</span>
                        <Button asChild variant="link" className="p-0 h-auto font-black text-primary text-sm hover:no-underline">
                          <Link href={`/documents/${doc.id}`}>ACCEDER →</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="hidden md:block bg-white rounded-[2.5rem] border border-muted shadow-2xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="font-black text-[12px] py-7 pl-12 uppercase tracking-[0.2em] text-muted-foreground/70">Documento</TableHead>
                      <TableHead className="font-black text-[12px] uppercase tracking-[0.2em] text-muted-foreground/70">
                        {isConvenios ? 'Contraparte' : 'Tipo'}
                      </TableHead>
                      <TableHead className="font-black text-[12px] uppercase tracking-[0.2em] text-muted-foreground/70">
                        {isConvenios ? 'Vigencia' : 'Proyecto / Sección'}
                      </TableHead>
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
                              <p className="font-black text-lg leading-tight group-hover:text-primary transition-colors uppercase">{doc.title}</p>
                              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2 font-bold">
                                <User className="w-4 h-4 text-primary/60" /> {doc.authors?.join(', ') || 'SEyV FCA'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isConvenios ? (
                            <div className="flex flex-col">
                              <span className="font-black text-primary">{doc.counterpart}</span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">{doc.convenioSubType}</span>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="font-black text-[10px] uppercase tracking-[0.15em] py-1 px-3 bg-secondary text-primary">
                              {doc.type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isConvenios ? (
                            <div className="flex items-center gap-2">
                              {doc.isVigente ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-400" />
                              )}
                              <span className={`font-bold text-sm ${doc.isVigente ? 'text-green-700' : 'text-red-700'}`}>
                                {doc.isVigente ? 'Vigente' : 'Vencido'}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-muted-foreground/90">{doc.project || doc.type}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-bold">
                          {mounted ? new Date(doc.date || doc.uploadDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '...'}
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
                                {isAdmin && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      className="gap-2 text-destructive font-bold focus:bg-destructive/10 focus:text-destructive"
                                      onClick={() => handleDelete(doc.id, doc.title)}
                                    >
                                      <Trash2 className="w-4 h-4" /> Eliminar
                                    </DropdownMenuItem>
                                  </>
                                )}
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
                  <h3 className="text-lg font-headline font-bold text-muted-foreground/60 uppercase">Sin resultados</h3>
                  <p className="text-muted-foreground font-bold">Intente ajustando los filtros de búsqueda.</p>
                </div>
              )}
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
