
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Contact, 
  Plus, 
  Search, 
  Loader2, 
  Trash2, 
  UserPlus, 
  ArrowLeft,
  GraduationCap,
  Briefcase,
  Users,
  Fingerprint
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { StaffMember } from "@/lib/mock-data";

export default function StaffAdminPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    dni: "",
    firstName: "",
    lastName: "",
    category: "Docente",
    email: ""
  });

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

  // Solo realizar la consulta si estamos seguros de que es administrador
  const staffQuery = useMemoFirebase(() => 
    (user && currentAdminDoc) ? query(collection(db, 'staff'), orderBy('lastName', 'asc')) : null,
    [db, user, currentAdminDoc]
  );
  const { data: staffList, isLoading: isStaffLoading } = useCollection<StaffMember>(staffQuery);

  const filteredStaff = staffList?.filter(s => 
    s.dni.includes(searchQuery) || 
    s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dni || !formData.firstName || !formData.lastName) {
      toast({ variant: "destructive", title: "Campos incompletos" });
      return;
    }

    setIsSaving(true);
    const staffRef = doc(db, 'staff', formData.dni);
    
    setDocumentNonBlocking(staffRef, {
      ...formData,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    toast({ title: "Registro guardado", description: "El padrón ha sido actualizado." });
    setIsSaving(false);
    setIsDialogOpen(false);
    setFormData({ dni: "", firstName: "", lastName: "", category: "Docente", email: "" });
  };

  const handleDelete = (dni: string) => {
    if (confirm("¿Está seguro de eliminar a esta persona del padrón?")) {
      deleteDocumentNonBlocking(doc(db, 'staff', dni));
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

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0"><SidebarTrigger /></div>
          <div className="flex-1 text-center font-headline font-bold text-primary uppercase">Padrón de Personas</div>
          <div className="flex items-center gap-3 shrink-0"><UserMenu /></div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl"><Contact className="w-6 h-6 text-primary" /></div>
              <div>
                <h2 className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight">Administración de Personas</h2>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Docentes, Estudiantes y Externos</p>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-primary h-12 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                  <UserPlus className="w-4 h-4 mr-2" /> Agregar al Padrón
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-headline font-bold uppercase text-primary">Nueva Persona</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">DNI / ID</Label>
                    <Input value={formData.dni} onChange={(e) => setFormData({...formData, dni: e.target.value})} placeholder="Sin puntos" className="h-12 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Nombre</Label>
                      <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Apellido</Label>
                      <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Categoría</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Docente">Docente</SelectItem>
                        <SelectItem value="Estudiante">Estudiante</SelectItem>
                        <SelectItem value="No Docente">No Docente</SelectItem>
                        <SelectItem value="Externo">Externo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Email (Opcional)</Label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12 rounded-xl" />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={isSaving} className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Registro"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="rounded-[2rem] border-muted shadow-xl overflow-hidden mb-8">
            <CardHeader className="bg-muted/30">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Buscar por DNI, Nombre o Apellido..." 
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
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest">DNI</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Nombre y Apellido</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Categoría</TableHead>
                      <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((person) => (
                      <TableRow key={person.dni} className="group hover:bg-primary/[0.02]">
                        <TableCell className="py-5 pl-8 font-mono font-bold text-primary/70">{person.dni}</TableCell>
                        <TableCell className="font-bold">{person.lastName}, {person.firstName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest px-3 border-primary/20 text-primary bg-primary/5">
                            {person.category === "Docente" && <Briefcase className="w-3 h-3 mr-1.5" />}
                            {person.category === "Estudiante" && <GraduationCap className="w-3 h-3 mr-1.5" />}
                            {person.category === "Externo" && <Users className="w-3 h-3 mr-1.5" />}
                            {person.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <Button variant="ghost" size="icon" className="rounded-xl text-destructive hover:bg-destructive/10" onClick={() => handleDelete(person.dni)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
