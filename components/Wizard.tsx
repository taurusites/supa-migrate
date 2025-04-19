import React, { useState } from "react";
import Step1Credentials from "./Step1Credentials";
import Step2Select from "./Step2Select";
import Step3SQLPreview from "./Step3SQLPreview";
import { Box, Button, Stepper, Step, StepLabel } from "@mui/material";
import { TableSelection } from "../types";

const steps = ["Credentials", "Select Tables", "Preview SQL"];

export default function Wizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [selection, setSelection] = useState<TableSelection[]>([]);
  const [generatedSQL, setGeneratedSQL] = useState<string>("");

  const handleNext = () => setActiveStep((s) => s + 1);
  const handleBack = () => setActiveStep((s) => s - 1);

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      <Box className="mt-8">
        {activeStep === 0 && <Step1Credentials onNext={handleNext} />}
        {activeStep === 1 && (
          <Step2Select
            onNext={handleNext}
            onBack={handleBack}
            selection={selection}
            setSelection={setSelection}
          />
        )}
        {activeStep === 2 && (
          <Step3SQLPreview
            onBack={handleBack}
            selection={selection}
            setSQL={setGeneratedSQL}
            sql={generatedSQL}
          />
        )}
      </Box>
    </Box>
  );
}