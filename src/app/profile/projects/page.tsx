"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FolderHeart, 
  Loader2, 
  ArrowLeft,
  ArrowLeftRight,
  User,
  Users,
  Calendar,
  Eye,
  ChevronRight,
  FileText
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { AgriculturalDocument, formatPersonName } from "@/lib/mock-data";

export default function MyProjectsPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userProfileRef = useMemoFirebase(() => 
    user ? doc(db, 'users', user.uid) : null, 
    [db, user]
  );
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const projectsQuery = useMemoFirebase(() => 
    user ? query(collection(db, 'documents'), where('type', '==', 'Proyecto'), where('extensionDocType', '==', 'Proyecto de Extensión')) : null,
    [db, user]
  );
  const { data: allProjects, isLoading: isProjectsLoading } = useCollection<AgriculturalDocument>(projectsQuery);

  const myProjects = useMemo(() => {
    if (!allProjects || !profile) return { asDirector: [], asTeam: [] };

    const firstName = (profile.firstName || "").toLowerCase().trim();
    const lastName = (profile.lastName || "").toLowerCase().trim();

    const asDirector = allProjects.filter(p => 
      p.director?.firstName?.toLowerCase().trim() === firstName && 
      p.director?.lastName?.toLowerCase().trim() === lastName
    );

    const asTeam = allProjects.filter(p => {
      // Evitar duplicados si es director e integrante a la vez (aunque no debería ocurrir por lógica institucional)
      const isDir = p.director?.firstName?.toLowerCase().trim() === firstName && 
                    p.director?.lastName?.toLowerCase().trim() === lastName;
      
      if (isDir) return false;

      return p.authors?.some(a => 
        a.firstName?.toLowerCase().trim() === firstName && 
        a.lastName?.toLowerCase().trim() === lastName
      );
    });

    return { asDirector, asTeam };
  }, [allProjects, profile]);

  if (!mounted || isUserLoading || isProfileLoading || isProjectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const totalProjects = myProjects.asDirector.length + myProjects.asTeam.length;

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

        <main className="p-4 md:p-8 max-w-5xl mx-auto w-full pb-32">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl"><FolderHeart className="w-6 h-6 text-primary" /></div>
              <div>
                <h2 className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight">Mis Proyectos</h2>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Participación en la SEyV FCA-UNCA</p>
              </div>
            </div>
            <div className="bg-white border rounded-2xl px-6 py-3 flex items-center gap-4 shadow-sm">
              <div className="text-center">
                <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Total</p>
                <p className="text-xl font-black text-primary leading-none">{totalProjects}</p>
              </div>
              <div className="w-px h-8 bg-muted" />
              <div className="text-center">
                <p className="text-[9px] font-black text-muted-foreground uppercase leading-none mb-1">Director</p>
                <p className="text-xl font-black text-primary leading-none">{myProjects.asDirector.length}</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="director" className="space-y-8">
            <TabsList className="bg-muted/50 p-1 rounded-xl h-12">
              <TabsTrigger value="director" className="rounded-lg px-8 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Director
              </TabsTrigger>
              <TabsTrigger value="team" className="rounded-lg px-8 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Equipo Técnico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="director" className="animate-in fade-in slide-in-from-left-2 duration-300">
              <ProjectList projects={myProjects.asDirector} emptyMessage="No figura como director en ningún proyecto registrado." />
            </TabsContent>

            <TabsContent value="team" className="animate-in fade-in slide-in-from-right-2 duration-300">
              <ProjectList projects={myProjects.asTeam} emptyMessage="No figura como integrante de equipo técnico en ningún proyecto." />
            </TabsContent>
          </Tabs>

          <div className="mt-12 flex justify-center border-t pt-12">
            <Button variant="ghost" className="font-bold text-[10px] uppercase h-10 tracking-widest text-muted-foreground" onClick={() => router.push("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
            </Button>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ProjectList({ projects, emptyMessage }: { projects: AgriculturalDocument[], emptyMessage: string }) {
  if (projects.length === 0) {
    return (
      <div className="py-24 text-center border-2 border-dashed rounded-[3rem] bg-muted/5">
        <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="font-bold text-muted-foreground text-sm uppercase tracking-widest">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {projects.map((project) => (
        <Card key={project.id} className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group hover:scale-[1.01] transition-all duration-300">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              <div className="bg-primary/5 p-8 md:w-1/3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-primary/10">
                <div className="space-y-4">
                  <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase tracking-widest px-3 h-6">
                    {project.projectCode}
                  </Badge>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">
                      Registrado: {new Date(project.uploadDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="mt-8">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Director</p>
                  <p className="font-bold text-sm text-primary">{formatPersonName(project.director)}</p>
                </div>
              </div>
              
              <div className="p-8 flex-1 flex flex-col justify-between gap-6">
                <div>
                  <h3 className="text-xl font-headline font-bold text-foreground leading-tight mb-4 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground font-medium line-clamp-2 italic mb-4">
                      "{project.description}"
                    </p>
                  )}
                  {project.authors && project.authors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {project.authors.slice(0, 3).map((a, i) => (
                        <Badge key={i} variant="secondary" className="bg-muted text-muted-foreground font-bold text-[8px] uppercase px-2 h-5">
                          {a.lastName}
                        </Badge>
                      ))}
                      {project.authors.length > 3 && (
                        <span className="text-[8px] font-bold text-muted-foreground uppercase flex items-center">+{project.authors.length - 3} más</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-dashed">
                  <Button asChild variant="outline" className="rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest border-primary text-primary hover:bg-primary/5 transition-all">
                    <Link href={`/documents/${project.id}`}>
                      Ver Expediente <ChevronRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
