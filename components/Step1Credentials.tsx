import React, { useState } from "react";
import { useSupabaseCredentials } from "../context/SupabaseContext";
import { Credentials } from "../types";
import {
  TextField,
  Button,
  Box,
  Alert
} from "@mui/material";

interface Props { onNext: () => void; }

export default function Step1Credentials({ onNext }: Props) {
  const { setCredentials } = useSupabaseCredentials();
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [error, setError] = useState<string|null>(null);

  const handleSubmit = () => {
    if (!url || !key) {
      setError("Both URL and API key are required");
      return;
    }
    // Basic validation
    if (!url.startsWith("https://") || key.length < 10) {
      setError("Invalid URL or key");
      return;
    }
    const creds: Credentials = { url, key };
    setCredentials(creds);
    onNext();
  };

  return (
    <Box className="space-y-4">
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        fullWidth
        label="Supabase URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://xyzcompany.supabase.co"
      />
      <TextField
        fullWidth
        label="Supabase Service Role Key"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="YOUR_SUPABASE_SERVICE_ROLE_KEY"
      />
      <Box className="flex justify-end">
        <Button variant="contained" onClick={handleSubmit}>
          Next
        </Button>
      </Box>
    </Box>
  );
}