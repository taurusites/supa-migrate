import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Alert,
  Typography,
  Divider,
} from "@mui/material";
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
}

export default function Step2Select({
  selections,
  setSelections,
  onNext,
  onBack,
}: Step2SelectProps) {
  const { credentials } = useSupabaseCredentials();
  const [details, setDetails] = useState<SchemaDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string|null>(null);

  useEffect(() => {
    if (!credentials) return;
    setLoading(true);
    listSchemaDetails(credentials.url, credentials.key)
      .then((data) => {
        setDetails(data);
        if (selections.length === 0) {
          const init: Selection[] = [];
          data.forEach((sd) => {
            sd.tables.forEach((t) =>
              init.push({ schema:sd.schema, name:t, category:"table", selected:false })
            );
            sd.enums.forEach((e) =>
              init.push({ schema:sd.schema, name:e.type_name, category:"enum", selected:false })
            );
            sd.functions.forEach((f) =>
              init.push({ schema:sd.schema, name:f.function_name, category:"function", selected:false })
            );
            sd.triggers.forEach((t) =>
              init.push({ schema:sd.schema, name:t.trigger_name, category:"trigger", selected:false })
            );
            sd.indexes.forEach((ix) =>
              init.push({ schema:sd.schema, name:ix.indexname, category:"index", selected:false })
            );
            sd.foreignKeys.forEach((fk) =>
              init.push({ schema:sd.schema, name:fk.fk_name, category:"foreignKey",selected:false })
            );
          });
          setSelections(init);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [credentials]);

  if (!credentials) return <Alert severity="error">Missing credentials</Alert>;
  if (loading) return <Loading />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const toggle = (schema:string, name:string, category:string) => {
    setSelections((prev) =>
      prev.map((s) =>
        s.schema===schema && s.name===name && s.category===category
          ? { ...s, selected: !s.selected }
          : s
      )
    );
  };

  const pick = (sd: SchemaDetail, cat: string) =>
    selections.filter((s) => s.schema===sd.schema && s.category===cat);

  // Only table selections enable “Next”
  const tablesSelected = selections.filter((s) => s.category==="table");

  return (
    <Box className="space-y-8">
      {details.map((sd) => (
        <Box key={sd.schema} className="p-4 border rounded-lg">
          <Typography variant="h6">{sd.schema}</Typography>
          <Divider className="my-2" />

          {(["table","enum","function","trigger","index","foreignKey"] as const).map(
            (cat) =>
              pick(sd, cat).length > 0 && (
                <Box key={cat} className="mb-4">
                  <Typography variant="subtitle1">{LABELS[cat]}</Typography>
                  <Box className="grid grid-cols-2 gap-2 mt-1">
                    {pick(sd, cat).map((it) => (
                      <FormControlLabel
                        key={`${cat}-${it.name}`}
                        control={
                          <Checkbox
                            checked={it.selected}
                            onChange={() => toggle(sd.schema, it.name, cat)}
                          />
                        }
                        label={it.name}
                      />
                    ))}
                  </Box>
                </Box>
              )
          )}
        </Box>
      ))}

      <Box className="flex justify-between">
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