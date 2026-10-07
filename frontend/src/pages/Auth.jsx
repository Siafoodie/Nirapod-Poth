import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { Button } from "../components/UI";

export default function Auth({ register = false }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const data = await api(
        register ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(formData),
        }
      );

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/home");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="phone auth">
      <div className="authbox">

        {/* Nirapod Poth Logo */}
        <img
          src="/nirapod-logo.png"
          alt="Nirapod Poth"
          className="auth-logo"
        />

        <h1>
          {register ? "Create Account" : "Welcome Back"}
        </h1>

        <p>
          {register
            ? "Join Nirapod Poth"
            : "Sign in to continue safely"}
        </p>

        <form onSubmit={handleSubmit}>

          {/* Name only for Registration */}
          {register && (
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
              required
            />
          )}

          {/* Email */}
          <input
            type="email"
            required
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({
                ...formData,
                email: e.target.value,
              })
            }
          />

          {/* Password */}
          <input
            type="password"
            required
            minLength="6"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData({
                ...formData,
                password: e.target.value,
              })
            }
          />

          {/* Error Message */}
          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <Button type="submit">
            {register ? "Create Account" : "Sign In"}
          </Button>

        </form>

        <p className="authswitch">
          {register
            ? "Already have an account? "
            : "New here? "}

          <Link to={register ? "/login" : "/register"}>
            {register ? "Sign In" : "Create Account"}
          </Link>
        </p>

      </div>
    </div>
  );
}