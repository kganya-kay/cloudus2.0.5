"use client";

import Link from "next/link";
import React, { useState, ChangeEvent } from "react";

const SalesforceLeadForm = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    product_interest: '',
    description: '',
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <section
      id="contactSales"
      className="rounded-3xl border bg-white p-6 text-gray-800 shadow-sm"
    >
      <div className="grid gap-6 md:grid-cols-[1fr,1.2fr]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-blue-500">Talk to Cloudus</p>
          <h3 className="text-2xl font-semibold text-gray-900">Share your vision. We’ll co-create the roadmap.</h3>
          <p className="text-sm text-gray-600">
            Submit the form and our team will reach out within 24 hours. Tell us about the product,
            operations workflow, or service you want to digitise. We’ll align the right squad, estimate budget,
            and propose timelines.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>�?� Need a quick chat? WhatsApp <a href="https://wa.me/27640204765" className="font-semibold text-blue-700 underline">+27 64 020 4765</a>.</li>
            <li>�?� Prefer email? Drop a note to <a href="mailto:info@cloudusdigital.com" className="font-semibold text-blue-700 underline">info@cloudusdigital.com</a>.</li>
            <li>�?� Already a customer? Log a request via <Link href="/projects" className="font-semibold text-blue-700 underline">/projects</Link>.</li>
          </ul>
        </div>
        <form
          action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00DWU00000LaXxh"
          method="POST"
          className="space-y-4 rounded-2xl border border-blue-100 bg-slate-50/60 p-6"
        >
        <input type="hidden" name="oid" value="00DWU00000LaXxh" />
        <input type="hidden" name="retURL" value="http://cloudusdigital.com" />

        {/* Optional Debug Fields */}
        {/* 
        <input type="hidden" name="debug" value="1" />
        <input type="hidden" name="debugEmail" value="info@cloudusdigital.com" />
        */}


        <div className="space-y-4">
          <div>
            <label htmlFor="first_name" className="block font-medium">First Name:</label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              maxLength={40}
              value={formData.first_name}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="last_name" className="block font-medium">Last Name:</label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              maxLength={80}
              value={formData.last_name}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="email" className="block font-medium">Email:</label>
            <input
              id="email"
              name="email"
              type="email"
              maxLength={80}
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block font-medium">Phone:</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              maxLength={40}
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="company" className="block font-medium">Company:</label>
            <input
              id="company"
              name="company"
              type="text"
              maxLength={40}
              value={formData.company}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium">
              What do you need help with?
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Tell us about the outcome, audience, and preferred launch date."
              maxLength={255}
              value={formData.description}
              onChange={handleChange}
              required
              className="w-full rounded px-3 py-2"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="00NWU00000PVzIh" className="block font-medium">Product Interest:</label>
            <select
              id="00NWU00000PVzIh"
              name="00NWU00000PVzIh"
              value={formData.product_interest}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">--None--</option>
              <option value="1">Web Application Development</option>
              <option value="2">CRM integration</option>
              <option value="3">E-commerce Solutions</option>
              <option value="4">Cloud Hosting and Infrastructure</option>
              <option value="5">Mobile Application Development</option>
              <option value="6">Data Analytics and Business Intelligence</option>
              <option value="7">Cybersecurity Solutions</option>
              <option value="8">AI and Machine Learning Solutions</option>
              <option value="9">Software Development and Integration</option>
              <option value="10">Digital Marketing</option>
              <option value="11">Social Media Management</option>
            </select>
          </div>

          <div className="pt-2 text-center">
            <input
              type="submit"
              value="Send request"
              className="rounded-full bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700"
            />
          </div>
        </div>
        </form>
      </div>
    </section>
  );
};

export default SalesforceLeadForm;
