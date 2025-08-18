import React, { useEffect, useState } from "react";
import { Box, Button, Checkbox, FormControlLabel, Alert } from "@mui/material";
import Loading from "./Loading";
import { useSupabaseCredentials } from "../context/SupabaseContext";
import { listSchemasAndTables } from "../services/supabaseService";
import { SchemaInfo, TableSelection } from "../types";

interface Props {
  selection: TableSelection[];
  setSelection: (s: TableSelection[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSchemasLoaded?: (schemas: SchemaInfo[]) => void;
}

export default function Step2Select({ selection, setSelection, onNext, onBack, onSchemasLoaded }: Props) {
  const { credentials } = useSupabaseCredentials();
  const [schemas, setSchemas] = useState<SchemaInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!credentials) return;
    setLoading(true);
    setError(null);
    listSchemasAndTables(credentials.url, credentials.key)
      .then((data) => {
        setSchemas(data);
        onSchemasLoaded?.(data);
        // Always reinitialize selection to ensure all start unchecked
        const init: TableSelection[] = [];
        data.forEach((s) =>
          s.tables.forEach((t) =>
            init.push({ schema: s.schema, table: t, selected: false })
          )
        );
        setSelection(init);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [credentials]);

  if (!credentials) return <Alert severity="error">Missing credentials</Alert>;
  if (loading) return <Loading />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const toggle = (schema: string, table: string) => {
    const updated = selection.map((r) =>
      r.schema === schema && r.table === table
        ? { ...r, selected: !r.selected }
        : r
    );
    setSelection(updated);
  };

  const toggleAllTables = (schema: string, checked: boolean) => {
    const updated = selection.map((r) =>
      r.schema === schema ? { ...r, selected: checked } : r
    );
    setSelection(updated);
  };

  return (
    <Box className="space-y-6">
      {schemas.map((s) => {
        const schemaTables = selection.filter(sel => sel.schema === s.schema);
        return (
          <Box key={s.schema} className="border rounded-lg p-4">
            <Box className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{s.schema}</h3>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={schemaTables.every(t => t.selected)}
                    indeterminate={schemaTables.some(t => t.selected) && !schemaTables.every(t => t.selected)}
                    onChange={(e) => toggleAllTables(s.schema, e.target.checked)}
                  />
                }
                label="Select All"
              />
            </Box>
            <Box className="grid grid-cols-2 gap-2">
              {s.tables.map((t) => {
                const sel = selection.find((x) => x.schema === s.schema && x.table === t);
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
        );
      })}
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