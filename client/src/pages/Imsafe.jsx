import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Button } from '../components/UI';
import { api } from '../api';

export default function ImSafe() {
  const [c, setC] = useState([]);
  const [selected, setS] = useState([]);
  const [loc, setLoc] = useState(true);

  useEffect(() => {
    api('/contacts')
      .then((x) => {
        setC(x);
        setS(x.slice(0, 2).map((y) => y._id));
      })
      .catch(() => {});
  }, []);

  const send = () => {
    const names = c
      .filter((x) => selected.includes(x._id))
      .map((x) => x.name)
      .join(', ');

    if (loc) {
      navigator.geolocation?.getCurrentPosition(
        (p) => {
          const message = `I'm safe. My location: https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`;
          location.href = `sms:?body=${encodeURIComponent(message)}`;
        },
        () => {
          const message = "I'm safe.";
          location.href = `sms:?body=${encodeURIComponent(message)}`;
        }
      );
    } else {
      const message = "I'm safe.";
      location.href = `sms:?body=${encodeURIComponent(message)}`;
    }

    alert(`Check-in prepared for: ${names || 'selected contacts'}`);
  };

  return (
    <Layout title="I'm Safe" back>
      <div className="safecheck">✓</div>

      <div className="center">
        <h2>Safety Check-In</h2>
        <p>Send “I'm Safe” message to:</p>
      </div>

      <div className="stack">
        {c.length ? (
          c.map((x) => (
            <label className="contactcheck" key={x._id}>
              <input
                type="checkbox"
                checked={selected.includes(x._id)}
                onChange={() =>
                  setS((s) =>
                    s.includes(x._id)
                      ? s.filter((i) => i !== x._id)
                      : [...s, x._id]
                  )
                }
              />

              <span>
                <b>{x.name}</b>
                <small>{x.phone}</small>
              </span>
            </label>
          ))
        ) : (
          <p className="muted">
            Add trusted contacts from Profile first.
          </p>
        )}
      </div>

      <div className="toggleline">
        <h2>
          Include current
          <br />
          location
        </h2>

        <input
          type="checkbox"
          checked={loc}
          onChange={(e) => setLoc(e.target.checked)}
        />
      </div>

      <Button className="greenbtn" onClick={send}>
        Send Check-In
      </Button>
    </Layout>
  );
}