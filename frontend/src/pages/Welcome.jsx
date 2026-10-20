
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Welcome.css";

const features = [
  {
    icon: "🚨",
    title: "Emergency SOS",
    bangla: "জরুরি এসওএস",
    description: "Quickly access emergency assistance and SOS alerts.",
    bnDescription: "জরুরি মুহূর্তে দ্রুত সহায়তা ও এসওএস সুবিধা।",
    route: "/emergency-sos",
  },
  {
    icon: "🗺️",
    title: "Route Safety",
    bangla: "নিরাপদ পথ",
    description: "Compare routes using available safety information.",
    bnDescription: "নিরাপত্তার তথ্য দেখে যাতায়াতের পথ তুলনা করো।",
    route: "/route-safety",
  },
  {
    icon: "📍",
    title: "Safe Places",
    bangla: "নিরাপদ স্থান",
    description: "Find nearby places where you may seek assistance.",
    bnDescription: "কাছাকাছি সহায়তা পাওয়ার জায়গা খুঁজে নাও।",
    route: "/safe-places",
  },
  {
    icon: "🤝",
    title: "Trusted Contacts",
    bangla: "বিশ্বস্ত যোগাযোগ",
    description: "Keep your trusted people close when you need them.",
    bnDescription: "প্রয়োজনে বিশ্বস্ত মানুষদের সঙ্গে যোগাযোগ রাখো।",
    route: "/trusted-contact",
  },
  {
    icon: "📢",
    title: "Incident Reports",
    bangla: "ঘটনা রিপোর্ট",
    description: "Report safety concerns and view community reports.",
    bnDescription: "নিরাপত্তার সমস্যা রিপোর্ট করো এবং অন্যদের রিপোর্ট দেখো।",
    route: "/nearby-reports",
  },
  {
    icon: "💜",
    title: "I'm Safe",
    bangla: "আমি নিরাপদ",
    description: "Let your selected trusted contacts know you're safe.",
    bnDescription: "নির্বাচিত বিশ্বস্ত মানুষদের জানাও তুমি নিরাপদ আছো।",
    route: "/imsafe",
  },
];

