
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  UploadCloud, 
  Search, 
  Settings, 
  LogOut,
  Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";
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

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Panel Principal", href: "/" },
  { icon: FileText, label: "Documentos", href: "/documents" },
  { icon: UploadCloud, label: "Cargar Documento", href: "/upload" },
  { icon: Search, label: "Búsqueda Avanzada", href: "/search" },
];

export function MainSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="py-6 flex flex-row items-center gap-2 px-4">
        <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
          <Leaf className="w-5 h-5" />
        </div>
        <span className="font-headline font-bold text-lg tracking-tight group-data-[collapsible=icon]:hidden">
          VínculoAgro
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2">
          {NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.href}
                tooltip={item.label}
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Ajustes">
              <Settings className="w-4 h-4" />
              <span>Ajustes</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarSeparator className="my-2" />
          <SidebarMenuItem>
            <SidebarMenuButton asChild variant="default" className="text-destructive hover:text-destructive/80">
              <Link href="/login">
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
