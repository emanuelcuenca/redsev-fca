
"use client";

import Link from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  LayoutDashboard, 
  ShieldCheck,
  Handshake,
  ArrowLeftRight,
  UploadCloud,
  Users,
  ScrollText,
  GraduationCap,
  Gavel,
  Plane
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export function MainSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const db = useFirestore();
  const { setOpenMobile, isMobile } = useSidebar();

  const adminRef = useMemoFirebase(() => 
    user ? doc(db, 'roles_admin', user.uid) : null, 
    [db, user]
  );
  
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  const NAV_ITEMS = [
    { icon: LayoutDashboard, label: "Inicio", href: "/" },
    { icon: ArrowLeftRight, label: "Extensión", href: "/documents?category=extension" },
    { icon: Handshake, label: "Convenios", href: "/documents?category=convenios" },
    { icon: GraduationCap, label: "Prácticas y Pasantías", href: "/documents?category=pasantias" },
    { icon: Plane, label: "Movilidad", href: "/documents?category=movilidad" },
    { icon: ScrollText, label: "Resoluciones y Reglamentos", href: "/documents?category=resoluciones-reglamentos" },
  ];

  const ADMIN_ITEMS = [
    { icon: UploadCloud, label: "Cargar Documento", href: "/upload" },
    { icon: Users, label: "Gestión de Usuarios", href: "/admin" },
  ];

  const handleItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="py-6 flex flex-row items-center gap-3 px-4">
        <div className="bg-primary text-primary-foreground w-11 h-11 rounded-none shrink-0 shadow-lg shadow-primary/20 flex items-center justify-center">
          <span className="font-black text-xl tracking-tighter">SEV</span>
        </div>
        <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden overflow-hidden">
          <span className="font-headline font-black text-2xl tracking-tighter uppercase text-primary leading-none mb-1">
            FCA - UNCA
          </span>
          <span className="text-[13px] text-muted-foreground font-medium uppercase tracking-[0.1em] leading-tight">
            Extensión y Vinculación
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 gap-1.5">
          {NAV_ITEMS.map((item) => {
            const currentHref = pathname + (searchParams.toString() ? '?' + searchParams.toString() : '');
            const isActive = currentHref === item.href;
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  tooltip={item.label}
                  className="h-12 rounded-xl px-4 font-bold transition-all"
                  onClick={handleItemClick}
                >
                  <Link href={item.href} className="flex items-center gap-4">
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm md:text-base">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          {isAdmin && (
            <>
              <SidebarSeparator className="my-4 mx-4" />
              <div className="px-5 py-1 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] group-data-[collapsible=icon]:hidden mb-1">
                Administración
              </div>
              {ADMIN_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className="h-12 rounded-xl px-4 font-bold text-primary bg-primary/5 hover:bg-primary/10"
                    onClick={handleItemClick}
                  >
                    <Link href={item.href} className="flex items-center gap-4">
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm md:text-base">{item.label}</span>
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
            <div className="px-4 py-2 text-[10px] text-muted-foreground font-bold italic group-data-[collapsible=icon]:hidden">
              VínculoAgro v1.0
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
