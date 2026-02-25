
"use client";

import { useState, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { StaffMember } from "@/lib/mock-data";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StaffAutocompleteProps {
  onSelect: (staff: StaffMember) => void;
  label: string;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
}

export function StaffAutocomplete({ onSelect, label, placeholder, className, defaultValue }: StaffAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue || "");
  const db = useFirestore();

  const staffQuery = useMemoFirebase(() => query(collection(db, 'staff'), orderBy('lastName', 'asc')), [db]);
  const { data: staffList } = useCollection<StaffMember>(staffQuery);

  useEffect(() => {
    if (defaultValue) setValue(defaultValue);
  }, [defaultValue]);

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-12 rounded-xl font-bold bg-white text-left overflow-hidden"
          >
            {value ? value : placeholder || "Buscar por apellido..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl" align="start">
          <Command>
            <Input 
              placeholder="Escriba el apellido..." 
              className="border-none focus-visible:ring-0 h-11" 
              onChange={(e) => {
                // Permite entrada manual libre si no está en la lista
                // Pero aquí solo manejamos la búsqueda
              }}
            />
            <CommandList className="max-h-60 overflow-y-auto">
              <CommandGroup>
                {staffList?.map((person) => (
                  <CommandItem
                    key={person.id}
                    value={`${person.lastName}, ${person.firstName}`}
                    onSelect={(currentValue) => {
                      setValue(currentValue);
                      setOpen(false);
                      onSelect(person);
                    }}
                    className="cursor-pointer py-3 px-4 font-bold"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === `${person.lastName}, ${person.firstName}` ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {person.lastName}, {person.firstName}
                    <span className="ml-auto text-[10px] uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {person.category}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
