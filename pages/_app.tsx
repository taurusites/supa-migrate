import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SupabaseProvider } from "../context/SupabaseContext";
import { CssBaseline } from "@mui/material";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SupabaseProvider>
      <CssBaseline />
      <Component {...pageProps} />
    </SupabaseProvider>
  );
}