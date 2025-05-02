import React, { createContext, useContext, ReactNode, useState } from "react";
import { Credentials } from "../types";

interface Value {
  credentials: Credentials | null;
  setCredentials: (c: Credentials) => void;
}
const Ctx = createContext<Value>({ credentials: null, setCredentials: () => {} });

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  return <Ctx.Provider value={{ credentials, setCredentials }}>{children}</Ctx.Provider>;
}

export const useSupabaseCredentials = () => useContext(Ctx);