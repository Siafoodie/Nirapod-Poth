
import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api";

const emptyForm = {
  name: "",
  phone: "",
  primary: false,
};

export default function TrustedContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadContacts = async () => {
    try {
      setLoadError("");

      const response = await api("/contacts");

      const data = Array.isArray(response)
        ? response
        : response?.contacts ?? response?.data?.contacts ?? response?.data;

      if (!Array.isArray(data)) {
        throw new Error("The contacts API returned an invalid response.");
      }

      setContacts(data);
    } catch (error) {
      console.error("Failed to load contacts:", error);
      setLoadError(error.message || "Failed to load contacts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const openAddForm = () => {
    setEditingContact(null);
    setForm({
      name: "",
      phone: "",
      primary: contacts.length === 0,
    });
    setActionError("");
    setShowForm(true);
  };

  const openEditForm = (contact) => {
    setEditingContact(contact);
    setForm({
      name: contact.name || "",
      phone: contact.phone || "",
      primary: Boolean(contact.primary),
    });
    setActionError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingContact(null);
    setForm(emptyForm);
    setActionError("");
  };

  const saveContact = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const phone = form.phone.trim();

    if (!name) {
      setActionError("Please enter a contact name.");
      return;
    }

    if (!/^\+?[0-9]{7,15}$/.test(phone)) {
      setActionError(
        "Enter a valid phone number (7-15 digits, optional +)."
      );
      return;
    }

    try {
      setSaving(true);
      setActionError("");

      const payload = {
        name,
        phone,
        primary: form.primary,
      };

      if (editingContact) {
        await api(`/contacts/${editingContact._id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/contacts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setShowForm(false);
      setEditingContact(null);
      setForm(emptyForm);

      await loadContacts();
    } catch (error) {
      console.error("Failed to save contact:", error);
      setActionError(error.message || "Failed to save contact.");
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async (contact) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${contact.name}?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(contact._id);
      setActionError("");

      await api(`/contacts/${contact._id}`, {
        method: "DELETE",
      });

      setContacts((previous) =>
        previous.filter((item) => item._id !== contact._id)
      );
    } catch (error) {
      console.error("Failed to delete contact:", error);
      setActionError(error.message || "Failed to delete contact.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout
      title="Trusted Contacts"
      back
      right={
        <button
          type="button"
          onClick={openAddForm}
          style={styles.headerButton}
        >
          + Add
        </button>
      }
    >
      <div style={styles.page}>
        <div style={styles.intro}>
          <div style={styles.introIcon}>🛡️</div>
          <h2 style={styles.heading}>Your Trusted Circle</h2>
          <p style={styles.subtitle}>
            Keep your closest people connected for extra safety.
          </p>
          <div style={styles.countBadge}>
            {contacts.length} Trusted{" "}
            {contacts.length === 1 ? "Contact" : "Contacts"}
          </div>
        </div>

        {actionError && !showForm && (
          <div role="alert" style={styles.error}>
            {actionError}
          </div>
        )}

        {loading && (
          <p style={styles.message}>Loading trusted contacts...</p>
        )}

        {!loading && loadError && (
          <div role="alert" style={styles.error}>
            {loadError}
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadContacts();
              }}
              style={styles.retryButton}
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !loadError && contacts.length === 0 && (
          <div style={styles.emptyState}>
            <div style={{ fontSize: 44 }}>👥</div>
            <h3>No trusted contacts yet</h3>
            <p>Add someone you trust to get started.</p>
          </div>
        )}

        {!loading && !loadError && (
          <div style={styles.list}>
            {contacts.map((contact) => (
              <div key={contact._id} style={styles.card}>
                <div style={styles.cardMain}>
                  <div style={styles.avatar}>
                    {(contact.name || "?")
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div style={styles.contactInfo}>
                    <div style={styles.nameRow}>
                      <h3 style={styles.contactName}>
                        {contact.name}
                      </h3>

                      {contact.primary && (
                        <span style={styles.primaryBadge}>
                          ★ Primary
                        </span>
                      )}
                    </div>

                    <p style={styles.phone}>
                      ☎ {contact.phone}
                    </p>
                  </div>
                </div>

                <div style={styles.actions}>
                  <button
                    type="button"
                    onClick={() => openEditForm(contact)}
                    style={styles.editButton}
                  >
                    ✎ Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteContact(contact)}
                    disabled={deletingId === contact._id}
                    style={styles.deleteButton}
                  >
                    {deletingId === contact._id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={openAddForm}
          style={styles.addButton}
        >
          <span style={{ fontSize: 20 }}>＋</span>
          Add New Contact
        </button>

        <div style={styles.infoBox}>
          <span style={{ fontSize: 22 }}>💜</span>
          <p style={styles.infoText}>
            Trusted contacts can receive your location,
            emergency alerts and safety check-in messages
            when those features are used.
          </p>
        </div>
      </div>

      {showForm && (
        <div
          style={styles.overlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-form-title"
            style={styles.modal}
          >
            <div style={styles.modalHeader}>
              <div>
                <h2
                  id="contact-form-title"
                  style={styles.modalTitle}
                >
                  {editingContact
                    ? "Edit Contact"
                    : "Add Trusted Contact"}
                </h2>
                <p style={styles.modalSubtitle}>
                  Enter all contact details below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close"
                style={styles.closeButton}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveContact}>
              <div style={styles.field}>
                <label htmlFor="contact-name" style={styles.label}>
                  Full Name
                </label>

                <input
                  id="contact-name"
                  type="text"
                  placeholder="e.g. Sadia Ahmed"
                  value={form.name}
                  maxLength={80}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label htmlFor="contact-phone" style={styles.label}>
                  Phone Number
                </label>

                <input
                  id="contact-phone"
                  type="tel"
                  placeholder="e.g. 01712345678"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      phone: event.target.value,
                    }))
                  }
                  required
                  style={styles.input}
                />
              </div>

              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={form.primary}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      primary: event.target.checked,
                    }))
                  }
                  style={styles.checkbox}
                />

                <div>
                  <strong style={{ fontSize: 14 }}>
                    Set as Primary Contact
                  </strong>
                  <p style={styles.checkboxHint}>
                    Mark this person as your main trusted contact.
                  </p>
                </div>
              </label>

              {actionError && (
                <p role="alert" style={styles.error}>
                  {actionError}
                </p>
              )}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={styles.saveButton}
                >
                  {saving
                    ? "Saving..."
                    : editingContact
                    ? "Save Changes"
                    : "Save Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles = {
  page: {
    width: "100%",
    maxWidth: 760,
    margin: "0 auto",
    padding: "12px 16px 40px",
    boxSizing: "border-box",
    fontFamily: "Inter, system-ui, sans-serif",
  },

  intro: {
    textAlign: "center",
    marginBottom: 30,
  },

  introIcon: {
    width: 66,
    height: 66,
    margin: "0 auto 12px",
    display: "grid",
    placeItems: "center",
    borderRadius: 20,
    background: "#f0e9ff",
    fontSize: 30,
  },

  heading: {
    fontSize: 25,
    fontWeight: 800,
    color: "#24183b",
    margin: "0 0 8px",
  },

  subtitle: {
    color: "#7b728e",
    fontSize: 14,
    lineHeight: 1.6,
    margin: "0 0 14px",
  },

  countBadge: {
    display: "inline-block",
    background: "#f1ebff",
    color: "#7040d4",
    borderRadius: 30,
    padding: "7px 16px",
    fontSize: 12,
    fontWeight: 700,
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
    background: "#ffffff",
    border: "1px solid #eee7fc",
    borderRadius: 18,
    padding: "18px 20px",
    boxShadow: "0 6px 22px rgba(99, 57, 166, 0.055)",
  },

  cardMain: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flex: "1 1 220px",
    minWidth: 0,
  },

  avatar: {
    width: 52,
    height: 52,
    flexShrink: 0,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "linear-gradient(135deg, #eee4ff, #e3d6ff)",
    color: "#7541dc",
    fontSize: 22,
    fontWeight: 800,
  },

  contactInfo: {
    minWidth: 0,
  },

  nameRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  contactName: {
    margin: 0,
    fontSize: 16,
    fontWeight: 750,
    color: "#261a3d",
    overflowWrap: "anywhere",
  },

  primaryBadge: {
    background: "#f0e9ff",
    color: "#7341d3",
    fontSize: 10,
    fontWeight: 700,
    padding: "5px 9px",
    borderRadius: 20,
  },

  phone: {
    margin: "7px 0 0",
    fontSize: 13,
    color: "#777084",
    overflowWrap: "anywhere",
  },

  actions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  editButton: {
    padding: "10px 15px",
    borderRadius: 10,
    border: "1px solid #e5d8ff",
    background: "#f5f0ff",
    color: "#7542d7",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 12,
  },

  deleteButton: {
    padding: "10px 15px",
    borderRadius: 10,
    border: "1px solid #ffe0e4",
    background: "#fff0f2",
    color: "#d6334e",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 12,
  },

  addButton: {
    width: "100%",
    marginTop: 24,
    padding: "15px",
    border: "none",
    borderRadius: 14,
    background: "linear-gradient(135deg, #8647f5, #6335d6)",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 750,
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(117, 65, 215, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  infoBox: {
    marginTop: 22,
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    padding: "16px 18px",
    background: "#faf7ff",
    border: "1px solid #eee6ff",
    borderRadius: 14,
  },

  infoText: {
    fontSize: 12,
    lineHeight: 1.7,
    color: "#756b87",
    margin: 0,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(25, 16, 48, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    boxSizing: "border-box",
  },

  modal: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: 22,
    padding: 28,
    boxSizing: "border-box",
    boxShadow: "0 24px 70px rgba(22, 12, 45, 0.25)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 26,
  },

  modalTitle: {
    fontSize: 23,
    color: "#27163f",
    fontWeight: 800,
    margin: "0 0 6px",
  },

  modalSubtitle: {
    color: "#80758f",
    fontSize: 13,
    margin: 0,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "none",
    background: "#f4f0fa",
    color: "#6d5a83",
    fontSize: 24,
    cursor: "pointer",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    marginBottom: 20,
  },

  label: {
    color: "#322346",
    fontSize: 13,
    fontWeight: 700,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #ddd4eb",
    borderRadius: 11,
    fontSize: 14,
    outlineColor: "#8650e8",
    background: "#ffffff",
    color: "#27183d",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: 15,
    background: "#faf7ff",
    borderRadius: 12,
    cursor: "pointer",
    marginBottom: 20,
    color: "#322346",
  },

  checkbox: {
    width: 18,
    height: 18,
    accentColor: "#7541dc",
    cursor: "pointer",
    flexShrink: 0,
  },

  checkboxHint: {
    margin: "5px 0 0",
    color: "#81758f",
    fontSize: 12,
    lineHeight: 1.5,
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 24,
  },

  cancelButton: {
    padding: "12px 18px",
    background: "#f4f1f8",
    color: "#61536f",
    border: "none",
    borderRadius: 11,
    fontWeight: 700,
    cursor: "pointer",
  },

  saveButton: {
    padding: "12px 20px",
    background: "#7541dc",
    color: "#ffffff",
    border: "none",
    borderRadius: 11,
    fontWeight: 700,
    cursor: "pointer",
  },

  error: {
    padding: "12px 14px",
    background: "#fff0f0",
    color: "#b42318",
    borderRadius: 10,
    fontSize: 13,
    marginBottom: 16,
  },

  retryButton: {
    display: "block",
    marginTop: 10,
    border: "none",
    background: "#7541dc",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
  },

  emptyState: {
    padding: "45px 20px",
    textAlign: "center",
    border: "1px dashed #dcd0f4",
    borderRadius: 18,
    background: "#fcfaff",
    color: "#6c607e",
  },

  message: {
    textAlign: "center",
    color: "#776b86",
    padding: 25,
  },
};
