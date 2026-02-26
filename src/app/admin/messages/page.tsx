
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Mail, 
  Loader2, 
  CheckCircle2, 
  User, 
  Send, 
  FileText, 
  ExternalLink, 
  Trash2,
  Search,
  MessageSquare,
  Lightbulb
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc, query, orderBy } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

interface ContactRequest {
  id: string;
  userId: string;
  type: 'proposal' | 'contact';
  name: string;
  email: string;
  message: string;
  fileName?: string;
  fileDataUri?: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export default function AdminMessagesPage() {
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

  const messagesQuery = useMemoFirebase(() => 
    (user && currentAdminDoc) ? query(collection(db, 'contact_requests'), orderBy('createdAt', 'desc')) : null,
    [db, user, currentAdminDoc]
  );
  const { data: allMessages, isLoading: isMessagesLoading } = useCollection<ContactRequest>(messagesQuery);

  const filteredMessages = allMessages?.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.message.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleStatusChange = (id: string, newStatus: 'resolved' | 'pending') => {
    updateDocumentNonBlocking(doc(db, 'contact_requests', id), {
      status: newStatus
    });
    toast({ title: newStatus === 'resolved' ? "Marcado como gestionado" : "Marcado como pendiente" });
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Está seguro de eliminar este mensaje permanentemente?")) {
      deleteDocumentNonBlocking(doc(db, 'contact_requests', id));
      toast({ title: "Mensaje eliminado" });
    }
  };

  const handleReply = (msg: ContactRequest) => {
    const subject = encodeURIComponent(msg.type === 'proposal' ? 'Sobre su propuesta a la SEyV FCA-UNCA' : 'Respuesta a su consulta - SEyV FCA-UNCA');
    const body = encodeURIComponent(`Hola ${msg.name},\n\nGracias por contactar a la Secretaría de Extensión y Vinculación...\n\n---\nSu mensaje original:\n"${msg.message}"`);
    window.location.href = `mailto:${msg.email}?subject=${subject}&body=${body}`;
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

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-24">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary/10 p-2.5 rounded-xl"><Mail className="w-6 h-6 text-primary" /></div>
            <div>
              <h2 className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight">Bandeja de Entrada</h2>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Iniciativas y consultas externas</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Buscar por nombre, email o contenido..." 
                className="pl-11 h-12 rounded-xl bg-white border-muted-foreground/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="bg-muted/50 p-1 rounded-xl h-12">
              <TabsTrigger value="all" className="rounded-lg px-6 font-bold uppercase text-[10px] tracking-widest">Todos</TabsTrigger>
              <TabsTrigger value="proposal" className="rounded-lg px-6 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2"><Lightbulb className="w-3.5 h-3.5" /> Propuestas</TabsTrigger>
              <TabsTrigger value="contact" className="rounded-lg px-6 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Consultas</TabsTrigger>
            </TabsList>

            {["all", "proposal", "contact"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="grid grid-cols-1 gap-6">
                  {filteredMessages
                    .filter(m => tab === 'all' || m.type === tab)
                    .map((msg) => (
                      <Card key={msg.id} className={`rounded-[2rem] border-muted shadow-lg overflow-hidden transition-all hover:shadow-xl ${msg.status === 'resolved' ? 'opacity-70 bg-muted/20' : 'bg-white'}`}>
                        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge className={`font-black text-[9px] uppercase tracking-widest px-3 border-none h-6 ${msg.type === 'proposal' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                {msg.type === 'proposal' ? <Lightbulb className="w-3 h-3 mr-1.5" /> : <MessageSquare className="w-3 h-3 mr-1.5" />}
                                {msg.type === 'proposal' ? 'Propuesta' : 'Consulta'}
                              </Badge>
                              {msg.status === 'pending' ? (
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black text-[9px] uppercase h-6">Pendiente</Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px] uppercase h-6"><CheckCircle2 className="w-3 h-3 mr-1.5" /> Gestionado</Badge>
                              )}
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(msg.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} hs</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-primary font-black uppercase text-sm">
                                {msg.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="font-bold text-lg leading-none">{msg.name}</h3>
                                <p className="text-xs text-muted-foreground font-medium">{msg.email}</p>
                              </div>
                            </div>

                            <div className="bg-muted/30 p-6 rounded-2xl border border-muted">
                              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap italic">"{msg.message}"</p>
                            </div>

                            {msg.fileName && (
                              <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/10 rounded-xl w-fit">
                                <FileText className="w-5 h-5 text-primary/60" />
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-black uppercase text-primary/60 leading-none mb-1">Adjunto</span>
                                  <a href={msg.fileDataUri} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 truncate max-w-[200px]">
                                    {msg.fileName} <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex md:flex-col gap-2 shrink-0">
                            <Button onClick={() => handleReply(msg)} className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest bg-primary shadow-lg shadow-primary/20">
                              <Send className="w-4 h-4 mr-2" /> Responder
                            </Button>
                            {msg.status === 'pending' ? (
                              <Button variant="outline" onClick={() => handleStatusChange(msg.id, 'resolved')} className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest border-green-600/20 text-green-700 hover:bg-green-50">
                                Marcar Gestionado
                              </Button>
                            ) : (
                              <Button variant="outline" onClick={() => handleStatusChange(msg.id, 'pending')} className="rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest">
                                Reabrir Pendiente
                              </Button>
                            )}
                            <Button variant="ghost" onClick={() => handleDelete(msg.id)} className="rounded-xl h-11 px-6 text-destructive hover:bg-destructive/5 font-black uppercase text-[10px] tracking-widest">
                              <Trash2 className="w-4 h-4 mr-2" /> Borrar
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  
                  {filteredMessages.filter(m => tab === 'all' || m.type === tab).length === 0 && (
                    <div className="py-32 text-center border-2 border-dashed border-muted rounded-[3rem]">
                      <Mail className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Sin mensajes registrados en esta sección</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
