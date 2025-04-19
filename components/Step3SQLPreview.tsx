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
  setSQL: (sql: string) => void;
  onBack: () => void;
}

export default function Step3SQLPreview({
  selection,
  sql,
  setSQL,
  onBack,
}: Props) {
  const { credentials } = useSupabaseCredentials();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!credentials) {
      setError("Missing Supabase credentials");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const generated = await generateMigrationSQL(
        credentials.url,
        credentials.key,
        selection
      );
      setSQL(generated);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate SQL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="space-y-4">
      {error && <Alert severity="error">{error}</Alert>}

      {!sql && (
        <Box className="flex justify-end">
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate SQL"}
          </Button>
        </Box>
      )}

      {loading && <Loading />}

      {sql && <SQLViewer sql={sql} onBack={onBack} />}
    </Box>
  );
}