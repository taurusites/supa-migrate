import React, { useState } from "react";
import { Stepper, Step, StepLabel, Box } from "@mui/material";
import Step1Credentials from "./Step1Credentials";
import Step2Select from "./Step2Select";
import Step3FunctionsTypes from "./Step3FunctionsTypes";
import Step4SQLPreview from "./Step4SQLPreview";
import DebugPanel from "./DebugPanel";
import { useSupabaseCredentials } from "../context/SupabaseContext";
import { TableSelection, FunctionSelection, TypeSelection, TriggerSelection } from "../types";

const steps = ["Credentials", "Select Tables", "Select Functions & Types", "Preview SQL"];

export default function Wizard() {
  const { credentials } = useSupabaseCredentials();
  const [active, setActive] = useState(0);
  const [selection, setSelection] = useState<TableSelection[]>([]);
  const [functionSelection, setFunctionSelection] = useState<FunctionSelection[]>([]);
  const [typeSelection, setTypeSelection] = useState<TypeSelection[]>([]);
  const [triggerSelection, setTriggerSelection] = useState<TriggerSelection[]>([]);
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
        {active === 0 && <Step1Credentials onNext={() => {
          // Reset all selections when moving to step 2
          setSelection([]);
          setFunctionSelection([]);
          setTypeSelection([]);
          setTriggerSelection([]);
          setSQL("");
          setActive(1);
        }} />}
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
          <Step3FunctionsTypes
            schemas={schemas}
            functionSelection={functionSelection}
            setFunctionSelection={setFunctionSelection}
            typeSelection={typeSelection}
            setTypeSelection={setTypeSelection}
            triggerSelection={triggerSelection}
            setTriggerSelection={setTriggerSelection}
            onNext={() => setActive(3)}
            onBack={() => setActive(1)}
          />
        )}
        {active === 3 && (
          <Step4SQLPreview
            selection={selection}
            functionSelection={functionSelection}
            typeSelection={typeSelection}
            triggerSelection={triggerSelection}
            sql={sql}
            setSQL={setSQL}
            onBack={() => setActive(2)}
          />
        )}
      </Box>
      
      <DebugPanel 
        credentials={credentials}
        schemas={schemas}
        selection={selection}
        functionSelection={functionSelection}
        typeSelection={typeSelection}
        triggerSelection={triggerSelection}
        sql={sql}
      />
    </Box>
  );
}