export default function Welcome() {
  const [bangla, setBangla] = useState(false);
  const [active, setActive] = useState(0);
  const selected = features[active];

  return (
    <main className="np-welcome">
      <div className="np-glow np-glow-left" />
      <div className="np-glow np-glow-right" />

      <div className="np-shell">
        <header className="np-header">
          <Link to="/" className="np-brand">
            <img
              src="/nirapod-logo.png"
              alt="Nirapod Poth logo"
            />
            <span>NIRAPOD <b>POTH</b></span>
          </Link>

         
<div className="np-header-actions">
  <button
    type="button"
    className="np-language"
    onClick={() => setBangla(!bangla)}
  >
    {bangla ? "English" : "বাংলা"}
  </button>

  <Link to="/login" className="np-login">
    {bangla ? "লগইন" : "Log In"}
  </Link>

  <Link to="/register" className="np-register">
    {bangla ? "রেজিস্টার" : "Register"}
  </Link>
</div>

        </header>

        <section className="np-hero">
          <div className="np-hero-copy">
            <div className="np-eyebrow">
              <span className="np-live-dot" />
              {bangla
                ? "নিরাপত্তার পথে তোমার ডিজিটাল সঙ্গী"
                : "YOUR DIGITAL SAFETY COMPANION"}
            </div>

            <h1>
              {bangla ? "প্রতিটি পথে" : "Every Journey"}
              <span>
                {bangla ? "নিরাপত্তার সাথে।" : "Deserves Confidence."}
              </span>
            </h1>

            <p className="np-lead">
              {bangla
                ? "নিরাপদ পথ তোমাকে জরুরি সহায়তা, নিরাপত্তার তথ্য, কমিউনিটি রিপোর্ট এবং বিশ্বস্ত যোগাযোগের সুবিধা এক জায়গায় দেয়।"
                : "Nirapod Poth brings emergency support, safety insights, community reports, and trusted connections together in one thoughtful experience."}
            </p>

            <div className="np-hero-buttons">
              <Link to="/home" className="np-primary">
                {bangla ? "শুরু করি" : "Get Started"}
                <span>↗</span>
              </Link>

              <a href="#np-features" className="np-secondary">
                {bangla ? "ফিচারগুলো দেখো" : "Explore Features"}
                <span>↓</span>
              </a>
            </div>

            <div className="np-highlights">
              <span>✦ Emergency SOS</span>
              <span>✦ Safety Insights</span>
              <span>✦ Community Support</span>
            </div>
          </div>

          <div className="np-hero-art">
            <div className="np-orbit np-orbit-outer" />
            <div className="np-orbit np-orbit-inner" />

            <div className="np-logo-frame">
              <img
                src="/nirapod-logo.png"
                alt="Nirapod Poth NP road logo"
                className="np-main-logo"
              />
            </div>

            <div className="np-floating-card np-float-top">
              <span>🛡️</span>
              <div>
                <strong>Safety First</strong>
                <small>Travel with awareness</small>
              </div>
            </div>

            <div className="np-floating-card np-float-bottom">
              <span>📍</span>
              <div>
                <strong>Stay Connected</strong>
                <small>Support when needed</small>
              </div>
            </div>
          </div>
        </section>

        <section className="np-features" id="np-features">
          <div className="np-section-heading">
            <div>
              <span className="np-kicker">DISCOVER NIRAPOD POTH</span>
              <h2>
                {bangla
                  ? "তোমার পাশে, প্রতিটি পথে"
                  : "Designed Around Your Safety"}
              </h2>
              <p>
                {bangla
                  ? "একটি ফিচার বেছে নিয়ে এর কাজ সম্পর্কে জানো।"
                  : "Select a feature to explore how it works."}
              </p>
            </div>
          </div>

          <div className="np-feature-layout">
            <div className="np-feature-grid">
              {features.map((feature, index) => (
                <button
                  type="button"
                  key={feature.title}
                  onClick={() => setActive(index)}
                  className={`np-feature-card ${
                    active === index ? "np-selected" : ""
                  }`}
                  aria-pressed={active === index}
                >
                  <span className="np-feature-icon">{feature.icon}</span>
                  <strong>
                    {bangla ? feature.bangla : feature.title}
                  </strong>
                  <span className="np-feature-indicator">↗</span>
                </button>
              ))}
            </div>

            <div className="np-feature-detail" aria-live="polite">
              <span className="np-detail-label">
                FEATURE {String(active + 1).padStart(2, "0")}
              </span>

              <div className="np-detail-icon">{selected.icon}</div>

              <h3>{bangla ? selected.bangla : selected.title}</h3>

              <p>
                {bangla
                  ? selected.bnDescription
                  : selected.description}
              </p>

              <Link to={selected.route} className="np-detail-link">
                {bangla ? "ফিচারটি দেখো" : "Explore this feature"} →
              </Link>
            </div>
          </div>
        </section>

        <section className="np-bottom-banner">
          <div>
            <span className="np-kicker">YOUR JOURNEY MATTERS</span>
            <h2>
              {bangla
                ? "নিরাপদ যাত্রা শুরু হোক আজই।"
                : "A More Confident Journey Starts Here."}
            </h2>
            <p>
              {bangla
                ? "নিরাপদ পথের সব ফিচার ব্যবহার শুরু করো।"
                : "Explore the tools built to support your everyday safety."}
            </p>
          </div>

          <Link to="/home" className="np-primary">
            {bangla ? "অ্যাপে প্রবেশ করো" : "Enter Nirapod Poth"} →
          </Link>
        </section>

        <footer className="np-footer">
          <span>© 2026 Nirapod Poth</span>
          <span>Made with purpose 💜</span>
        </footer>
      </div>
    </main>
  );
}
