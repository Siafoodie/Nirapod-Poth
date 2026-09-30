import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Button } from "../components/UI";
import { api } from "../api";
import useGeolocation from "../hooks/useGeolocation";

export default function ImSafe() {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [includeLocation, setIncludeLocation] = useState(true);

  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [sending, setSending] = useState(false);

  const {
    getCurrentPosition,
    getMapsLink,
  } = useGeolocation();


  // Load Trusted Contacts
  useEffect(() => {
    api("/contacts")
      .then((data) => {

        const list = Array.isArray(data)
          ? data
          : data.contacts || [];

        setContacts(list);

        setSelected(
          list
            .slice(0, 2)
            .map((contact) => contact._id)
        );

      })
      .catch(() => {

        setContacts([]);

        setStatus(
          "Failed to load trusted contacts."
        );

        setStatusType("error");

      });

  }, []);



  // Select / Unselect Contact
  const toggleContact = (id) => {

    setSelected((current) =>

      current.includes(id)

        ? current.filter(
            (item) => item !== id
          )

        : [...current, id]

    );

  };



  // Send Check-In
  const send = async () => {


    if (selected.length === 0) {

      setStatus(
        "Please select at least one trusted contact."
      );

      setStatusType("error");

      return;
    }


    setSending(true);

    setStatus("");

    setStatusType("");



    try {

      let message = "I'm safe.";



      // Try getting location
      if (includeLocation) {

        try {

          const coords =
            await getCurrentPosition();


          const mapsLink =
            getMapsLink(coords);


          message =
            `I'm safe. My current location: ${mapsLink}`;


        } catch (error) {

          console.warn(
            "Location unavailable. Sending without location."
          );

          // Continue without location

          message = "I'm safe.";

        }

      }



      const selectedContacts =
        contacts.filter(
          (contact) =>
            selected.includes(contact._id)
        );


      const names =
        selectedContacts
          .map(
            (contact) =>
              contact.name
          )
          .join(", ");



      // Backend Check-In API

      try {

        await api("/checkin", {

          method: "POST",

          body: JSON.stringify({

            contactIds: selected,

            includeLocation,

          }),

        });


      } catch (backendError) {

        console.warn(
          "Backend check-in failed:",
          backendError
        );

      }



      // Success Message

      // Success Message
setStatus(
  `Check-in prepared successfully for: ${names}`
);

setStatusType("success");

// Open SMS after short delay
setStatus(
  `Message ready:\n${message}`
);

setStatusType("success");


    } catch (err) {


      setStatus(
        err.message ||
        "Unable to prepare check-in. Please try again."
      );


      setStatusType("error");


    } finally {

      setSending(false);

    }

  };



  return (

    <Layout title="I'm Safe" back>


      <div className="safecheck">
        ✓
      </div>



      <div className="center">

        <h2>
          Safety Check-In
        </h2>

        <p>
          Send "I'm Safe" message to:
        </p>

      </div>




      <div className="stack">


        {
          contacts.length > 0

          ?

          contacts.map((contact) => (

            <label
              className="contactcheck"
              key={contact._id}
            >


              <input

                type="checkbox"

                checked={
                  selected.includes(
                    contact._id
                  )
                }


                onChange={() =>
                  toggleContact(
                    contact._id
                  )
                }

              />


              <span>

                <b>
                  {contact.name}
                </b>


                <small>
                  {contact.phone}
                </small>


              </span>


            </label>


          ))


          :

          <p className="muted">
            Add trusted contacts from Profile first.
          </p>

        }


      </div>




      <div className="toggleline">


        <h2>

          Include current

          <br />

          location

        </h2>



        <input

          type="checkbox"

          checked={includeLocation}

          onChange={(event) =>
            setIncludeLocation(
              event.target.checked
            )
          }

        />


      </div>





      {
        status && (

          <div

            className={
              statusType === "success"

              ? "success-message"

              : "error"
            }

          >

            {status}

          </div>

        )
      }





      <Button

        className="greenbtn"

        onClick={send}

        disabled={
          sending ||
          contacts.length === 0
        }

      >


        {

          sending

          ?

          "Preparing..."

          :

          statusType === "error"

          ?

          "Retry Check-In"

          :

          "Send Check-In"

        }


      </Button>



    </Layout>

  );

}