
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
  Trash2,
  Plane,
  CheckCircle2,
  XCircle,
  Fingerprint,
  Pencil,
  Users
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
import { AgriculturalDocument, isDocumentVigente, formatPersonName } from "@/lib/mock-data";
import { toast } from "@/hooks/use-toast";

export default function DocumentsListPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVigente, setFilterVigente] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  
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
  const { data: allDocs, isLoading } = useCollection<AgriculturalDocument>(docsQuery);

  const filteredDocs = useMemo(() => {
    if (!allDocs) return [];
    return allDocs.filter(doc => {
      if (category === 'convenios' && doc.type !== 'Convenio') return false;
      if (category === 'extension' && doc.type !== 'Proyecto') return false;
      if (category === 'resoluciones-reglamentos' && !['Resolución', 'Reglamento'].includes(doc.type)) return false;
      if (category === 'pasantias' && doc.type !== 'Pasantía') return false;
      if (category === 'movilidad' && doc.type !== 'Movilidad') return false;

      const searchableString = (doc.title + (doc.projectCode || '') + (doc.counterpart || '') + (doc.authors?.map(a => a.lastName).join(' ') || '')).toLowerCase();
      if (!searchableString.includes(searchQuery.toLowerCase())) return false;

      if (category === 'convenios' || category === 'resoluciones-reglamentos') {
        const docYear = (doc.signingYear || doc.resolutionYear || (doc.date ? new Date(doc.date).getFullYear() : null))?.toString();
        if (filterYear !== "all" && docYear !== filterYear) return false;
      }
      if (category === 'convenios' && filterVigente !== "all") {
        const isVig = isDocumentVigente(doc);
        if (isVig !== (filterVigente === "vigente")) return false;
      }
      return true;
    });
  }, [allDocs, searchQuery, category, filterVigente, filterYear]);

  const handleDelete = (docId: string) => {
    if (!isAdmin) return;
    deleteDocumentNonBlocking(doc(db, 'documents', docId));
    toast({ title: "Documento eliminado", description: `El registro ha sido removido del sistema.` });
  };

  const years = useMemo(() => {
    if (!allDocs) return [];
    const allYears = allDocs.map(d => d.signingYear || d.resolutionYear || (d.date ? new Date(d.date).getFullYear() : null)).filter(Boolean);
    return Array.from(new Set(allYears)).sort((a, b) => (b as number) - (a as number));
  }, [allDocs]);

  const pageTitle = category === 'convenios' ? 'Convenios' : category === 'extension' ? 'Extensión' : category === 'resoluciones-reglamentos' ? 'Resoluciones y Reglamentos' : category === 'pasantias' ? 'Prácticas y Pasantías' : category === 'movilidad' ? 'Movilidad' : 'Repositorio de Documentos';
  const PageIcon = category === 'convenios' ? Handshake : category === 'extension' ? ArrowLeftRight : category === 'resoluciones-reglamentos' ? ScrollText : category === 'pasantias' ? GraduationCap : category === 'movilidad' ? Plane : FileText;

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
            <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" /><Input placeholder="Buscar por título, código o responsable..." className="pl-12 h-14 rounded-2xl text-sm md:text-base border-muted-foreground/20 shadow-sm font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            {(category === 'convenios' || category === 'resoluciones-reglamentos') && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {category === 'convenios' && (<Select value={filterVigente} onValueChange={setFilterVigente}><SelectTrigger className="h-11 rounded-xl font-bold text-xs uppercase tracking-wider"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="vigente">Vigente</SelectItem><SelectItem value="vencido">Vencido</SelectItem></SelectContent></Select>)}
                <Select value={filterYear} onValueChange={setFilterYear}><SelectTrigger className="h-11 rounded-xl font-bold text-xs uppercase tracking-wider"><SelectValue placeholder="Año" /></SelectTrigger><SelectContent><SelectItem value="all">Cualquier Año</SelectItem>{years.map(y => <SelectItem key={y as number} value={y!.toString()}>{y}</SelectItem>)}</SelectContent></Select>
                <Button variant="ghost" onClick={() => { setFilterVigente("all"); setFilterYear("all"); setSearchQuery(""); }} className="h-11 text-[10px] uppercase font-black tracking-widest text-muted-foreground">Limpiar</Button>
              </div>
            )}
          </div>

          <div className="hidden md:block bg-white rounded-[2.5rem] border border-muted shadow-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="py-7 pl-12 font-black text-[12px] uppercase tracking-widest">Documento</TableHead>
                  <TableHead className="font-black text-[12px] uppercase tracking-widest">Detalles / Código</TableHead>
                  <TableHead className="font-black text-[12px] uppercase tracking-widest">Fecha</TableHead>
                  <TableHead className="pr-12 text-right font-black text-[12px] uppercase tracking-widest">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-primary/[0.03] group transition-all duration-300">
                    <TableCell className="py-8 pl-12">
                      <div className="flex items-center gap-6">
                        <div className="bg-primary/10 p-4 rounded-[1.25rem] group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                          {doc.type === 'Convenio' ? <Handshake className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="font-black text-lg leading-tight group-hover:text-primary transition-colors">{doc.title}</p>
                          <p className="text-sm text-muted-foreground mt-1 font-bold flex items-center gap-2">
                            <User className="w-4 h-4 text-primary/60" /> {doc.authors && doc.authors.length > 0 ? formatPersonName(doc.authors[0]) + (doc.authors.length > 1 ? ` +${doc.authors.length - 1}` : '') : 'Responsable SEyV'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className="font-black text-[10px] uppercase px-3 py-1 bg-secondary text-primary w-fit">{doc.extensionDocType || doc.type}</Badge>
                        {doc.projectCode && (<span className="text-[10px] font-black text-primary/70 uppercase flex items-center gap-1"><Fingerprint className="w-3 h-3" /> {doc.projectCode}</span>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-bold">{new Date(doc.date || doc.uploadDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                    <TableCell className="text-right pr-12">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-primary/10"><Link href={`/documents/${doc.id}`}><Eye className="w-5 h-5" /></Link></Button>
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-xl h-10 w-10"><MoreVertical className="w-5 h-5" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem asChild className="gap-2 font-bold cursor-pointer"><Link href={`/documents/${doc.id}/edit`}><Pencil className="w-4 h-4" /> Editar</Link></DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 text-destructive font-bold focus:bg-destructive/10 focus:text-destructive cursor-pointer" onClick={() => handleDelete(doc.id)}><Trash2 className="w-4 h-4" /> Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
