import React, { useState } from "react";
import { Stepper, Step, StepLabel, Box } from "@mui/material";
import Step1Credentials from "./Step1Credentials";
import Step2Select from "./Step2Select";
import Step3SQLPreview from "./Step3SQLPreview";
import { Selection } from "../types";

const steps = ["Credentials", "Select Items", "Preview SQL"];

export default function Wizard() {
  const [activeStep, setActiveStep] = useState(0);

  // now track a unified list of Selection
  const [selections, setSelections] = useState<Selection[]>([]);
  const [sql, setSQL] = useState<string>("");

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box className="mt-8">
        {activeStep === 0 && (
          <Step1Credentials onNext={() => setActiveStep(1)} />
        )}

        {activeStep === 1 && (
          <Step2Select
            selections={selections}
            setSelections={setSelections}
            onNext={() => setActiveStep(2)}
            onBack={() => setActiveStep(0)}
          />
        )}

        {activeStep === 2 && (
          <Step3SQLPreview
            selections={selections}
            sql={sql}
            setSQL={setSQL}
            onBack={() => setActiveStep(1)}
          />
        )}
      </Box>
    </Box>
  );
}