import React, { useEffect } from "react";
import { Box, Button, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { SchemaInfo, FunctionSelection, TypeSelection, TriggerSelection } from "../types";

interface Props {
  schemas: SchemaInfo[];
  functionSelection: FunctionSelection[];
  setFunctionSelection: (s: FunctionSelection[]) => void;
  typeSelection: TypeSelection[];
  setTypeSelection: (s: TypeSelection[]) => void;
  triggerSelection: TriggerSelection[];
  setTriggerSelection: (s: TriggerSelection[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3FunctionsTypes({
  schemas,
  functionSelection,
  setFunctionSelection,
  typeSelection,
  setTypeSelection,
  triggerSelection,
  setTriggerSelection,
  onNext,
  onBack,
}: Props) {
  useEffect(() => {
    if (schemas.length > 0) {
      // Always reinitialize to ensure all start unchecked
      const initFunctions: FunctionSelection[] = [];
      const initTypes: TypeSelection[] = [];
      const initTriggers: TriggerSelection[] = [];
      
      schemas.forEach((s) => {
        s.functions?.forEach((f) =>
          initFunctions.push({ schema: s.schema, function: f, selected: false })
        );
        s.types?.forEach((t) =>
          initTypes.push({ schema: s.schema, type: t, selected: false })
        );
        s.triggers?.forEach((tr) =>
          initTriggers.push({ 
            schema: s.schema, 
            trigger: tr.trigger_name, 
            table: tr.table_name, 
            selected: false 
          })
        );
      });
      
      setFunctionSelection(initFunctions);
      setTypeSelection(initTypes);
      setTriggerSelection(initTriggers);
    }
  }, [schemas]);

  const toggleFunction = (schema: string, functionName: string) => {
    const updated = functionSelection.map((r) =>
      r.schema === schema && r.function === functionName
        ? { ...r, selected: !r.selected }
        : r
    );
    setFunctionSelection(updated);
  };

  const toggleType = (schema: string, typeName: string) => {
    const updated = typeSelection.map((r) =>
      r.schema === schema && r.type === typeName
        ? { ...r, selected: !r.selected }
        : r
    );
    setTypeSelection(updated);
  };

  const toggleAllFunctions = (schema: string, checked: boolean) => {
    const updated = functionSelection.map((r) =>
      r.schema === schema ? { ...r, selected: checked } : r
    );
    setFunctionSelection(updated);
  };

  const toggleAllTypes = (schema: string, checked: boolean) => {
    const updated = typeSelection.map((r) =>
      r.schema === schema ? { ...r, selected: checked } : r
    );
    setTypeSelection(updated);
  };

  const toggleTrigger = (schema: string, triggerName: string) => {
    const updated = triggerSelection.map((r) =>
      r.schema === schema && r.trigger === triggerName
        ? { ...r, selected: !r.selected }
        : r
    );
    setTriggerSelection(updated);
  };

  const toggleAllTriggers = (schema: string, checked: boolean) => {
    const updated = triggerSelection.map((r) =>
      r.schema === schema ? { ...r, selected: checked } : r
    );
    setTriggerSelection(updated);
  };

  return (
    <Box className="space-y-6">
      {schemas.map((s) => {
        const schemaFunctions = functionSelection.filter(f => f.schema === s.schema);
        const schemaTypes = typeSelection.filter(t => t.schema === s.schema);
        const schemaTriggers = triggerSelection.filter(tr => tr.schema === s.schema);
        const hasFunctions = s.functions && s.functions.length > 0;
        const hasTypes = s.types && s.types.length > 0;
        const hasTriggers = s.triggers && s.triggers.length > 0;

        if (!hasFunctions && !hasTypes && !hasTriggers) return null;

        return (
          <Box key={s.schema} className="border rounded-lg p-4">
            <Typography variant="h6" className="mb-4">{s.schema}</Typography>
            
            {hasFunctions && (
              <Box className="mb-4">
                <Box className="flex items-center justify-between mb-2">
                  <Typography variant="subtitle1" className="font-semibold">Functions</Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={schemaFunctions.every(f => f.selected)}
                        indeterminate={schemaFunctions.some(f => f.selected) && !schemaFunctions.every(f => f.selected)}
                        onChange={(e) => toggleAllFunctions(s.schema, e.target.checked)}
                      />
                    }
                    label="Select All"
                  />
                </Box>
                <Box className="grid grid-cols-2 gap-2">
                  {s.functions.map((f) => {
                    const sel = functionSelection.find((x) => x.schema === s.schema && x.function === f);
                    return (
                      <FormControlLabel
                        key={`${s.schema}.${f}`}
                        control={
                          <Checkbox
                            checked={sel?.selected || false}
                            onChange={() => toggleFunction(s.schema, f)}
                          />
                        }
                        label={f}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            {hasTypes && (
              <Box className="mb-4">
                <Box className="flex items-center justify-between mb-2">
                  <Typography variant="subtitle1" className="font-semibold">User-Defined Types</Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={schemaTypes.every(t => t.selected)}
                        indeterminate={schemaTypes.some(t => t.selected) && !schemaTypes.every(t => t.selected)}
                        onChange={(e) => toggleAllTypes(s.schema, e.target.checked)}
                      />
                    }
                    label="Select All"
                  />
                </Box>
                <Box className="grid grid-cols-2 gap-2">
                  {s.types.map((t) => {
                    const sel = typeSelection.find((x) => x.schema === s.schema && x.type === t);
                    return (
                      <FormControlLabel
                        key={`${s.schema}.${t}`}
                        control={
                          <Checkbox
                            checked={sel?.selected || false}
                            onChange={() => toggleType(s.schema, t)}
                          />
                        }
                        label={t}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            {hasTriggers && (
              <Box>
                <Box className="flex items-center justify-between mb-2">
                  <Typography variant="subtitle1" className="font-semibold">Triggers</Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={schemaTriggers.every(tr => tr.selected)}
                        indeterminate={schemaTriggers.some(tr => tr.selected) && !schemaTriggers.every(tr => tr.selected)}
                        onChange={(e) => toggleAllTriggers(s.schema, e.target.checked)}
                      />
                    }
                    label="Select All"
                  />
                </Box>
                <Box className="grid grid-cols-2 gap-2">
                  {s.triggers.map((tr) => {
                    const sel = triggerSelection.find((x) => x.schema === s.schema && x.trigger === tr.trigger_name);
                    return (
                      <FormControlLabel
                        key={`${s.schema}.${tr.trigger_name}`}
                        control={
                          <Checkbox
                            checked={sel?.selected || false}
                            onChange={() => toggleTrigger(s.schema, tr.trigger_name)}
                          />
                        }
                        label={`${tr.trigger_name} (${tr.table_name})`}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        );
      })}
      
      <Box className="flex justify-between pt-4">
        <Button onClick={onBack}>Back</Button>
        <Button variant="contained" onClick={onNext}>
          Next
        </Button>
      </Box>
    </Box>
  );
}