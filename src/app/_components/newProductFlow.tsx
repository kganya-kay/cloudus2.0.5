"use client";

import React, { useState } from "react";


import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import NewLead from "./newLead";

const steps = ["Product Details", "Pricing", "Confirmation"];

export default function NewProductFlow() {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const handleOpen = () => {
    setOpen(true);
    setActiveStep(0); // Reset step when dialog opens
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      // Final step, submit or close
      handleClose();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <div>
            
            <NewLead />
        </div>;
      case 1:
        return <div>Pricing Form</div>;
      case 2:
        return <div>Confirmation</div>;
      default:
        return null;
    }
  };

  return (
    <>
      <Button variant="contained" color="primary" onClick={handleOpen}>
        Launch New Product
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Launch Product</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <div style={{ marginTop: 24, padding: "16px 0" }}>
            {renderStepContent(activeStep)}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleBack} disabled={activeStep === 0}>
            Back
          </Button>
          <Button onClick={handleNext} color="primary" variant="contained">
            {activeStep === steps.length - 1 ? "Finish" : "Next"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
