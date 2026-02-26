
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  FileText, 
  Users, 
  Loader2,
  Calendar,
  ChevronRight
} from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { UserMenu } from "@/components/layout/user-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, doc, query } from "firebase/firestore";
import { AgriculturalDocument } from "@/lib/mock-data";
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  Pie, 
  PieChart,
  CartesianGrid
} from "recharts";
import { toast } from "@/hooks/use-toast";

export default function AdminStatsPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
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
        toast({ variant: "destructive", title: "Acceso denegado" });
      }
    }
  }, [user, currentAdminDoc, isUserLoading, isAdminCheckLoading, mounted, router]);

  const docsQuery = useMemoFirebase(() => 
    (user && currentAdminDoc) ? collection(db, 'documents') : null,
    [db, user, currentAdminDoc]
  );
  const { data: allDocs, isLoading: isDocsLoading } = useCollection<AgriculturalDocument>(docsQuery);

  const statsByType = useMemo(() => {
    if (!allDocs) return [];
    const counts: Record<string, number> = {};
    allDocs.forEach(d => {
      const type = d.type || 'Otro';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allDocs]);

  const statsByYear = useMemo(() => {
    if (!allDocs) return [];
    const counts: Record<string, number> = {};
    allDocs.forEach(d => {
      const date = d.date || d.uploadDate;
      if (date) {
        const year = new Date(date).getFullYear();
        counts[year] = (counts[year] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [allDocs]);

  const COLORS = ['#2e7d32', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

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
          <div className="flex-1 text-center font-headline font-bold text-primary uppercase">Estadísticas Institucionales</div>
          <div className="flex items-center gap-3 shrink-0"><UserMenu /></div>
        </header>

        <main className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl md:text-3xl font-headline font-bold uppercase tracking-tight">Panel de Estadísticas</h2>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Métricas del Repositorio Digital SEyV</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="rounded-3xl border-none shadow-lg bg-white overflow-hidden border-l-4 border-primary">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-primary">Total Documentos</CardDescription>
                <CardTitle className="text-4xl font-black font-headline text-primary">{allDocs?.length || 0}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-full" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="rounded-3xl border-none shadow-lg bg-white overflow-hidden border-l-4 border-accent">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-accent">Categorías</CardDescription>
                <CardTitle className="text-4xl font-black font-headline text-accent">{statsByType.length}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-1 bg-accent/10 rounded-full overflow-hidden">
                  <div className="h-full bg-accent w-full" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-none shadow-lg bg-white overflow-hidden border-l-4 border-muted-foreground">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Registros por Año</CardDescription>
                <CardTitle className="text-4xl font-black font-headline text-muted-foreground">
                  {statsByYear.length}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-muted-foreground/30 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-6 md:p-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-headline font-bold uppercase text-primary flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" /> Distribución por Tipo
                </CardTitle>
                <CardDescription className="font-bold text-[10px] uppercase tracking-widest">Desglose porcentual del repositorio</CardDescription>
              </CardHeader>
              <CardContent className="px-0 h-[350px]">
                {isDocsLoading ? (
                  <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statsByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
              <div className="grid grid-cols-2 gap-3 mt-4 border-t pt-6">
                {statsByType.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate">{s.name}: {s.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-6 md:p-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-headline font-bold uppercase text-primary flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" /> Evolución Temporal
                </CardTitle>
                <CardDescription className="font-bold text-[10px] uppercase tracking-widest">Documentos registrados por año</CardDescription>
              </CardHeader>
              <CardContent className="px-0 h-[350px]">
                {isDocsLoading ? (
                  <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsByYear}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="year" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#888' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 'bold', fill: '#888' }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(46, 125, 50, 0.05)' }}
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="count" fill="#2e7d32" radius={[10, 10, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
