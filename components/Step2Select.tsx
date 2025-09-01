import React, { useEffect, useState } from "react";
import { Box, Button, Checkbox, FormControlLabel, Alert, Switch, Typography } from "@mui/material";
import Loading from "./Loading";
import { useSupabaseCredentials } from "../context/SupabaseContext";
import { listSchemaDetails } from "../services/supabaseService";
import { SchemaDetail, Selection } from "../types";

const LABELS: Record<string, string> = {
  table:      "Tables",
  enum:       "Enums",
  function:   "Functions",
  trigger:    "Triggers",
  index:      "Indexes",
  foreignKey: "Foreign Keys",
};

interface Step2SelectProps {
  selections: Selection[];
  setSelections: (s: Selection[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSchemasLoaded?: (schemas: SchemaInfo[]) => void;
}

export default function Step2Select({ selection, setSelection, onNext, onBack, onSchemasLoaded }: Props) {
  const { credentials } = useSupabaseCredentials();
  const [details, setDetails] = useState<SchemaDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBuiltInSchemas, setShowBuiltInSchemas] = useState(false);

  useEffect(() => {
    if (!credentials) return;
    setLoading(true);
    setError(null);
    listSchemasAndTables(credentials.url, credentials.key, showBuiltInSchemas)
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
  }, [credentials, showBuiltInSchemas]);

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
      <Box className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <Typography variant="body2" color="textSecondary">
          By default, built-in Supabase schemas (auth, storage, etc.) are hidden as they're typically not migrated.
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showBuiltInSchemas}
              onChange={(e) => setShowBuiltInSchemas(e.target.checked)}
            />
          }
          label="Show built-in schemas"
        />
      </Box>
      {schemas.map((s) => {
        const schemaTables = selection.filter(sel => sel.schema === s.schema);
        return (
          <Box key={s.schema} className="border rounded-lg p-4">
            <Box className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{s.schema}</h3>
              {schemaTables.length > 0 && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={schemaTables.length > 0 && schemaTables.every(t => t.selected)}
                      indeterminate={schemaTables.some(t => t.selected) && !schemaTables.every(t => t.selected)}
                      onChange={(e) => toggleAllTables(s.schema, e.target.checked)}
                    />
                  }
                  label="Select All"
                />
              )}
            </Box>
            <Box className="grid grid-cols-2 gap-2">
              {s.tables.length > 0 ? (
                s.tables.map((t) => {
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
                })
              ) : (
                <Typography variant="body2" color="textSecondary" className="col-span-2">
                  No tables found in this schema
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}
      <Box className="flex justify-between pt-4">
        <Button onClick={onBack}>Back</Button>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!tablesSelected.some((s) => s.selected)}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}