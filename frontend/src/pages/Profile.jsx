
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Diamond, Circle } from "lucide-react";
import Layout from "../components/Layout";
import { Row } from "../components/UI";
import { API_BASE_URL, api } from "../api";

import {
  getStoredUser,
  saveUser,
  clearStoredUser,
} from "../utils/userStorage";

export default function Profile() {
  const navigate = useNavigate();

  const cachedUser = getStoredUser() || {};

  const [profile, setProfile] = useState({
    name: cachedUser.name || "",
    email: cachedUser.email || "",
    phone: cachedUser.phone || "",
    profileImage: cachedUser.profileImage || "",
  });

  const [editData, setEditData] = useState({
    name: "",
    phone: "",
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateProfileState = (user) => {
    const updated = {
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      profileImage: user.profileImage || "",
    };

    setProfile(updated);

    setEditData({
      name: updated.name,
      phone: updated.phone,
    });
  };

  // ==========================================
  // LOAD USER PROFILE
  // ==========================================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await api("/profile");

        if (!data.user) {
          throw new Error("Profile information unavailable.");
        }

        updateProfileState(data.user);

        // Replace old cached data with minimized data.
        saveUser(data.user);
      } catch (err) {
        console.error("PROFILE LOAD ERROR:", err);

        setError(
          cachedUser.name || cachedUser.email
            ? `${err.message || "Failed to load profile"}. Showing saved account information.`
            : err.message || "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // ==========================================
  // SAVE PROFILE INFORMATION
  // ==========================================

  const handleSave = async () => {
    if (saving) return;

    setError("");
    setMessage("");

    if (!editData.name.trim()) {
      setError("Name cannot be empty");
      return;
    }

    try {
      setSaving(true);

      const data = await api("/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: editData.name.trim(),
          phone: editData.phone.trim(),
        }),
      });

      if (!data.user) {
        throw new Error("Invalid profile update response.");
      }

      updateProfileState(data.user);

      // Store only approved user fields.
      saveUser(data.user);

      setEditing(false);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(
        err.message || "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // UPLOAD PROFILE IMAGE
  // ==========================================

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please select a JPG, PNG or WEBP image."
      );
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Profile image must be smaller than 5 MB."
      );
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("profileImage", file);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please sign in again.");
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/profile/image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to upload profile image"
        );
      }

      if (!data.user) {
        throw new Error(
          "Invalid profile image response."
        );
      }

      updateProfileState(data.user);

      // Avoid saving the entire backend user object.
      saveUser(data.user);

      setMessage(
        "Profile image updated successfully!"
      );
    } catch (err) {
      console.error("IMAGE UPLOAD ERROR:", err);

      setError(
        err.message ||
          "Failed to upload profile image"
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  const handleCancel = () => {
    setEditData({
      name: profile.name || "",
      phone: profile.phone || "",
    });

    setEditing(false);
    setError("");
    setMessage("");
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    clearStoredUser();

    navigate("/login");
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <Layout title="Profile" back>
        <div className="profile-loading">
          Loading profile...
        </div>
      </Layout>
    );
  }

  const profileImageUrl = profile.profileImage
    ? `${API_BASE_URL.replace(/\/api\/?$/, "")}${profile.profileImage}`
    : "";

  return (
    <Layout title="Profile" back>
      {/* PROFILE HEADER */}

      <div className="profilehead">
        <div className="profile-avatar-section">
          <div className="avatar">
            {profile.profileImage ? (
              <img
                src={profileImageUrl}
                alt={`${profile.name || "User"} profile`}
                className="profile-avatar-image"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              profile.name
                ? profile.name.charAt(0).toUpperCase()
                : "U"
            )}
          </div>

          <label className="change-photo-btn">
            {uploading
              ? "Uploading..."
              : "Change Photo"}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              disabled={uploading}
              hidden
            />
          </label>
        </div>

        <div className="profile-heading-text">
          <h1>{profile.name || "User"}</h1>
          <p>Stay safe, stay confident.</p>
        </div>
      </div>

      {/* PERSONAL INFORMATION */}

      <div className="profile-info">
        <h3>Personal Information</h3>

        {error && (
          <div className="profile-error-message">
            {error}
          </div>
        )}

        {message && (
          <div className="profile-success-message">
            {message}
          </div>
        )}

        {/* NAME */}

        <div className="profile-field">
          <label>Name</label>

          {editing ? (
            <input
              type="text"
              value={editData.name}
              placeholder="Enter your name"
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
            />
          ) : (
            <p>{profile.name || "Not provided"}</p>
          )}
        </div>

        {/* EMAIL */}

        <div className="profile-field">
          <label>Email</label>

          <p>{profile.email || "Not provided"}</p>
        </div>

        {/* PHONE */}

        <div className="profile-field">
          <label>Phone Number</label>

          {editing ? (
            <input
              type="tel"
              value={editData.phone}
              placeholder="Enter phone number"
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  phone: e.target.value,
                }))
              }
            />
          ) : (
            <p>{profile.phone || "Not provided"}</p>
          )}
        </div>

        {/* EDIT / SAVE */}

        {!editing ? (
          <button
            type="button"
            className="profile-edit-btn"
            onClick={() => {
              setEditData({
                name: profile.name || "",
                phone: profile.phone || "",
              });

              setEditing(true);
              setMessage("");
              setError("");
            }}
          >
            Edit Profile
          </button>
        ) : (
          <div className="profile-actions">
            <button
              type="button"
              className="profile-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              className="profile-cancel-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* SAFETY */}

      <h3>Safety</h3>

      <Row
        icon={<Diamond />}
        onClick={() => navigate("/trusted-contact")}
      >
        Trusted Contacts
      </Row>

      <Row icon={<Diamond />}>
        Privacy Settings
      </Row>

      <Row icon={<Diamond />}>
        Location Permission
      </Row>

      {/* APP */}

      <h3>App</h3>

      <Row
        icon={<Circle />}
        onClick={() => navigate("/emergency")}
      >
        Emergency Helplines
      </Row>

      <Row icon={<Circle />}>
        Offline Data
      </Row>

      <Row icon={<Circle />}>
        Language
      </Row>

      <Row icon={<Circle />}>
        Help
      </Row>

      <Row icon={<Circle />}>
        About Nirapod Poth
      </Row>

      {/* SIGN OUT */}

      <button
        type="button"
        className="logout"
        onClick={handleLogout}
      >
        Sign Out
      </button>
    </Layout>
  );
}
