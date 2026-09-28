import React, { useState } from "react";

const ReportForm = () => {
  const [formData, setFormData] = useState({
    incidentType: "",
    location: "",
    description: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Incident Report:", formData);
  };

  return (
    <div className="report-form-container">
      <h2>Report an Incident</h2>
      <p>Please provide the details of the incident.</p>

      <form onSubmit={handleSubmit} className="report-form">

        <div className="form-group">
          <label htmlFor="incidentType">Incident Type</label>

          <select
            id="incidentType"
            name="incidentType"
            value={formData.incidentType}
            onChange={handleChange}
            required
          >
            <option value="">Select incident type</option>
            <option value="harassment">Harassment</option>
            <option value="stalking">Stalking</option>
            <option value="theft">Theft</option>
            <option value="unsafe-area">Unsafe Area</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>

          <input
            type="text"
            id="location"
            name="location"
            placeholder="Enter incident location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>

          <textarea
            id="description"
            name="description"
            placeholder="Describe what happened..."
            rows="5"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="report-submit-btn">
          Submit Report
        </button>

      </form>
    </div>
  );
};

export default ReportForm;