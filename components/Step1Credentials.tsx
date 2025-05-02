// components/Step1Credentials.tsx
import React, { useState } from "react";
import { Box, TextField, Button, Alert } from "@mui/material";
import { useSupabaseCredentials } from "../context/SupabaseContext";
import { Credentials } from "../types";

interface Props {
  onNext: () => void;
}

export default function Step1Credentials({ onNext }: Props) {
  const { setCredentials } = useSupabaseCredentials();
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    if (!url || !key) {
      setError("Both Supabase URL and Service Role Key are required");
      return;
    }
    if (!url.startsWith("https://") || key.length < 10) {
      setError("Invalid Supabase URL or Service Role Key");
      return;
    }
    const creds: Credentials = { url, key };
    setCredentials(creds);
    document.cookie = `supCreds=${JSON.stringify({url,key})}; path=/; Secure;`;
    onNext();
  };

  return (
    <Box className="space-y-4">
      {error && <Alert severity="error">{error}</Alert>}

      <TextField
        fullWidth
        label="Supabase URL"
        placeholder="https://xyzcompany.supabase.co"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <TextField
        fullWidth
        type="password"           // ← masked input
        label="Service Role Key"
        placeholder="••••••••••••••••••••••••••"
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />

      <Box className="flex justify-end">
        <Button variant="contained" onClick={handleSubmit}>
          Next
        </Button>
      </Box>
    </Box>
  );
}