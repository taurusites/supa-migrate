import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Alert,
} from "@mui/material";
import Loading from "./Loading";
import { useSupabaseCredentials } from "../context/SupabaseContext";
import { listSchemasAndTables } from "../services/supabaseService";
import { SchemaInfo, TableSelection } from "../types";

interface Props {
  selection: TableSelection[];
  setSelection: (s: TableSelection[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Select({
  selection,
  setSelection,
  onNext,
  onBack,
}: Props) {
  const { credentials } = useSupabaseCredentials();
  const [schemas, setSchemas] = useState<SchemaInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // fetch once credentials exist
  useEffect(() => {
    if (!credentials) return;

    setLoading(true);
    setError(null);

    listSchemasAndTables(credentials.url, credentials.key)
      .then((data) => {
        setSchemas(data);
        if (selection.length === 0) {
          const init: TableSelection[] = [];
          data.forEach((s) =>
            s.tables.forEach((t) =>
              init.push({ schema: s.schema, table: t, selected: false })
            )
          );
          setSelection(init);
        }
      })
      .catch((err: any) => {
        console.error(err);
        setError(err.message || "Failed to list schemas/tables");
      })
      .finally(() => setLoading(false));
  }, [credentials]);

  if (!credentials)
    return <Alert severity="error">Missing Supabase credentials</Alert>;
  if (loading) return <Loading />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const toggle = (schema: string, table: string) => {
    setSelection((prev) =>
      prev.map((row) =>
        row.schema === schema && row.table === table
          ? { ...row, selected: !row.selected }
          : row
      )
    );
  };

  return (
    <Box className="space-y-6">
      {schemas.map((s) => (
        <Box
          key={s.schema}
          className="border rounded-lg p-4"
        >
          <h3 className="font-semibold mb-2">{s.schema}</h3>
          <Box className="grid grid-cols-2 gap-2">
            {s.tables.map((t) => {
              const sel = selection.find(
                (x) => x.schema === s.schema && x.table === t
              );
              return (
                <FormControlLabel
                  key={`${s.schema}.${t}`}
                  control={
                    <Checkbox
                      checked={sel?.selected || false}
                      onChange={() => toggle(s.schema, t)}
                    />
                  }
                  label={t}
                />
              );
            })}
          </Box>
        </Box>
      ))}

      <Box className="flex justify-between pt-4">
        <Button onClick={onBack}>Back</Button>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!selection.some((s) => s.selected)}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}