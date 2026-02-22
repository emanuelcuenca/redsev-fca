"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  LogOut,
  Leaf,
  ShieldCheck,
  Handshake,
  Sprout,
  UploadCloud
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export function MainSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const db = useFirestore();

  const adminRef = useMemoFirebase(() => 
    user ? doc(db, 'roles_admin', user.uid) : null, 
    [db, user]
  );
  
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  // Reordenado: Extensión antes que Convenios
  const NAV_ITEMS = [
    { icon: LayoutDashboard, label: "Inicio", href: "/" },
    { icon: Sprout, label: "Extensión", href: "/documents?category=extension" },
    { icon: Handshake, label: "Convenios", href: "/documents?category=convenios" },
  ];

  const ADMIN_ITEMS = [
    { icon: UploadCloud, label: "Cargar Documento", href: "/upload" },
  ];

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="py-6 flex flex-row items-center gap-3 px-4">
        <div className="bg-primary text-primary-foreground p-2 rounded-xl shrink-0 shadow-lg shadow-primary/20">
          <Leaf className="w-6 h-6" />
        </div>
        <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.15em] mb-0.5">
            Extensión y Vinculación
          </span>
          <span className="font-headline font-black text-xl tracking-tight uppercase text-primary leading-none">
            FCA - UNCA
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 gap-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href.includes('?') && pathname + '?' + searchParams.toString() === item.href);
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  tooltip={item.label}
                  className="h-11 rounded-xl px-4 font-bold transition-all"
                >
                  <Link href={item.href} className="flex items-center gap-4">
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          {isAdmin && (
            <>
              <SidebarSeparator className="my-3 mx-4" />
              <div className="px-5 py-1 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] group-data-[collapsible=icon]:hidden mb-1">
                Administración
              </div>
              {ADMIN_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className="h-11 rounded-xl px-4 font-bold text-primary bg-primary/5 hover:bg-primary/10"
                  >
                    <Link href={item.href} className="flex items-center gap-4">
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border bg-sidebar-accent/30">
        <SidebarMenu className="gap-1">
          {isAdmin && (
            <SidebarMenuItem>
              <div className="flex items-center gap-2 px-3 py-2 text-[10px] text-primary font-black bg-primary/10 rounded-xl group-data-[collapsible=icon]:hidden uppercase tracking-widest border border-primary/20 mb-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Secretaría
              </div>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Ajustes" className="h-10 rounded-xl px-4 font-bold text-muted-foreground">
              <Settings className="w-5 h-5" />
              <span>Ajustes</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild variant="default" className="h-10 rounded-xl px-4 font-bold text-destructive hover:bg-destructive/10">
              <Link href="/login">
                <LogOut className="w-5 h-5" />
                <span>Cerrar Sesión</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}