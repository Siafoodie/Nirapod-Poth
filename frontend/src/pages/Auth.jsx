import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { Button } from "../components/UI";
import { saveUser } from "../utils/userStorage";

export default function Auth({ register = false }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [role, setRole] = useState("user");
  const [policeRank, setPoliceRank] = useState("");
  const [policeUnit, setPoliceUnit] = useState("");
  const [policeId, setPoliceId] = useState("");
  const [idCardFile, setIdCardFile] = useState(null);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setInfo("");
    setSubmitting(true);

    try {
      if (register && role === "police") {
        if (!policeRank) {
          throw new Error("Please select your police rank / designation.");
        }
        if (!policeUnit.trim()) {
          throw new Error("Current unit / police station is required.");
        }
        if (!policeId.trim()) {
          throw new Error("Official BP ID number is required.");
        }
        if (!idCardFile) {
          throw new Error("Please upload a scanned copy of your police ID card.");
        }
        if (!formData.email.trim().toLowerCase().endsWith("@police.gov.bd")) {
          throw new Error(
            "Police accounts must use an official @police.gov.bd email."
          );
        }
      }

      let data;

      if (register && role === "police") {
        // multipart — required for ID card image
        const fd = new FormData();
        fd.append("name", formData.name.trim());
        fd.append("email", formData.email.trim());
        fd.append("password", formData.password);
        fd.append("role", "police");
        fd.append("policeRank", policeRank);
        fd.append("policeUnit", policeUnit.trim());
        fd.append("policeId", policeId.trim());
        fd.append("policeIdCard", idCardFile);

        data = await api("/auth/register", {
          method: "POST",
          body: fd,
        });
      } else {
        const payload = register
          ? {
              name: formData.name.trim(),
              email: formData.email.trim(),
              password: formData.password,
              role: "user",
            }
          : {
              email: formData.email.trim(),
              password: formData.password,
            };

        data = await api(register ? "/auth/register" : "/auth/login", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      // Police pending verification — no token
      if (register && (data.requiresVerification || !data.token)) {
        setInfo(
          data.message ||
            "Registration submitted. Admin will verify your police ID before you can sign in."
        );
        setFormData({ name: "", email: "", password: "" });
        setRole("user");
        setPoliceRank("");
        setPoliceUnit("");
        setPoliceId("");
        setIdCardFile(null);
        return;
      }

      if (!data.token || !data.user) {
        throw new Error("Invalid authentication response.");
      }

      localStorage.setItem("token", data.token);
      saveUser(data.user);

      setFormData({ name: "", email: "", password: "" });
      setRole("user");
      setPoliceRank("");
      setPoliceUnit("");
      setPoliceId("");
      setIdCardFile(null);

      const userRole = String(data.user.role || "")
        .trim()
        .toLowerCase();

      navigate(userRole === "admin" ? "/admin/reports" : "/home", {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyle = {
    width: "100%",
    padding: 10,
    marginTop: 6,
    borderRadius: 10,
    border: "1px solid #e5dcf2",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    textAlign: "left",
    fontSize: 13,
    fontWeight: 600,
    marginTop: 10,
    color: "#4a2c85",
  };

  return (
    <div className="phone auth">
      <div className="authbox">
        <img
          src="/nirapod-logo.png"
          alt="Nirapod Poth"
          className="auth-logo"
        />

        <h1>{register ? "Create Account" : "Welcome Back"}</h1>
        <p>
          {register ? "Join Nirapod Poth" : "Sign in to continue safely"}
        </p>

        <form onSubmit={handleSubmit}>
          {register && (
            <label style={labelStyle}>
              {role === "police" ? "Full name" : "Name"}
              <input
                type="text"
                placeholder={
                  role === "police"
                    ? "Full name as on police ID card"
                    : "Name"
                }
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                style={fieldStyle}
              />
            </label>
          )}

          <label style={labelStyle}>
            Email
            <input
              type="email"
              required
              placeholder={
                register && role === "police"
                  ? "name@police.gov.bd"
                  : "Email"
              }
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              style={fieldStyle}
            />
          </label>
          {register && role === "police" && (
            <small style={{ color: "#7e6c9c", fontSize: 11 }}>
              Official @police.gov.bd email required. Gmail/Yahoo not allowed.
            </small>
          )}

          <label style={labelStyle}>
            Password
            <input
              type="password"
              required
              minLength="6"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              style={fieldStyle}
            />
          </label>

          {register && (
            <>
              <label style={labelStyle}>
                Account type
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (e.target.value !== "police") {
                      setPoliceRank("");
                      setPoliceUnit("");
                      setPoliceId("");
                      setIdCardFile(null);
                    }
                  }}
                  style={fieldStyle}
                >
                  <option value="user">Normal user</option>
                  <option value="police">Police</option>
                </select>
              </label>

              {role === "police" && (
                <>
                  <label style={labelStyle}>
                    Rank / Position
                    <select
                      value={policeRank}
                      onChange={(e) => setPoliceRank(e.target.value)}
                      required
                      style={fieldStyle}
                    >
                      <option value="">Select rank</option>
                      <option value="constable">Constable</option>
                      <option value="nayek">Nayek</option>
                      <option value="assistant_sub_inspector">
                        Assistant Sub-Inspector (ASI)
                      </option>
                      <option value="sub_inspector">Sub-Inspector (SI)</option>
                      <option value="inspector">Inspector</option>
                      <option value="asp">ASP</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <label style={labelStyle}>
                    Current unit / Police station
                    <input
                      type="text"
                      value={policeUnit}
                      onChange={(e) => setPoliceUnit(e.target.value)}
                      required
                      placeholder="e.g. Mirpur Model Thana, DMP"
                      style={fieldStyle}
                    />
                  </label>

                  <label style={labelStyle}>
                    Official BP ID number
                    <input
                      type="text"
                      value={policeId}
                      onChange={(e) => setPoliceId(e.target.value)}
                      required
                      placeholder="Official BP ID / badge number"
                      style={fieldStyle}
                    />
                  </label>

                  <label style={labelStyle}>
                    Police ID card photo
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) =>
                        setIdCardFile(e.target.files?.[0] || null)
                      }
                      style={{ ...fieldStyle, padding: 8 }}
                    />
                  </label>
                  <small style={{ color: "#7e6c9c", fontSize: 11 }}>
                    Upload a clear scan/photo of your official Bangladesh Police
                    ID card (max 5MB).
                  </small>
                </>
              )}
            </>
          )}

          {error && <div className="error">{error}</div>}
          {info && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                background: "#f5f3ff",
                color: "#5b2bd9",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {info}
            </div>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting
              ? "Please wait..."
              : register
                ? "Create Account"
                : "Sign In"}
          </Button>
        </form>

        <p className="authswitch">
          {register ? "Already have an account? " : "New here? "}
          <Link to={register ? "/login" : "/register"}>
            {register ? "Sign In" : "Create Account"}
          </Link>
        </p>
      </div>
    </div>
  );
} 