import React, { useState } from "react";
import { Box, Button, Alert } from "@mui/material";
import Loading from "./Loading";
import SQLViewer from "./SQLViewer";
import { useSupabaseCredentials } from "../context/SupabaseContext";
import { generateMigrationSQL } from "../services/supabaseService";
import { TableSelection } from "../types";

interface Props {
  selection: TableSelection[];
  sql: string;
  setSQL: (s: string) => void;
  onBack: () => void;
}

export default function Step3SQLPreview({ selection, sql, setSQL, onBack }: Props) {
  const { credentials } = useSupabaseCredentials();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gen = async () => {
    setError(null);
    if (!credentials) return setError("Missing credentials");
    setLoading(true);
    try {
      const txt = await generateMigrationSQL(
        credentials.url,
        credentials.key,
        selection
      );
      setSQL(txt);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="space-y-4">
      {error && <Alert severity="error">{error}</Alert>}
      {!sql && (
        <Box className="flex justify-end">
          <Button variant="contained" onClick={gen} disabled={loading}>
            {loading ? "Generating..." : "Generate SQL"}
          </Button>
        </Box>
      )}
      {loading && <Loading />}
      {sql && <SQLViewer sql={sql} onBack={onBack} />}
    </Box>
  );
}