
import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  MapPin,
  Siren,
  Users,
  Heart,
  ArrowLeft,
  Route,
  FileWarning,
} from "lucide-react";

export default function About() {
  const features = [
    {
      icon: <Siren size={24} />,
      title: "Emergency SOS",
      description: "Quick access to emergency support.",
    },
    {
      icon: <Route size={24} />,
      title: "Route Safety",
      description: "Explore routes using safety information.",
    },
    {
      icon: <MapPin size={24} />,
      title: "Safe Places",
      description: "Discover nearby places for assistance.",
    },
    {
      icon: <Users size={24} />,
      title: "Trusted Contacts",
      description: "Stay connected with trusted people.",
    },
    {
      icon: <FileWarning size={24} />,
      title: "Incident Reporting",
      description: "Share and explore community safety reports.",
    },
    {
      icon: <ShieldCheck size={24} />,
      title: "I'm Safe",
      description: "Let trusted contacts know you are safe.",
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f4ff",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "auto",
        }}
      >
        <Link
          to="/profile"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#713bd0",
            textDecoration: "none",
            fontWeight: 700,
            marginBottom: 25,
          }}
        >
          <ArrowLeft size={18} />
          Back to Profile
        </Link>

        <div
          style={{
            background:
              "linear-gradient(135deg, #261342, #7945cf)",
            borderRadius: 25,
            padding: "50px 25px",
            color: "white",
            textAlign: "center",
          }}
        >
          <img
            src="/nirapod-logo.png"
            alt="Nirapod Poth Logo"
            style={{
              width: 115,
              height: 115,
              objectFit: "cover",
              borderRadius: 24,
              marginBottom: 20,
            }}
          />

          <h1 style={{ fontSize: 36, marginBottom: 12 }}>
            About Nirapod Poth
          </h1>

          <p
            style={{
              maxWidth: 600,
              margin: "auto",
              lineHeight: 1.8,
              color: "#e4d6fa",
            }}
          >
            Nirapod Poth is a digital safety companion
            designed to support safer journeys through
            emergency assistance, community awareness,
            trusted contacts, and safety information.
          </p>
        </div>

        <section style={{ marginTop: 45 }}>
          <h2 style={{ color: "#281448" }}>
            Our Mission
          </h2>

          <p
            style={{
              color: "#625575",
              lineHeight: 1.9,
              fontSize: 16,
            }}
          >
            Our mission is to make personal safety
            information and emergency support more
            accessible, helping people make informed
            decisions while travelling.
          </p>
        </section>

        <section style={{ marginTop: 45 }}>
          <h2 style={{ color: "#281448" }}>
            Explore Our Features
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 18,
              marginTop: 22,
            }}
          >
            {features.map((feature) => (
              <div
                key={feature.title}
                style={{
                  background: "white",
                  borderRadius: 18,
                  padding: 25,
                  boxShadow:
                    "0 5px 25px rgba(72, 35, 120, 0.07)",
                  border: "1px solid #e8ddf6",
                }}
              >
                <div style={{ color: "#824ad7" }}>
                  {feature.icon}
                </div>

                <h3 style={{ color: "#281448" }}>
                  {feature.title}
                </h3>

                <p
                  style={{
                    color: "#706580",
                    lineHeight: 1.6,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer
          style={{
            textAlign: "center",
            padding: "45px 0 15px",
            color: "#806a9e",
          }}
        >
          <Heart
            size={18}
            style={{ verticalAlign: "middle" }}
          />
          {" "}Made with care | Nirapod Poth © 2026
        </footer>
      </div>
    </main>
  );
}
