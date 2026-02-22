
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  FileText, 
  Calendar, 
  User, 
  ArrowRight,
  Plus,
  LayoutDashboard,
  Handshake,
  Sprout,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { MOCK_DOCUMENTS, AgriculturalDocument } from "@/lib/mock-data";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export default function Dashboard() {
  const { user } = useUser();
  const db = useFirestore();

  const adminRef = useMemoFirebase(() => 
    user ? doc(db, 'roles_admin', user.uid) : null, 
    [db, user]
  );
  
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  const recentDocuments = MOCK_DOCUMENTS.slice(0, 6);

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
              <span className="text-[11px] min-[360px]:text-[12px] min-[390px]:text-[13px] md:text-2xl font-headline text-primary uppercase tracking-tighter font-normal whitespace-nowrap">
                SECRETARÍA DE EXTENSIÓN Y VINCULACIÓN
              </span>
              <span className="text-[11px] min-[360px]:text-[12px] min-[390px]:text-[13px] md:text-2xl font-headline text-black uppercase tracking-tighter font-normal whitespace-nowrap">
                FCA - UNCA
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
             {isAdmin && (
               <Button asChild size="sm" className="hidden sm:flex bg-accent hover:bg-accent/90 text-accent-foreground font-black rounded-xl h-9 uppercase tracking-widest text-[11px]">
                 <Link href="/upload" className="flex items-center gap-2">
                   <Plus className="w-4 h-4" /> Nuevo
                 </Link>
               </Button>
             )}
             <UserMenu />
          </div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="mb-10 md:mb-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2.5 rounded-xl">
                <LayoutDashboard className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl md:text-3xl font-headline font-bold tracking-tight uppercase">
                BIENVENIDO{user?.displayName ? `, ${user.displayName.split(' ')[0].toUpperCase()}` : ''}
              </h2>
            </div>
            <p className="text-muted-foreground text-sm md:text-lg font-bold max-w-3xl leading-relaxed uppercase tracking-tight">
              Repositorio Digital de la Secretaría de Extensión y Vinculación de la Facultad de Ciencias Agrarias de la UNCA.
            </p>
          </div>

          <section className="mb-12 md:mb-20 bg-primary/5 p-6 md:p-12 rounded-[2.5rem] border border-primary/10">
            <h2 className="text-xl md:text-3xl font-headline font-bold text-primary mb-4 md:mb-6 uppercase tracking-tight leading-tight">
              Estrategias para el Desarrollo Sustentable
            </h2>
            <p className="text-sm md:text-xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
              La FCA-UNCA trabaja bajo cuatro ejes fundamentales para asegurar la transferencia efectiva del conocimiento.
            </p>
          </section>

          <div className="flex items-center justify-between mb-6 md:mb-8 border-b pb-4">
            <h3 className="text-lg md:text-2xl font-headline font-bold uppercase tracking-tight text-primary">Documentos Recientes</h3>
            <Button asChild variant="ghost" className="font-bold text-xs uppercase tracking-widest hover:text-primary">
              <Link href="/documents">Ver todos →</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {recentDocuments.map((doc) => (
              <DocumentCard key={doc.id} document={doc} />
            ))}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DocumentCard({ document }: { document: AgriculturalDocument }) {
  return (
    <Card className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-500 flex flex-col h-full bg-card rounded-3xl border-2 border-transparent hover:border-primary/5">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image 
          src={document.imageUrl} 
          alt={document.title} 
          fill 
          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
          data-ai-hint="agriculture landscape"
        />
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-background/95 backdrop-blur text-primary shadow-sm font-black text-[9px] px-3 py-1 uppercase tracking-widest border-none">
            {document.type}
          </Badge>
        </div>
      </div>
      <CardHeader className="p-6 pb-4 flex-grow">
        <CardTitle className="text-lg md:text-xl font-headline font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
          {document.title}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 mt-3 font-black text-[10px] md:text-xs uppercase tracking-widest text-primary/70">
          <Calendar className="w-4 h-4" /> {new Date(document.date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-0 flex flex-col gap-4">
        <div className="flex items-center gap-3 text-sm text-muted-foreground font-bold">
          <User className="w-4 h-4 text-primary" />
          <span className="truncate">{document.authors.join(', ')}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {document.keywords.map(tag => (
            <Badge key={tag} variant="outline" className="text-[9px] uppercase tracking-[0.1em] py-0.5 font-bold border-muted-foreground/10 bg-muted/50">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-6 mt-auto">
        <Button asChild variant="link" className="p-0 text-primary hover:text-primary/80 group/btn font-black h-auto text-sm md:text-base hover:no-underline">
          <Link href={`/documents/${document.id}`} className="flex items-center gap-2">
            Ver Detalles <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
