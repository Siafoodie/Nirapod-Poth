
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

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setError("");
    setSubmitting(true);

    try {
      const payload = register
        ? {
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
          }
        : {
            email: formData.email.trim(),
            password: formData.password,
          };

      const data = await api(
        register ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      if (!data.token || !data.user) {
        throw new Error(
          "Invalid authentication response."
        );
      }

      // Save authentication token
      localStorage.setItem("token", data.token);

      // Save user information including role
      saveUser(data.user);

      // Clear password
      setFormData({
        name: "",
        email: "",
        password: "",
      });

      // Detect role from server response
      const isAdmin =
        String(data.user.role || "")
          .trim()
          .toLowerCase() === "admin";

      // Redirect based on role
      navigate(
        isAdmin ? "/admin/reports" : "/home",
        { replace: true }
      );
    } catch (err) {
      setError(
        err.message || "Authentication failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="phone auth">
      <div className="authbox">
        <img
          src="/nirapod-logo.png"
          alt="Nirapod Poth"
          className="auth-logo"
        />

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
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              required
            />
          )}

          <input
            type="email"
            required
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
          />

          <input
            type="password"
            required
            minLength="6"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                password: e.target.value,
              }))
            }
          />

          {error && (
            <div className="error">
              {error}
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
            to={register ? "/login" : "/register"}
          >
            {register
              ? "Sign In"
              : "Create Account"}
          </Link>
        </p>
      </div>
    </div>
  );
}
