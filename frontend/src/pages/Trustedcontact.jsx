import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Button } from "../components/UI";
import { api } from "../api";

export default function TrustedContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Load contacts
  const loadContacts = async () => {
    try {
      setLoadError("");
      const response = await api("/contacts");
      const data = Array.isArray(response)
        ? response
        : response.contacts || response.data;
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

  // Add contact
  const addContact = async () => {
    const name = prompt("Contact name");

    if (!name || !name.trim()) {
      return;
    }

    const phone = prompt("Phone number");

    if (!phone || !phone.trim()) {
      return;
    }

    try {
      const newContact = await api("/contacts", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          primary: contacts.length === 0,
        }),
      });

      // Immediately show new contact
      setContacts((previousContacts) => [
        newContact,
        ...previousContacts,
      ]);
    } catch (error) {
      console.error("Failed to add contact:", error);
      alert("Failed to add contact.");
    }
  };

  // Edit contact
  const editContact = async (contact) => {
    const name = prompt("Contact name", contact.name);

    if (!name || !name.trim()) {
      return;
    }

    const phone = prompt("Phone number", contact.phone);

    if (!phone || !phone.trim()) {
      return;
    }

    try {
      const updatedContact = await api(
        "/contacts/" + contact._id,
        {
          method: "PUT",
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            primary: contact.primary,
          }),
        }
      );

      // Immediately update contact on screen
      setContacts((previousContacts) =>
        previousContacts.map((item) =>
          item._id === updatedContact._id
            ? updatedContact
            : item
        )
      );
    } catch (error) {
      console.error("Failed to edit contact:", error);
      alert("Failed to update contact.");
    }
  };

  // Delete contact
  const deleteContact = async (contact) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${contact.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api("/contacts/" + contact._id, {
        method: "DELETE",
      });

      // Immediately remove contact from screen
      setContacts((previousContacts) =>
        previousContacts.filter(
          (item) => item._id !== contact._id
        )
      );
    } catch (error) {
      console.error("Failed to delete contact:", error);
      alert("Failed to delete contact.");
    }
  };

  return (
    <Layout
      title="Trusted Contacts"
      back
      right={
        <button
          className="headplus"
          onClick={addContact}
        >
          +
        </button>
      }
    >
      <div className="contacts">
        {loading && <p role="status">Loading trusted contacts...</p>}
        {!loading && loadError && (
          <p className="profile-error-message" role="alert">
            {loadError}
          </p>
        )}
        {!loading && !loadError && contacts.length === 0 && (
          <p className="muted">
            No trusted contacts yet. Add one to get started.
          </p>
        )}
        {contacts.map((contact) => (
          <div
            className="contact"
            key={contact._id}
          >
            <div className="avatar">●</div>

            <div className="contact-info">
              <h2>{contact.name}</h2>
              <p>{contact.phone}</p>

              {contact.primary && (
                <span>Primary Contact</span>
              )}
            </div>

            <div className="contact-actions">
              <button
                className="edit-btn"
                onClick={() => editContact(contact)}
              >
                Edit
              </button>

              <button
                className="delete-btn"
                onClick={() => deleteContact(contact)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="contact-bottom">
        <Button onClick={addContact}>
          ＋ Add Contact
        </Button>

        <p>
          They will receive your location,
          <br />
          emergency alerts and check-in messages.
        </p>
      </div>
    </Layout>
  );
}