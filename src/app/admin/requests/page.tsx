
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BellRing, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  User,
  FileText,
  Search
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

interface AccessRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  documentId: string;
  documentTitle: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
}

export default function RequestsAdminPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const adminCheckRef = useMemoFirebase(() => 
    user ? doc(db, 'roles_admin', user.uid) : null, 
    [db, user]
  );
  const { data: currentAdminDoc, isLoading: isAdminCheckLoading } = useDoc(adminCheckRef);

  useEffect(() => {
    if (mounted && !isUserLoading && !isAdminCheckLoading) {
      if (!user || !currentAdminDoc) {
        router.push('/');
        toast({ variant: "destructive", title: "Acceso denegado" });
      }
    }
  }, [user, currentAdminDoc, isUserLoading, isAdminCheckLoading, mounted, router]);

  const requestsQuery = useMemoFirebase(() => 
    (user && currentAdminDoc) ? query(collection(db, 'access_requests'), orderBy('createdAt', 'desc')) : null,
    [db, user, currentAdminDoc]
  );
  const { data: allRequests, isLoading: isRequestsLoading } = useCollection<AccessRequest>(requestsQuery);

  const filteredRequests = allRequests?.filter(r => 
    r.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.documentTitle.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleStatusChange = (requestId: string, newStatus: 'approved' | 'denied') => {
    updateDocumentNonBlocking(doc(db, 'access_requests', requestId), {
      status: newStatus,
      resolvedAt: new Date().toISOString()
    });
    toast({ 
      title: newStatus === 'approved' ? "Solicitud Aprobada" : "Solicitud Denegada",
      description: "El estado ha sido actualizado para el usuario."
    });
  };

  if (!mounted || isUserLoading || isAdminCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0"><SidebarTrigger /></div>
          <div className="flex-1 flex justify-center overflow-hidden px-2">
            <div className="flex flex-col items-center leading-none text-center gap-1 w-full">
              <span className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-2xl font-headline text-primary uppercase tracking-tighter font-normal whitespace-nowrap">SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN</span>
              <span className="text-[12px] min-[360px]:text-[13px] min-[390px]:text-[14px] md:text-2xl font-headline text-black uppercase tracking-tighter font-normal whitespace-nowrap">FCA - UNCA</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0"><UserMenu /></div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary/10 p-2.5 rounded-xl"><BellRing className="w-6 h-6 text-primary" /></div>
            <div>
              <h2 className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight">Solicitudes de Acceso</h2>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Autorización de visualización de archivos</p>
            </div>
          </div>

          <Card className="rounded-[2rem] border-muted shadow-xl overflow-hidden mb-8">
            <CardHeader className="bg-muted/30 pb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Filtrar por usuario o documento..." 
                  className="pl-11 h-12 rounded-xl border-muted-foreground/20 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isRequestsLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest">Usuario Solicitante</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Documento de Interés</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Estado</TableHead>
                      <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest">Resolución</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((req) => (
                      <TableRow key={req.id} className="group hover:bg-primary/[0.02]">
                        <TableCell className="py-5 pl-8">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/5 p-2 rounded-lg"><User className="w-4 h-4 text-primary/60" /></div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{req.userName}</span>
                              <span className="text-[10px] text-muted-foreground font-medium">{req.userEmail}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 max-w-xs">
                            <FileText className="w-4 h-4 text-primary/40 shrink-0" />
                            <span className="font-bold text-xs truncate">{req.documentTitle}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {req.status === 'pending' ? (
                            <Badge variant="outline" className="bg-accent/5 text-accent-foreground border-accent/20 font-black text-[8px] uppercase tracking-widest px-3 h-6">
                              <Clock className="w-3 h-3 mr-1.5" /> Pendiente
                            </Badge>
                          ) : req.status === 'approved' ? (
                            <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[8px] uppercase tracking-widest px-3 h-6">
                              <CheckCircle2 className="w-3 h-3 mr-1.5" /> Aprobado
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="font-black text-[8px] uppercase tracking-widest px-3 h-6">
                              <XCircle className="w-3 h-3 mr-1.5" /> Denegado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          {req.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                className="rounded-xl h-8 text-[9px] font-black uppercase bg-primary px-4"
                                onClick={() => handleStatusChange(req.id, 'approved')}
                              >
                                Aprobar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="rounded-xl h-8 text-[9px] font-black uppercase border-destructive text-destructive hover:bg-destructive/5 px-4"
                                onClick={() => handleStatusChange(req.id, 'denied')}
                              >
                                Denegar
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[9px] font-black uppercase text-muted-foreground">Resuelto</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!isRequestsLoading && filteredRequests.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="py-20 text-center text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Sin solicitudes registradas</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
