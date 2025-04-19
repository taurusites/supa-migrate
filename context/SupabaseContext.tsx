import React, { createContext, useContext, useState, ReactNode } from "react";
import { Credentials } from "../types";

interface SupabaseContextValue {
  credentials: Credentials | null;
  setCredentials: (c: Credentials) => void;
}

const SupabaseContext = createContext<SupabaseContextValue>({
  credentials: null,
  setCredentials: () => {}
});

export const useSupabaseCredentials = () => useContext(SupabaseContext);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  return (
    <SupabaseContext.Provider value={{ credentials, setCredentials }}>
      {children}
    </SupabaseContext.Provider>
  );
};