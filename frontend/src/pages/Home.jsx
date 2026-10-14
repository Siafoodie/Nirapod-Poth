import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import {
  AlertTriangle,
  Building2,
  Check,
  Crosshair,
  FileWarning,
  Hospital,
  Phone,
} from "lucide-react";
import Layout from "../components/Layout";
import { Card, Row } from "../components/UI";
import IncidentCard from "../components/IncidentCard";
import { api } from "../api";

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");

  useEffect(() => {
    let isActive = true;

    api("/reports")
      .then((response) => {
        const entries = Array.isArray(response)
          ? response
          : response.data || response.reports;
        if (!Array.isArray(entries)) {
          throw new Error("The reports API returned an invalid response.");
        }
        if (isActive) setReports(entries);
      })
      .catch((error) => {
        if (isActive) {
          setReportsError(error.message || "Unable to load incident reports.");
        }
      })
      .finally(() => {
        if (isActive) setReportsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

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
        <Row icon={<FileWarning />} onClick={() => navigate("/report")}>
          Report Incident
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

      <div className="section-title">
        <h3>Recent Incidents</h3>
        <button
          className="safe-view-all"
          onClick={() => navigate("/report")}
        >
          Report ›
        </button>
      </div>
      {reportsLoading && <p className="muted">Loading incident reports...</p>}
      {!reportsLoading && reportsError && (
        <p className="profile-error-message" role="alert">
          {reportsError}
        </p>
      )}
      {!reportsLoading && !reportsError && reports.length === 0 && (
        <p className="muted">No incident reports have been shared yet.</p>
      )}
      {!reportsLoading &&
        !reportsError &&
        reports.slice(0, 3).map((report) => (
          <IncidentCard key={report._id} report={report} />
        ))}
    </Layout>
  );
}