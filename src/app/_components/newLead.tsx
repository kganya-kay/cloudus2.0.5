'use client';

import React, { useState, ChangeEvent } from 'react';

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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div id='contactSales' className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00DWU00000LaXxh"
        method="POST"
        className="bg-white p-8 rounded-lg shadow-md w-[80vw] max-w-2xl text-gray-800"
      >
        <input type="hidden" name="oid" value="00DWU00000LaXxh" />
        <input type="hidden" name="retURL" value="http://cloudusdigital.com" />

        {/* Optional Debug Fields */}
        {/* 
        <input type="hidden" name="debug" value="1" />
        <input type="hidden" name="debugEmail" value="kganyakekana@gmail.com" />
        */}

        <h2 className="text-2xl font-bold mb-6 text-center">Contact Sales</h2>

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
            <label htmlFor="description" className="block font-medium">Description:</label>
            <input
              id="description"
              name="description"
              type="text-area"
              placeholder="Please provide a brief description of your inquiry."
              maxLength={40}
              value={formData.description}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
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
              <option value="GC1000 series">GC1000 series</option>
              <option value="GC5000 series">GC5000 series</option>
              <option value="GC3000 series">GC3000 series</option>
            </select>
          </div>

          <div className="text-center pt-4">
            <input
              type="submit"
              value="Submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default SalesforceLeadForm;
