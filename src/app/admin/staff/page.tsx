
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Contact, 
  Search, 
  Loader2, 
  Trash2, 
  UserPlus, 
  Briefcase,
  Pencil,
  GraduationCap
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

const ACADEMIC_RANKS = ["Auxiliar", "JTP", "Adjunto", "Asociado", "Titular"];

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
    academicRank: "Auxiliar",
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

  const staffQuery = useMemoFirebase(() => 
    (user && currentAdminDoc) ? query(collection(db, 'staff'), orderBy('lastName', 'asc')) : null,
    [db, user, currentAdminDoc]
  );
  const { data: staffList, isLoading: isStaffLoading } = useCollection<StaffMember>(staffQuery);

  const filteredStaff = staffList?.filter(s => 
    s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (member: StaffMember) => {
    setEditingId(member.id);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      academicRank: member.academicRank || "Auxiliar",
      email: member.email || ""
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      toast({ variant: "destructive", title: "Campos incompletos" });
      return;
    }

    setIsSaving(true);
    const data = {
      ...formData,
      category: "Docente",
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      updateDocumentNonBlocking(doc(db, 'staff', editingId), data);
      toast({ title: "Extensionista actualizado", description: "Los cambios han sido guardados." });
    } else {
      addDocumentNonBlocking(collection(db, 'staff'), data);
      toast({ title: "Extensionista guardado", description: "El banco de extensionistas ha sido actualizado." });
    }

    setIsSaving(false);
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ firstName: "", lastName: "", academicRank: "Auxiliar", email: "" });
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

  return (
    <SidebarProvider>
      <MainSidebar />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 shrink-0"><SidebarTrigger /></div>
          <div className="flex-1 text-center font-headline font-bold text-primary uppercase">Banco de Extensionistas</div>
          <div className="flex items-center gap-3 shrink-0"><UserMenu /></div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl"><Contact className="w-6 h-6 text-primary" /></div>
              <div>
                <h2 className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight">Gestión de Extensionistas</h2>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Base de datos de extensionistas FCA</p>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingId(null);
                setFormData({ firstName: "", lastName: "", academicRank: "Auxiliar", email: "" });
              }
            }}>
              <DialogTrigger asChild>
                <Button className="rounded-xl bg-primary h-12 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                  <UserPlus className="w-4 h-4 mr-2" /> Agregar Extensionista
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="font-headline font-bold uppercase text-primary">
                    {editingId ? "Editar Extensionista" : "Nuevo Extensionista"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Apellido</Label>
                      <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="h-12 rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Nombre</Label>
                      <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="h-12 rounded-xl" required />
                    </div>
                  </div>
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
                    <Label className="text-[10px] font-black uppercase tracking-widest">Email (Opcional)</Label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12 rounded-xl" />
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

          <Card className="rounded-[2rem] border-muted shadow-xl overflow-hidden mb-8">
            <CardHeader className="bg-muted/30">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Buscar extensionista por Apellido o Nombre..." 
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
                      <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest">Extensionista (Apellido y Nombre)</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Cargo / Escalafón</TableHead>
                      <TableHead className="pr-8 text-right font-black text-[10px] uppercase tracking-widest">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((person) => (
                      <TableRow key={person.id} className="group hover:bg-primary/[0.02]">
                        <TableCell className="py-5 pl-8 font-bold">{person.lastName}, {person.firstName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-black text-[9px] uppercase tracking-widest px-3 border-primary/20 text-primary bg-primary/5">
                            <GraduationCap className="w-3 h-3 mr-1.5" />
                            {person.academicRank || "Auxiliar"}
                          </Badge>
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
