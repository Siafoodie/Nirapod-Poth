
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

  // OTP verification states
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [policeRegistrationComplete, setPoliceRegistrationComplete] =
    useState(false);

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

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
    });

    setRole("user");
    setPoliceRank("");
    setPoliceUnit("");
    setPoliceId("");
    setIdCardFile(null);
  };

  // Login / Registration
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setError("");
    setInfo("");
    setSubmitting(true);

    try {
      if (register && role === "police") {
        if (!policeRank) {
          throw new Error(
            "Please select your police rank / designation."
          );
        }

        if (!policeUnit.trim()) {
          throw new Error(
            "Current unit / police station is required."
          );
        }

        if (!policeId.trim()) {
          throw new Error(
            "Official BP ID number is required."
          );
        }

        if (!idCardFile) {
          throw new Error(
            "Please upload a scanned copy of your police ID card."
          );
        }

        if (idCardFile.size > 5 * 1024 * 1024) {
          throw new Error(
            "Police ID card image must be less than 5MB."
          );
        }

        if (
          !formData.email
            .trim()
            .toLowerCase()
            .endsWith("@police.gov.bd")
        ) {
          throw new Error(
            "Police accounts must use an official @police.gov.bd email."
          );
        }
      }

      let data;

      if (register && role === "police") {
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

        data = await api(
          register ? "/auth/register" : "/auth/login",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
      }

      // Registration successful: OTP required
      if (register && data.requiresOtp) {
        setVerificationEmail(
          data.email || formData.email.trim().toLowerCase()
        );

        setOtp("");
        setAwaitingOtp(true);

        setInfo(
          "OTP sent to your email. Enter the latest 6-digit code."
        );

        return;
      }

      // Police registration awaiting admin verification
      if (register && data.requiresVerification) {
        resetForm();
        setPoliceRegistrationComplete(true);

        setInfo(
          data.message ||
            "Police registration received. Wait for admin verification."
        );

        return;
      }

      // Registration should not continue without OTP
      if (register) {
        throw new Error(
          "Registration response did not include OTP verification."
        );
      }

      // Login response validation
      if (!data.token || !data.user) {
        throw new Error(
          "Invalid authentication response."
        );
      }

      localStorage.setItem("token", data.token);
      saveUser(data.user);

      resetForm();

      // Role-based redirect
      const userRole = String(data.user.role || "user")
        .trim()
        .toLowerCase();

      if (userRole === "admin") {
        navigate("/admin/reports", { replace: true });
      } else if (userRole === "police") {
        navigate("/police/dashboard", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (err) {
      setError(
        err.message || "Authentication failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Verify Email OTP
  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (submitting) return;

    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setError("");
    setInfo("");
    setSubmitting(true);

    try {
      const data = await api("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          email: verificationEmail,
          otp: otp.trim(),
        }),
      });

      // Police account: admin approval required
      if (data.requiresVerification) {
        setAwaitingOtp(false);
        setOtp("");
        setVerificationEmail("");
        resetForm();

        setPoliceRegistrationComplete(true);

        setInfo(
          data.message ||
            "Police registration completed. Your account is pending admin verification."
        );

        return;
      }

      // Normal user account
      if (!data.token || !data.user) {
        throw new Error(
          "Invalid OTP verification response."
        );
      }

      localStorage.setItem("token", data.token);
      saveUser(data.user);

      setAwaitingOtp(false);
      setOtp("");
      setVerificationEmail("");

      resetForm();

      const userRole = String(data.user.role || "user")
        .trim()
        .toLowerCase();

      if (userRole === "admin") {
        navigate("/admin/reports", { replace: true });
      } else if (userRole === "police") {
        navigate("/police/dashboard", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (err) {
      setError(
        err.message || "OTP verification failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Go back to registration to request another OTP
  const handleBackToRegistration = () => {
    setAwaitingOtp(false);
    setOtp("");
    setVerificationEmail("");
    setError("");
    setInfo("");
  };

  return (
    <div className="phone auth">
      <div className="authbox">
        <img
          src="/nirapod-logo.png"
          alt="Nirapod Poth"
          className="auth-logo"
        />

        {register && policeRegistrationComplete ? (
          <>
            <h1>Registration Submitted</h1>

            <p>
              Your police registration has been received.
            </p>

            <div
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 10,
                background: "#f5f3ff",
                color: "#4a2c85",
                textAlign: "center",
              }}
            >
              <h3>Pending Admin Verification</h3>

              <p>
                Your police ID card and account details
                must be verified by an administrator
                before you can sign in.
              </p>

              {info && <p>{info}</p>}
            </div>

            <p className="authswitch">
              <Link to="/login">
                Go to Sign In
              </Link>
            </p>
          </>
        ) : register && awaitingOtp ? (
          <>
            <h1>Verify your email</h1>

            <p>
              Enter the 6-digit OTP sent to
              <strong> {verificationEmail}</strong>
            </p>

            <form onSubmit={handleVerifyOtp}>
              <label style={labelStyle}>
                Verification Code

                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(event) =>
                    setOtp(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  style={{
                    ...fieldStyle,
                    textAlign: "center",
                    fontSize: 22,
                    letterSpacing: 5,
                    fontWeight: 700,
                  }}
                />
              </label>

              {error && (
                <div className="error">
                  {error}
                </div>
              )}

              {info && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 10,
                    background: "#f5f3ff",
                    color: "#5b2bd9",
                    fontSize: 13,
                  }}
                >
                  {info}
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  submitting || otp.length !== 6
                }
              >
                {submitting
                  ? "Verifying..."
                  : "Verify OTP"}
              </Button>
            </form>

            <button
              type="button"
              onClick={handleBackToRegistration}
              disabled={submitting}
              style={{
                marginTop: 16,
                border: "none",
                background: "none",
                color: "#5b2bd9",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Back to Registration / Request New OTP
            </button>

            <p
              style={{
                marginTop: 12,
                fontSize: 12,
                color: "#7e6c9c",
              }}
            >
              The OTP expires in 10 minutes.
            </p>
          </>
        ) : (
          <>
            <h1>
              {register
                ? "Create Account"
                : "Welcome Back"}
            </h1>

            <p>
              {register
                ? "Join Nirapod Poth"
                : "Sign in to continue safely"}
            </p>

            <form onSubmit={handleSubmit}>
              {register && (
                <label style={labelStyle}>
                  {role === "police"
                    ? "Full name"
                    : "Name"}

                  <input
                    type="text"
                    placeholder={
                      role === "police"
                        ? "Full name as on police ID card"
                        : "Name"
                    }
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
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
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  style={fieldStyle}
                />
              </label>

              {register && role === "police" && (
                <small
                  style={{
                    color: "#7e6c9c",
                    fontSize: 11,
                  }}
                >
                  Official @police.gov.bd email required.
                  Gmail/Yahoo not allowed.
                </small>
              )}

              <label style={labelStyle}>
                Password

                <input
                  type="password"
                  required
                  minLength={register ? 6 : undefined}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
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
                      onChange={(event) => {
                        setRole(event.target.value);

                        if (
                          event.target.value !== "police"
                        ) {
                          setPoliceRank("");
                          setPoliceUnit("");
                          setPoliceId("");
                          setIdCardFile(null);
                        }
                      }}
                      style={fieldStyle}
                    >
                      <option value="user">
                        Normal user
                      </option>

                      <option value="police">
                        Police
                      </option>
                    </select>
                  </label>

                  {role === "police" && (
                    <>
                      <label style={labelStyle}>
                        Rank / Position

                        <select
                          value={policeRank}
                          onChange={(event) =>
                            setPoliceRank(
                              event.target.value
                            )
                          }
                          required
                          style={fieldStyle}
                        >
                          <option value="">
                            Select rank
                          </option>

                          <option value="constable">
                            Constable
                          </option>

                          <option value="nayek">
                            Nayek
                          </option>

                          <option value="assistant_sub_inspector">
                            Assistant Sub-Inspector (ASI)
                          </option>

                          <option value="sub_inspector">
                            Sub-Inspector (SI)
                          </option>

                          <option value="inspector">
                            Inspector
                          </option>

                          <option value="asp">
                            ASP
                          </option>

                          <option value="other">
                            Other
                          </option>
                        </select>
                      </label>

                      <label style={labelStyle}>
                        Current unit / Police station

                        <input
                          type="text"
                          value={policeUnit}
                          onChange={(event) =>
                            setPoliceUnit(
                              event.target.value
                            )
                          }
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
                          onChange={(event) =>
                            setPoliceId(
                              event.target.value
                            )
                          }
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
                          onChange={(event) =>
                            setIdCardFile(
                              event.target.files?.[0] || null
                            )
                          }
                          style={{
                            ...fieldStyle,
                            padding: 8,
                          }}
                        />
                      </label>

                      <small
                        style={{
                          color: "#7e6c9c",
                          fontSize: 11,
                        }}
                      >
                        Upload a clear scan/photo of your
                        official Bangladesh Police ID card
                        (max 5MB).
                      </small>
                    </>
                  )}
                </>
              )}

              {error && (
                <div className="error">
                  {error}
                </div>
              )}

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

              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? "Please wait..."
                  : register
                    ? "Create Account"
                    : "Sign In"}
              </Button>
            </form>

            <p className="authswitch">
              {register
                ? "Already have an account? "
                : "New here? "}

              <Link
                to={
                  register
                    ? "/login"
                    : "/register"
                }
              >
                {register
                  ? "Sign In"
                  : "Create Account"}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
