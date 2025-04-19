import "../styles/globals.css";
import type { AppProps } from "next/app";
import { SupabaseProvider } from "../context/SupabaseContext";
import { CssBaseline } from "@mui/material";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SupabaseProvider>
      <CssBaseline />
      <Component {...pageProps} />
    </SupabaseProvider>
  );
}

export default MyApp;