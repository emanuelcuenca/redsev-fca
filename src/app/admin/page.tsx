
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  UserCog, 
  Search,
  Loader2,
  UserCheck,
  ChevronDown,
  Lock
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

interface AppUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  role: "Admin" | "Authority" | "User";
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
    (user && currentAdminDoc) ? query(collection(db, 'users'), orderBy('name', 'asc')) : null,
    [db, user, currentAdminDoc]
  );
  const { data: allUsers, isLoading: isUsersLoading } = useCollection<AppUser>(usersQuery);

  const adminsQuery = useMemoFirebase(() => 
    (user && currentAdminDoc) ? collection(db, 'roles_admin') : null, 
    [db, user, currentAdminDoc]
  );
  const { data: adminRoles } = useCollection(adminsQuery);

  const authorityQuery = useMemoFirebase(() => 
    (user && currentAdminDoc) ? collection(db, 'roles_authority') : null, 
    [db, user, currentAdminDoc]
  );
  const { data: authorityRoles } = useCollection(authorityQuery);

  const adminIds = new Set(adminRoles?.map(a => a.id) || []);
  const authorityIds = new Set(authorityRoles?.map(a => a.id) || []);

  const filteredUsers = allUsers?.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const changeUserRole = (userId: string, newRole: "Admin" | "Authority" | "User") => {
    if (userId === user?.uid) {
      toast({ variant: "destructive", title: "Acción no permitida", description: "No puedes cambiar tu propio rol." });
      return;
    }

    const adminRef = doc(db, 'roles_admin', userId);
    const authRef = doc(db, 'roles_authority', userId);
    const userProfileRef = doc(db, 'users', userId);

    // Limpiar roles actuales en colecciones de permisos
    deleteDocumentNonBlocking(adminRef);
    deleteDocumentNonBlocking(authRef);

    // Asignar nuevo rol
    if (newRole === "Admin") {
      setDocumentNonBlocking(adminRef, { assignedAt: new Date().toISOString() }, { merge: true });
    } else if (newRole === "Authority") {
      setDocumentNonBlocking(authRef, { assignedAt: new Date().toISOString() }, { merge: true });
    }

    // Actualizar campo role en el perfil del usuario para lógica UI
    updateDocumentNonBlocking(userProfileRef, { role: newRole });

    toast({ title: "Rol actualizado", description: `El usuario ahora tiene el nivel: ${newRole}` });
  };

  const getRoleLabel = (id: string) => {
    if (adminIds.has(id)) return "Administrador";
    if (authorityIds.has(id)) return "Autoridad";
    return "Usuario";
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl"><UserCog className="w-6 h-6 text-primary" /></div>
              <div>
                <h2 className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight">Control de Accesos</h2>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Asignación de jerarquías institucionales</p>
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
                      <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest">Usuario</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Nivel de Permisos</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Fecha Registro</TableHead>
                      <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const roleLabel = getRoleLabel(u.id);
                      const isMe = u.id === user?.uid;
                      
                      return (
                        <TableRow key={u.id} className="group transition-colors hover:bg-primary/[0.02]">
                          <TableCell className="py-5 pl-8">
                            <div className="flex flex-col">
                              <span className="font-bold text-base">
                                {u.name || 'Sin nombre'} {isMe && <Badge className="bg-primary/20 text-primary ml-2 text-[8px]">TÚ</Badge>}
                              </span>
                              <span className="text-xs text-muted-foreground font-medium">{u.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`font-black text-[9px] uppercase tracking-widest px-3 border-none ${
                              roleLabel === 'Administrador' ? 'bg-primary/10 text-primary' : 
                              roleLabel === 'Autoridad' ? 'bg-accent/10 text-accent-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                              {roleLabel === 'Administrador' && <ShieldCheck className="w-3 h-3 mr-1.5" />}
                              {roleLabel === 'Autoridad' && <UserCheck className="w-3 h-3 mr-1.5" />}
                              {roleLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-muted-foreground">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </TableCell>
                          <TableCell className="pr-8 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-xl h-8 text-[9px] font-black uppercase" disabled={isMe}>
                                  Cambiar Rol <ChevronDown className="w-3 h-3 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem className="font-bold gap-2" onClick={() => changeUserRole(u.id, "Admin")}>
                                  <ShieldCheck className="w-4 h-4 text-primary" /> Administrador
                                </DropdownMenuItem>
                                <DropdownMenuItem className="font-bold gap-2" onClick={() => changeUserRole(u.id, "Authority")}>
                                  <UserCheck className="w-4 h-4 text-accent" /> Autoridad
                                </DropdownMenuItem>
                                <DropdownMenuItem className="font-bold gap-2" onClick={() => changeUserRole(u.id, "User")}>
                                  <Lock className="w-4 h-4 text-muted-foreground" /> Usuario
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Administrador", desc: "Acceso total. Carga, edición, eliminación y gestión de todos los usuarios.", icon: ShieldCheck, color: "text-primary" },
              { title: "Autoridad", desc: "Acceso a registros, visualización directa de archivos y panel de estadísticas.", icon: UserCheck, color: "text-accent" },
              { title: "Usuario", desc: "Solo visualiza metadatos. Debe solicitar permiso expreso para ver archivos adjuntos.", icon: Lock, color: "text-muted-foreground" }
            ].map((role, i) => (
              <div key={i} className="bg-white border p-6 rounded-2xl shadow-sm">
                <role.icon className={`w-8 h-8 ${role.color} mb-4`} />
                <h4 className="font-headline font-bold uppercase text-sm mb-2">{role.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">{role.desc}</p>
              </div>
            ))}
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
