"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Contact, 
  Search, 
  Loader2, 
  Trash2, 
  UserPlus, 
  Pencil,
  Mail,
  UserCheck
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useDoc, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking 
} from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { StaffMember } from "@/lib/mock-data";

const ACADEMIC_RANKS = ["Auxiliar", "JTP", "Prof. Adjunto", "Prof. Asociado", "Prof. Titular"];
const CLAUSTROS = ["Docente", "Egresado", "Estudiante", "No docente"];
const CARRERAS = [
  "Ingeniería Agronómica",
  "Ingeniería de Paisajes",
  "Ingeniería de Alimentos",
  "Tecnicatura Univ. de Paisajes",
  "Tecnicatura Univ. en Parques y Jardines",
  "Tecnicatura Univ. en Prod. Vegetal",
  "Tecnicatura Univ. en Prod. Animal"
].sort();

export default function StaffAdminPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    claustro: "Docente",
    academicRank: "Auxiliar",
    department: "Cs. Agrarias",
    carrera: "",
    profession: "",
    email: ""
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Verificación de Admin
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

  // Suscripción al Banco de Extensionistas
  const staffQuery = useMemoFirebase(() => 
    (user && currentAdminDoc) ? query(collection(db, 'staff'), orderBy('lastName', 'asc')) : null,
    [db, user, currentAdminDoc]
  );
  const { data: staffList, isLoading: isStaffLoading } = useCollection<StaffMember>(staffQuery);

  // Suscripción a Usuarios Registrados para vinculación por email
  const usersQuery = useMemoFirebase(() => 
    (user && currentAdminDoc) ? collection(db, 'users') : null,
    [db, user, currentAdminDoc]
  );
  const { data: registeredUsers } = useCollection(usersQuery);

  // Crear un set de emails registrados para búsqueda rápida
  const registeredEmails = useMemo(() => {
    return new Set(registeredUsers?.map(u => u.email?.toLowerCase()) || []);
  }, [registeredUsers]);

  const filteredStaff = staffList?.filter(s => 
    s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (member: StaffMember) => {
    setEditingId(member.id);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      claustro: member.claustro || "Docente",
      academicRank: member.academicRank || "Auxiliar",
      department: member.department || "Cs. Agrarias",
      carrera: member.carrera || "",
      profession: member.profession || "",
      email: member.email || ""
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.claustro) {
      toast({ variant: "destructive", title: "Campos incompletos" });
      return;
    }

    setIsSaving(true);
    const data = {
      ...formData,
      email: formData.email.trim().toLowerCase(),
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      updateDocumentNonBlocking(doc(db, 'staff', editingId), data);
      toast({ title: "Extensionista actualizado" });
    } else {
      addDocumentNonBlocking(collection(db, 'staff'), data);
      toast({ title: "Extensionista guardado" });
    }

    setIsSaving(false);
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ firstName: "", lastName: "", claustro: "Docente", academicRank: "Auxiliar", department: "Cs. Agrarias", carrera: "", profession: "", email: "" });
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro de eliminar a este integrante del banco de extensionistas?")) {
      deleteDocumentNonBlocking(doc(db, 'staff', id));
      toast({ title: "Registro eliminado" });
    }
  };

  if (!mounted || isUserLoading || isAdminCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const isDocente = formData.claustro === "Docente";
  const isNoDocente = formData.claustro === "No docente";
  const isEstudiante = formData.claustro === "Estudiante";
  const isEgresado = formData.claustro === "Egresado";

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

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl"><Contact className="w-6 h-6 text-primary" /></div>
              <div>
                <h2 className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight">Banco de Extensionistas</h2>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Base de datos institucional integrada</p>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingId(null);
                setFormData({ firstName: "", lastName: "", claustro: "Docente", academicRank: "Auxiliar", department: "Cs. Agrarias", carrera: "", profession: "", email: "" });
              }
            }}>
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-primary h-12 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                  <UserPlus className="w-4 h-4 mr-2" /> Agregar al Banco
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-headline font-bold uppercase text-primary">
                    {editingId ? "Editar Extensionista" : "Nuevo Registro"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Apellido</Label>
                      <input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Nombre</Label>
                      <input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Claustro</Label>
                    <Select value={formData.claustro} onValueChange={(v) => setFormData({...formData, claustro: v})}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue placeholder="Seleccione claustro" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLAUSTROS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {isDocente && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Cargo (Escalafón)</Label>
                          <Select value={formData.academicRank} onValueChange={(v) => setFormData({...formData, academicRank: v})}>
                            <SelectTrigger className="h-12 rounded-xl">
                              <SelectValue placeholder="Seleccione cargo" />
                            </SelectTrigger>
                            <SelectContent>
                              {ACADEMIC_RANKS.map(rank => (
                                <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Dependencia</Label>
                          <input value="Cs. Agrarias" readOnly className="flex h-12 w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm font-bold" />
                        </div>
                      </>
                    )}

                    {isNoDocente && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Dependencia</Label>
                        <input value="Cs. Agrarias" readOnly className="flex h-12 w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm font-bold" />
                      </div>
                    )}

                    {isEstudiante && (
                      <>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Facultad</Label>
                          <input value="Cs. Agrarias" readOnly className="flex h-12 w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm font-bold" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Carrera</Label>
                          <Select value={formData.carrera} onValueChange={(v) => setFormData({...formData, carrera: v})}>
                            <SelectTrigger className="h-12 rounded-xl">
                              <SelectValue placeholder="Seleccione carrera" />
                            </SelectTrigger>
                            <SelectContent>
                              {CARRERAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}

                    {isEgresado && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Profesión</Label>
                        <input value={formData.profession} onChange={(e) => setFormData({...formData, profession: e.target.value})} placeholder="Ej: Ingeniero Agrónomo" className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Email Institucional</Label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="flex h-12 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm font-bold" placeholder="usuario@unca.edu.ar" />
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={isSaving} className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? "Actualizar Registro" : "Guardar Extensionista")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="rounded-[2.5rem] border-muted shadow-xl overflow-hidden mb-8">
            <CardHeader className="bg-muted/30">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Buscar por Apellido, Nombre o Email..." 
                  className="pl-11 h-12 rounded-xl border-muted-foreground/20 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isStaffLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest whitespace-nowrap">Extensionista</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap">Email / Estado</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap">Claustro / Cargo</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-widest whitespace-nowrap">Referencia</TableHead>
                        <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest whitespace-nowrap">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStaff.map((person) => {
                        const isUserLinked = person.email && registeredEmails.has(person.email.toLowerCase());
                        
                        return (
                          <TableRow key={person.id} className="group hover:bg-primary/[0.02] transition-colors">
                            <TableCell className="py-5 pl-8">
                              <div className="flex flex-col">
                                <span className="font-bold text-sm md:text-base leading-tight">{person.lastName}, {person.firstName}</span>
                                {isUserLinked && (
                                  <Badge className="w-fit bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-widest px-1.5 h-4 mt-1">
                                    <UserCheck className="w-2.5 h-2.5 mr-1" /> Vinculado
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="text-[11px] md:text-xs font-medium text-muted-foreground lowercase truncate max-w-[180px]">
                                  {person.email || 'Sin correo'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest px-3 border-primary/20 text-primary bg-primary/5 w-fit">
                                  {person.claustro || "Docente"}
                                </Badge>
                                {person.academicRank && (
                                  <span className="text-[10px] text-muted-foreground font-bold pl-1">{person.academicRank}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                {person.claustro === 'Estudiante' ? person.carrera : person.claustro === 'Egresado' ? person.profession : person.department}
                              </span>
                            </TableCell>
                            <TableCell className="pr-8 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" className="rounded-xl text-primary hover:bg-primary/10" onClick={() => handleEdit(person)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDelete(person.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredStaff.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="py-20 text-center">
                            <Contact className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                            <p className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Sin registros encontrados</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
