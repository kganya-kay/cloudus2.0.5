"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
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

const steps = ["About your idea", "Experience & budget", "Review & launch"];
const products = [
  "Web Development",
  "Mobile App Development",
  "Salesforce Development",
  "Printing Services",
  "Integration Services",
  "Digital Marketing",
  "SEO Services",
  "Content Writing",
  "Graphic Design",
  "UI/UX Design",
  "Photography",
  "Music Production",
];

// Map your product names to Salesforce product interest values (match to your Salesforce picklist values)
const productInterestMap: Record<string, string> = {
  "Web Development": "1",
  "Salesforce Development": "2",
  "E-commerce Solutions": "3",
  "Printing Services": "4",
  "Integration Services": "5",
  "Mobile App Development": "6",
  "Digital Marketing": "10",
  "SEO Services": "11",
  "Content Writing": "7",
  "Graphic Design": "8",
  "UI/UX Design": "9",
  "Photography": "12",
  "Music Production": "13",
};

export default function NewProductFlow() {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Simulate auth status - replace with your auth check
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Lead capture fields (used if not logged in)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
    description: "",
  });

  // Product & pricing details
  const [description, setDescription] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  const [basePrice, setBasePrice] = useState(999);
  const [quantity, setQuantity] = useState(1);

  // Ref for hidden form submission
  const formRef = useRef<HTMLFormElement>(null);

  const handleOpen = () => {
    setOpen(true);
    setActiveStep(0);
    // Reset form data on open
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      company: "",
      description: "",
    });
    setSelectedProduct(products[0]);
    setDescription("");
    setBasePrice(999);
    setQuantity(1);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleNext = () => {
    // Validate required fields on first step if not logged in
    if (activeStep === 0 && !isLoggedIn) {
      if (
        !formData.first_name.trim() ||
        !formData.last_name.trim() ||
        !formData.email.trim() ||
        !formData.company.trim()
      ) {
        alert("Please fill in all required fields.");
        return;
      }
      // Basic email format check (simple)
      if (!formData.email.includes("@")) {
        alert("Please enter a valid email.");
        return;
      }
    }

    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      // On final step: submit Salesforce lead if not logged in, then close dialog
      if (!isLoggedIn) {
        // Submit form programmatically
        formRef.current?.submit();
      }
      handleClose();
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const PricingStepper = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <input
        type="number"
        name="basePrice"
        placeholder="Base Price"
        min={999}
        step="1"
        value={basePrice}
        onChange={(e) => setBasePrice(Math.max(Number(e.target.value), 999))}
        className="border border-gray-400 bg-white rounded px-2 py-1 w-full"
      />

      <div className="flex items-center gap-2">
        <Button
          variant="outlined"
          onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
        >
          -
        </Button>
        <input
          type="number"
          value={quantity}
          onChange={(e) => {
            const val = Number(e.target.value);
            setQuantity(val >= 1 ? val : 1);
          }}
          min={1}
          className="border border-gray-400 bg-white rounded px-2 py-1 w-20 text-center"
        />
        <Button variant="outlined" onClick={() => setQuantity((prev) => prev + 1)}>
          +
        </Button>
      </div>

      <p className="text-lg font-semibold">
        Total:{" "}
        <span className="text-green-600">
          R{(basePrice * quantity).toFixed(2)}
        </span>
      </p>
    </div>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            <h4 className="font-bold text-red-500 animate-pulse">Select Product</h4>
            <select
              name="selectedProduct"
              id="selectedProduct"
              className="border border-gray-400 bg-white rounded px-2 py-1"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
            >
              {products.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
            {!isLoggedIn && (
              <>
                <h4 className="font-bold text-blue-600">Your Contact Details</h4>
                <input
                  type="text"
                  placeholder="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-400 bg-white rounded px-2 py-1 w-full"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-400 bg-white rounded px-2 py-1 w-full"
                />
                <input
                  type="email"
                  placeholder="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-400 bg-white rounded px-2 py-1 w-full"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="border border-gray-400 bg-white rounded px-2 py-1 w-full"
                />
                <input
                  type="text"
                  placeholder="Company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required
                  className="border border-gray-400 bg-white rounded px-2 py-1 w-full"
                />
                <input
                  type="text"
                  placeholder="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="border border-gray-400 bg-white rounded px-2 py-1 w-full"
                />
              </>
            )}

          </div>
        );

      case 1:
        return (
          <>
            <h4 className="font-bold text-red-500 animate-pulse">Set Pricing</h4>
            <PricingStepper />
          </>
        );

      case 2:
        return (
          <div>
            <h4 className="font-bold text-green-600">Confirm Your Details</h4>
            {!isLoggedIn && (
              <>
                <p>
                  <strong>First Name:</strong> {formData.first_name}
                </p>
                <p>
                  <strong>Last Name:</strong> {formData.last_name}
                </p>
                <p>
                  <strong>Email:</strong> {formData.email}
                </p>
                <p>
                  <strong>Phone:</strong> {formData.phone || "N/A"}
                </p>
                <p>
                  <strong>Company:</strong> {formData.company}
                </p>
                <p>
                  <strong>Description:</strong> {formData.description || "N/A"}
                </p>
              </>
            )}
            <p>
              <strong>Product:</strong> {selectedProduct}
            </p>
            <p>
              <strong>Base Price:</strong> R{basePrice}
            </p>
            <p>
              <strong>Quantity:</strong> {quantity}
            </p>
            <p>
              <strong>Total:</strong> R{(basePrice * quantity).toFixed(2)}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-blue-500">Quote in minutes</p>
          <h3 className="text-2xl font-semibold text-gray-900">
            Launch digital products, custom apps, or managed services with our guided configurator.
          </h3>
          <p className="text-sm text-gray-600">
            Choose your product type, set pricing, and capture requirements. We sync the lead with Salesforce,
            trigger /shop order flows, and reserve production slots in /calendar automatically.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>�?� Generate instant quotes for /shop orders or bespoke engagements</li>
            <li>�?� Route opportunities to the correct Cloudus squad via /team and /projects</li>
            <li>�?� Share branded proposals with your clients without leaving the platform</li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button variant="contained" onClick={handleOpen} className="!rounded-full !bg-blue-600">
              Launch configurator
            </Button>
            <Button
              component={Link}
              href="/calendar"
              variant="outlined"
              className="!rounded-full"
            >
              Book a discovery call
            </Button>
            <Button
              component={Link}
              href="/shop"
              variant="text"
              className="!rounded-full !text-blue-700"
            >
              Browse packaged services
            </Button>
          </div>
        </div>
        <div className="space-y-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-5 text-sm text-gray-700">
          <p className="text-xs font-semibold uppercase text-blue-600">What to expect</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Select a product, describe the outcome, and choose a launch budget.</li>
            <li>We generate a Salesforce lead + Cloudus /projects brief for your team.</li>
            <li>Schedule design, engineering, and go-live checkpoints on /calendar.</li>
          </ol>
          <p className="text-xs text-gray-600">
            Prefer a concierge experience? Email{" "}
            <Link href="mailto:sales@cloudusdigital.com" className="font-semibold text-blue-800 underline">
              sales@cloudusdigital.com
            </Link>{" "}
            and we’ll guide you through the process.
          </p>
        </div>
      </section>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <h1 className="text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Launch New Product
          </h1>
        </DialogTitle>
        <br />
        <DialogContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <br />
          <div className="w-full">
            <span className="block w-full border-b-4 pb-1"></span>
          </div>

          <div style={{ marginTop: 24, padding: "16px 0" }}>{renderStepContent(activeStep)}</div>
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

        {/* Hidden form for Salesforce Lead submission */}
        {!isLoggedIn && (
          <form
            ref={formRef}
            action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00DWU00000LaXxh"
            method="POST"
            target="_blank"
            style={{ display: "none" }}
          >
            {/* Required hidden fields */}
            <input type="hidden" name="oid" value="00DWU00000LaXxh" />
            <input type="hidden" name="retURL" value="http://cloudusdigital.com" />

            {/* Lead capture fields */}
            <input type="text" name="first_name" value={formData.first_name} readOnly />
            <input type="text" name="last_name" value={formData.last_name} readOnly />
            <input type="email" name="email" value={formData.email} readOnly />
            <input type="tel" name="phone" value={formData.phone} readOnly />
            <input type="text" name="company" value={formData.company} readOnly />
            <input type="text" name="description" value={formData.description} readOnly />

            {/* Product interest (map your selectedProduct to Salesforce picklist value) */}
            {selectedProduct && (
              <input
                type="hidden"
                name="00NWU00000PVzIh" // Replace with your Salesforce product interest field API name
                value={productInterestMap[selectedProduct] ?? ""}
                readOnly
              />
            )}
          </form>
        )}
      </Dialog>
    </>
  );
}
