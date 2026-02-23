
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { User, Briefcase, LogOut, Settings, Copy, Check, Fingerprint, ShieldCheck } from "lucide-react";
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
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

export function UserMenu() {
  const { user } = useUser();
  const db = useFirestore();
  const [copied, setCopied] = useState(false);

  const adminRef = useMemoFirebase(() => 
    user ? doc(db, 'roles_admin', user.uid) : null, 
    [db, user]
  );
  
  const { data: adminDoc } = useDoc(adminRef);
  const isAdmin = !!adminDoc;
  
  const userPhoto = user?.photoURL || "https://picsum.photos/seed/prof1/100/100";
  const userName = user?.displayName || user?.email?.split('@')[0] || "Usuario FCA";
  const userEmail = user?.email || "institucional@unca.edu.ar";

  const copyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      setCopied(true);
      toast({
        title: "ID Copiado",
        description: "El identificador de usuario se ha copiado al portapapeles.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full border-2 border-primary/20 p-0 overflow-hidden outline-none hover:border-primary/40 transition-colors">
          <Image 
            src={userPhoto} 
            alt="Avatar" 
            fill
            className="object-cover" 
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 rounded-2xl shadow-xl border-muted p-2" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black leading-none uppercase tracking-tight truncate">{userName}</p>
              {isAdmin && (
                <Badge className="bg-primary/10 text-primary border-primary/20 h-5 px-1.5 text-[8px] font-black uppercase tracking-widest">
                  <ShieldCheck className="w-2.5 h-2.5 mr-1" /> ADMIN
                </Badge>
              )}
            </div>
            <p className="text-[11px] leading-none text-muted-foreground font-medium mt-1">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <div className="px-4 pb-4">
          <div className="bg-muted/50 rounded-xl p-3 border border-muted-foreground/10 flex items-center justify-between gap-2">
            <div className="overflow-hidden">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1 flex items-center gap-1">
                <Fingerprint className="w-3 h-3" /> Tu ID de Usuario (UID)
              </p>
              <p className="text-[10px] font-mono font-bold truncate text-primary/70">{user?.uid}</p>
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg shrink-0" onClick={copyUid}>
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator className="mx-2" />
        <div className="p-1">
          <DropdownMenuItem asChild className="rounded-xl gap-3 py-2.5 font-bold cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors">
            <Link href="/">
              <User className="w-4 h-4" />
              <span className="text-sm">Mis datos personales</span>
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild className="rounded-xl gap-3 py-2.5 font-bold cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors">
              <Link href="/admin">
                <Briefcase className="w-4 h-4" />
                <span className="text-sm">Panel de Gestión</span>
              </Link>
            </DropdownMenuItem>
          )}
        </div>
        <DropdownMenuSeparator className="mx-2" />
        <div className="p-1">
          <DropdownMenuItem asChild className="rounded-xl gap-3 py-2.5 font-black text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer transition-colors uppercase tracking-widest text-[11px]">
            <Link href="/login">
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
