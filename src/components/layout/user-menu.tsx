"use client";

import Link from "next/link";
import { useState } from "react";
import { User, Briefcase, LogOut, Copy, Check, Fingerprint, ShieldCheck, UserCircle, BarChart3, BellRing, UserCheck, Mail, FileUser, FolderHeart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

export function UserMenu() {
  const { user } = useUser();
  const db = useFirestore();
  const [copied, setCopied] = useState(false);

  const userProfileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userProfile } = useDoc(userProfileRef);

  const adminRef = useMemoFirebase(() => user ? doc(db, 'roles_admin', user.uid) : null, [db, user]);
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;

  const authRef = useMemoFirebase(() => user ? doc(db, 'roles_authority', user.uid) : null, [db, user]);
  const { data: authDoc } = useDoc(authRef);
  const isAuthority = !!authDoc || isAdmin;
  
  const userPhoto = userProfile?.photoUrl || user?.photoURL || "";
  const userName = userProfile?.name || user?.displayName || user?.email?.split('@')[0] || "Usuario FCA";
  const userEmail = user?.email || "institucional@unca.edu.ar";

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0] ? parts[0][0].toUpperCase() : "U";
  };

  const copyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopied(true);
      toast({ title: "ID Copiado" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full border-2 border-primary/20 p-0 overflow-hidden hover:border-primary/40 transition-colors">
          <Avatar className="h-full w-full">
            <AvatarImage src={userPhoto} alt={userName} className="object-cover" />
            <AvatarFallback className="bg-primary text-primary-foreground font-black text-xs">{getInitials(userName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 rounded-2xl shadow-xl border-muted p-2" align="end">
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black uppercase truncate">{userName}</p>
              {isAdmin ? (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[8px] font-black uppercase px-1.5 h-5">
                  <ShieldCheck className="w-2.5 h-2.5 mr-1" /> ADMIN
                </Badge>
              ) : isAuthority ? (
                <Badge className="bg-accent/10 text-accent-foreground border-accent/20 text-[8px] font-black uppercase px-1.5 h-5">
                  <UserCheck className="w-2.5 h-2.5 mr-1" /> AUTORIDAD
                </Badge>
              ) : null}
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        
        {isAdmin && (
          <div className="px-4 pb-4">
            <div className="bg-muted/50 rounded-xl p-3 border border-muted-foreground/10 flex items-center justify-between gap-2">
              <div className="overflow-hidden">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">ID Usuario (Admin)</p>
                <p className="text-[10px] font-mono font-bold truncate text-primary/70">{user?.uid}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg shrink-0" onClick={copyUid}>
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        )}

        <DropdownMenuSeparator className="mx-2" />
        <div className="p-1">
          <DropdownMenuItem asChild className="rounded-xl gap-3 py-2.5 font-bold cursor-pointer transition-colors">
            <Link href="/profile"><UserCircle className="w-4 h-4" /><span className="text-sm">Datos Personales</span></Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="rounded-xl gap-3 py-2.5 font-bold cursor-pointer transition-colors">
            <Link href="/profile/projects"><FolderHeart className="w-4 h-4" /><span className="text-sm">Mis Proyectos</span></Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="rounded-xl gap-3 py-2.5 font-bold cursor-pointer transition-colors">
            <Link href="/profile/cv"><FileUser className="w-4 h-4" /><span className="text-sm">CV</span></Link>
          </DropdownMenuItem>
          
          {isAuthority && (
            <DropdownMenuItem asChild className="rounded-xl gap-3 py-2.5 font-bold cursor-pointer transition-colors">
              <Link href="/admin/stats"><BarChart3 className="w-4 h-4" /><span className="text-sm">Panel de estadísticas</span></Link>
            </DropdownMenuItem>
          )}

          {isAdmin && (
            <>
              <DropdownMenuSeparator className="mx-2" />
              <DropdownMenuItem asChild className="rounded-xl gap-3 py-2.5 font-bold cursor-pointer transition-colors">
                <Link href="/admin/messages"><Mail className="w-4 h-4" /><span className="text-sm">Mensajes Recibidos</span></Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl gap-3 py-2.5 font-bold cursor-pointer transition-colors">
                <Link href="/admin/requests"><BellRing className="w-4 h-4" /><span className="text-sm">Solicitudes de Acceso</span></Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl gap-3 py-2.5 font-bold cursor-pointer transition-colors">
                <Link href="/admin"><Briefcase className="w-4 h-4" /><span className="text-sm">Gestión de usuarios</span></Link>
              </DropdownMenuItem>
            </>
          )}
        </div>
        <DropdownMenuSeparator className="mx-2" />
        <div className="p-1">
          <DropdownMenuItem asChild className="rounded-xl gap-3 py-2.5 font-black text-destructive focus:bg-destructive/10 cursor-pointer transition-colors uppercase tracking-widest text-[11px]">
            <Link href="/login"><LogOut className="w-4 h-4" /><span>Cerrar Sesión</span></Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
