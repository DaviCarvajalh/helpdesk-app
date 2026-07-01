"use client";

import { createContext, useContext, useState } from "react";

interface MobileMenuCtx { open: boolean; toggle: () => void; close: () => void; }

const MobileMenuContext = createContext<MobileMenuCtx>({ open: false, toggle: () => {}, close: () => {} });

export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MobileMenuContext.Provider value={{ open, toggle: () => setOpen((o) => !o), close: () => setOpen(false) }}>
      {children}
    </MobileMenuContext.Provider>
  );
}

export const useMobileMenu = () => useContext(MobileMenuContext);
