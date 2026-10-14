import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import {
  AlertTriangle,
  Building2,
  Check,
  Crosshair,
  Hospital,
  Phone,
} from "lucide-react";
import Layout from "../components/Layout";
import { Card, Row } from "../components/UI";

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();   // ← এই লাইনটা জরুরি

  return (
    <Layout title="Nirapod Poth" menu>
      <section>
        <h2>{t("goodEvening")}!</h2>
        <div className="muted big">
          ⌾ Mirpur, Dhaka <span className="weather">28°C ☁</span>
        </div>
      </section>

      <Card className="safety">
        <b>{t("areaSafety")}</b>
        <strong>{t("medium")}</strong>
        <span>Based on recent reports in this area</span>
        <button onClick={() => navigate("/map")}>View details ›</button>
      </Card>

      <h3>{t("quickActions")}</h3>
      <div className="quick">
        <Row icon={<AlertTriangle />} onClick={() => navigate("/emergency-sos")}>
          {t("emergency")}
        </Row>
        <Row icon={<Crosshair />} onClick={() => navigate("/safe-places")}>
          {t("shareLocation")}
        </Row>
        <Row icon={<Check />} onClick={() => navigate("/imsafe")}>
          {t("imSafe")}
        </Row>
        <Row icon={<Phone />} onClick={() => navigate("/helplines")}>
          {t("helplines")}
        </Row>
      </div>

      <div className="section-title">
        <h3>{t("nearbySafePlaces")}</h3>
        <button
          className="safe-view-all"
          onClick={() => navigate("/safe-places")}
        >
          {t("viewAll")} ›
        </button>
      </div>

      <div className="stack">
        <Row icon={<Building2 />} onClick={() => navigate("/safe-places")}>
          Mirpur Model Police Station
        </Row>
        <Row icon={<Hospital />} onClick={() => navigate("/safe-places")}>
          Popular Hospital
        </Row>
        <Row icon={<Hospital />} onClick={() => navigate("/safe-places")}>
          Lazz Pharma
        </Row>
      </div>
    </Layout>
  );
} 