import React, { useState } from "react";
import { Stepper, Step, StepLabel, Box } from "@mui/material";
import Step1Credentials from "./Step1Credentials";
import Step2Select from "./Step2Select";
import Step3SQLPreview from "./Step3SQLPreview";
import DebugPanel from "./DebugPanel";
import { useSupabaseCredentials } from "../context/SupabaseContext";
import { TableSelection } from "../types";

const steps = ["Credentials", "Select Tables", "Preview SQL"];

export default function Wizard() {
  const { credentials } = useSupabaseCredentials();
  const [active, setActive] = useState(0);
  const [selection, setSelection] = useState<TableSelection[]>([]);
  const [schemas, setSchemas] = useState<any[]>([]);
  const [sql, setSQL] = useState("");

  return (
    <Box>
      <Stepper activeStep={active} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <Box className="mt-8">
        {active === 0 && <Step1Credentials onNext={() => setActive(1)} />}
        {active === 1 && (
          <Step2Select
            selection={selection}
            setSelection={setSelection}
            onNext={() => setActive(2)}
            onBack={() => setActive(0)}
            onSchemasLoaded={setSchemas}
          />
        )}
        {active === 2 && (
          <Step3SQLPreview
            selection={selection}
            sql={sql}
            setSQL={setSQL}
            onBack={() => setActive(1)}
          />
        )}
      </Box>
      
      <DebugPanel 
        credentials={credentials}
        schemas={schemas}
        selection={selection}
        sql={sql}
      />
    </Box>
  );
}