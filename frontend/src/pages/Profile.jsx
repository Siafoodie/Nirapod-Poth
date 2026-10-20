
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserRound,
  Mail,
  Phone,
  Pencil,
  Camera,
  Save,
  X,
  Info,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Users,
  PhoneCall,
  LoaderCircle,
} from "lucide-react";

import Layout from "../components/Layout";
import { API_BASE_URL, api } from "../api";
import {
  getStoredUser,
  saveUser,
  clearStoredUser,
} from "../utils/userStorage";

import "./Profile.css";

// Convert image path to full URL
function imageUrl(path) {
  if (!path) return "";

  const value = String(path).trim();

  if (/^(https?:\/\/|data:|blob:)/i.test(value)) {
    return value;
  }

  const server = String(API_BASE_URL || "")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");

  return `${server}/${value.replace(/^\/+/, "")}`;
}

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [initialUser] = useState(
    () => getStoredUser() || {}
  );

  const [profile, setProfile] = useState({
    name: initialUser.name || "",
    email: initialUser.email || "",
    phone: initialUser.phone || "",
    profileImage: initialUser.profileImage || "",
  });

  const [editData, setEditData] = useState({
    name: initialUser.name || "",
    phone: initialUser.phone || "",
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [avatarError, setAvatarError] = useState(false);

  // Update profile state
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

    setAvatarError(false);
  };

  // Load profile from backend
  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const data = await api("/profile");

        if (!data.user) {
          throw new Error(
            "Profile information unavailable."
          );
        }

        if (mounted) {
          updateProfileState(data.user);
          saveUser(data.user);
        }
      } catch (err) {
        console.error("PROFILE LOAD ERROR:", err);

        if (mounted) {
          setError(
            initialUser.name || initialUser.email
              ? `${err.message || "Failed to load profile"}. Showing saved account information.`
              : err.message || "Failed to load profile"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [initialUser]);

  // Save edited profile
  const handleSave = async () => {
    if (saving) return;

    setError("");
    setMessage("");

    if (!editData.name.trim()) {
      setError("Name cannot be empty.");
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
        throw new Error(
          "Invalid profile update response."
        );
      }

      updateProfileState(data.user);
      saveUser(data.user);

      setEditing(false);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(
        err.message || "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditData({
      name: profile.name,
      phone: profile.phone,
    });

    setEditing(false);
    setError("");
  };

  // Upload profile picture
  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setMessage("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please select a JPG, PNG, or WebP image."
      );
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be under 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("image", file);

      const data = await api("/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!data.user) {
        throw new Error(
          "Invalid image upload response."
        );
      }

      updateProfileState(data.user);
      saveUser(data.user);

      setMessage(
        "Profile picture updated successfully!"
      );
    } catch (err) {
      setError(
        err.message || "Failed to upload image."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  // Sign out
  const handleSignOut = () => {
    clearStoredUser();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const avatar = imageUrl(profile.profileImage);

  return (
    <Layout>
      <main className="np-profile-page">
        <div className="np-profile-container">

          {/* Page heading */}
          <div className="np-profile-heading">
            <div>
              <span className="np-profile-eyebrow">
                MY ACCOUNT
              </span>
              <h1>My Profile</h1>
              <p>
                Manage your personal information
                and safety settings.
              </p>
            </div>

            <ShieldCheck
              size={34}
              color="#8b50e5"
            />
          </div>

          {/* Notifications */}
          {error && (
            <div
              className="np-profile-alert error"
              role="alert"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              className="np-profile-alert success"
              role="status"
            >
              {message}
            </div>
          )}

          {/* Profile Card */}
          <section className="np-profile-main-card">

            <div className="np-profile-cover" />

            <div className="np-profile-avatar-wrapper">
              <div className="np-profile-avatar-large">
                {avatar && !avatarError ? (
                  <img
                    src={avatar}
                    alt="Profile"
                    onError={() =>
                      setAvatarError(true)
                    }
                  />
                ) : (
                  <UserRound size={48} />
                )}
              </div>

              <button
                type="button"
                className="np-profile-camera"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={uploading}
                title="Change profile picture"
                aria-label="Change profile picture"
              >
                {uploading ? (
                  <LoaderCircle
                    size={19}
                    className="np-profile-spinner"
                  />
                ) : (
                  <Camera size={19} />
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={handleImageUpload}
              />
            </div>

            <div className="np-profile-identity">
              <h2>
                {profile.name || "Your Name"}
              </h2>

              <p>
                {profile.email ||
                  "No email available"}
              </p>
            </div>

            {loading && (
              <p className="np-profile-loading">
                Loading profile...
              </p>
            )}

            {/* Edit Profile */}
            <div className="np-profile-form">

              <div className="np-profile-form-heading">
                <h3>Personal Information</h3>

                {!editing && (
                  <button
                    type="button"
                    className="np-profile-edit-btn"
                    onClick={() =>
                      setEditing(true)
                    }
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                )}
              </div>

              <div className="np-profile-field">
                <label htmlFor="np-profile-name">
                  <UserRound size={17} />
                  Full Name
                </label>

                <input
                  id="np-profile-name"
                  type="text"
                  value={
                    editing
                      ? editData.name
                      : profile.name
                  }
                  disabled={!editing || saving}
                  onChange={(event) =>
                    setEditData({
                      ...editData,
                      name: event.target.value,
                    })
                  }
                />
              </div>

              <div className="np-profile-field">
                <label htmlFor="np-profile-email">
                  <Mail size={17} />
                  Email Address
                </label>

                <input
                  id="np-profile-email"
                  type="email"
                  value={profile.email}
                  disabled
                />
              </div>

              <div className="np-profile-field">
                <label htmlFor="np-profile-phone">
                  <Phone size={17} />
                  Phone Number
                </label>

                <input
                  id="np-profile-phone"
                  type="tel"
                  value={
                    editing
                      ? editData.phone
                      : profile.phone
                  }
                  disabled={!editing || saving}
                  onChange={(event) =>
                    setEditData({
                      ...editData,
                      phone: event.target.value,
                    })
                  }
                />
              </div>

              {editing && (
                <div className="np-profile-form-actions">
                  <button
                    type="button"
                    className="np-profile-cancel-btn"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X size={17} />
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="np-profile-save-btn"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save size={17} />
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Account Options */}
          <section className="np-profile-options">
            <h3>Account & Safety</h3>

            <button
              type="button"
              className="np-profile-option"
              onClick={() =>
                navigate("/trusted-contact")
              }
            >
              <Users size={21} />
              <span>Trusted Contacts</span>
              <ChevronRight size={19} />
            </button>

            <button
              type="button"
              className="np-profile-option"
              onClick={() =>
                navigate("/helplines")
              }
            >
              <PhoneCall size={21} />
              <span>Emergency Helplines</span>
              <ChevronRight size={19} />
            </button>

            <button
              type="button"
              className="np-profile-option"
              onClick={() =>
                navigate("/about")
              }
            >
              <Info size={21} />
              <span>About Nirapod Poth</span>
              <ChevronRight size={19} />
            </button>
          </section>

          {/* Sign Out */}
          <button
            type="button"
            className="np-profile-signout"
            onClick={handleSignOut}
          >
            <LogOut size={20} />
            Sign Out
          </button>

        </div>
      </main>
    </Layout>
  );
}
