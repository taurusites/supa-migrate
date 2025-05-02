import React, { useState } from "react";
import { Box, TextField, Button, Alert } from "@mui/material";
import { useSupabaseCredentials } from "../context/SupabaseContext";
import { Credentials } from "../types";

interface Props { onNext: () => void; }

export default function Step1Credentials({ onNext }: Props) {
  const { setCredentials } = useSupabaseCredentials();
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [error, setError] = useState<string|null>(null);

  const submit = () => {
    setError(null);
    if (!url || !key) {
      setError("Both URL and key are required");
      return;
    }
    if (!url.startsWith("https://") || key.length < 10) {
      setError("Invalid Supabase URL or service role key");
      return;
    }
    setCredentials({ url, key });
    onNext();
  };

  return (
    <Box className="space-y-4">
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Supabase URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        fullWidth
        placeholder="https://xyzcompany.supabase.co"
      />
      <TextField
        label="Service Role Key"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        fullWidth
        placeholder="YOUR_SERVICE_ROLE_KEY"
      />
      <Box className="flex justify-end">
        <Button variant="contained" onClick={submit}>Next</Button>
      </Box>
    </Box>
  );
}