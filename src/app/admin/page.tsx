
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  UserCog, 
  Search,
  Loader2,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, orderBy, Timestamp } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

interface AppUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  role: string;
}

interface AdminRole {
  id: string;
  assignedAt?: string | Timestamp;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

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
        toast({
          variant: "destructive",
          title: "Acceso denegado",
          description: "No tienes permisos de administrador.",
        });
      }
    }
  }, [user, currentAdminDoc, isUserLoading, isAdminCheckLoading, mounted, router]);

  const usersQuery = useMemoFirebase(() => 
    query(collection(db, 'users'), orderBy('name', 'asc')),
    [db]
  );
  const { data: allUsers, isLoading: isUsersLoading } = useCollection<AppUser>(usersQuery);

  const adminsQuery = useMemoFirebase(() => collection(db, 'roles_admin'), [db]);
  const { data: adminRoles } = useCollection<AdminRole>(adminsQuery);

  const adminMap = new Map(adminRoles?.map(a => [a.id, a.assignedAt]) || []);

  const filteredUsers = allUsers?.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const toggleAdminRole = (userId: string, isCurrentlyAdmin: boolean) => {
    const roleRef = doc(db, 'roles_admin', userId);
    
    if (isCurrentlyAdmin) {
      if (userId === user?.uid) {
        toast({
          variant: "destructive",
          title: "Acción no permitida",
          description: "No puedes quitarte tus propios permisos de administrador.",
        });
        return;
      }
      deleteDocumentNonBlocking(roleRef);
      toast({
        title: "Permisos revocados",
        description: "El usuario ya no es administrador.",
      });
    } else {
      setDocumentNonBlocking(roleRef, { assignedAt: new Date().toISOString() }, { merge: true });
      toast({
        title: "Permisos otorgados",
        description: "El usuario ahora es administrador.",
      });
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return 'Fecha no registrada';
    try {
      if (dateValue instanceof Timestamp) {
        return dateValue.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return new Date(dateValue).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return 'Formato inválido';
    }
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

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <UserCog className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-3xl font-headline font-bold tracking-tight uppercase">Gestión de Usuarios</h2>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Control de accesos y roles institucionales</p>
              </div>
            </div>
          </div>

          <Card className="rounded-[2rem] border-muted shadow-xl overflow-hidden mb-8">
            <CardHeader className="bg-muted/30 pb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Buscar por nombre o correo electrónico..." 
                  className="pl-11 h-12 rounded-xl border-muted-foreground/20 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isUsersLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                  <p className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Cargando base de usuarios...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Usuario</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Rol Institucional</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Fecha de Registro</TableHead>
                      <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const assignedAt = adminMap.get(u.id);
                      const isAdmin = adminMap.has(u.id);
                      const isMe = u.id === user?.uid;
                      
                      return (
                        <TableRow key={u.id} className="group transition-colors hover:bg-primary/[0.02]">
                          <TableCell className="py-5 pl-8">
                            <div className="flex flex-col">
                              <span className="font-bold text-base group-hover:text-primary transition-colors">
                                {u.name || 'Sin nombre'} {isMe && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">TÚ</span>}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">{u.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isAdmin ? (
                              <div className="flex flex-col gap-1">
                                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-black text-[9px] uppercase tracking-widest px-3 w-fit">
                                  <ShieldCheck className="w-3 h-3 mr-1.5" /> Administrador
                                </Badge>
                                <span className="text-[9px] text-muted-foreground font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Asignado: {formatDate(assignedAt)}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground font-black text-[9px] uppercase tracking-widest px-3">
                                <XCircle className="w-3 h-3 mr-1.5" /> Usuario Común
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-bold text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell className="pr-8 text-right">
                            <Button 
                              variant={isAdmin ? "destructive" : "default"} 
                              size="sm"
                              className="rounded-xl h-8 text-[9px] font-black uppercase tracking-widest px-4 transition-all"
                              onClick={() => toggleAdminRole(u.id, isAdmin)}
                              disabled={isMe}
                            >
                              {isAdmin ? "Quitar Admin" : "Hacer Admin"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              {filteredUsers.length === 0 && !isUsersLoading && (
                <div className="py-20 text-center border-t border-dashed">
                  <Users className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="font-bold text-muted-foreground uppercase tracking-tight">No se encontraron usuarios</p>
                </div>
              )}
            </CardContent>
          </Card>

          <section className="bg-primary/5 border border-primary/10 rounded-2xl p-6 md:p-8 flex items-start gap-6">
            <div className="bg-primary/10 p-3 rounded-xl shrink-0">
              <ShieldAlert className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-headline font-bold text-primary uppercase mb-2">Sobre los roles de administración</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                Los administradores de la Secretaría tienen acceso total al repositorio institucional, pudiendo cargar, editar y eliminar documentos. 
                Utilice esta herramienta con precaución: otorgue permisos de administrador únicamente al personal autorizado de la Secretaría de Extensión y Vinculación.
              </p>
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
