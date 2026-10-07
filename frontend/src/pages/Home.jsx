import React from "react";
import { useNavigate } from "react-router-dom";
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

  return (
    <Layout title="Nirapod Poth" menu>
      <section>
        <h2>Good Evening!</h2>
        <div className="muted big">
          ⌾ Mirpur, Dhaka <span className="weather">28°C ☁</span>
        </div>
      </section>
      <Card className="safety">
        <b>Area Safety</b>
        <strong>MEDIUM</strong>
        <span>Based on recent reports in this area</span>
        <button onClick={() => navigate("/map")}>View details ›</button>
      </Card>
      <h3>Quick Actions</h3>
      <div className="quick">
        <Row icon={<AlertTriangle />} onClick={() => navigate("/emergency")}>
          Emergency
        </Row>
        <Row icon={<Crosshair />} onClick={() => navigate("/safe-places")}>
          Share Location
        </Row>
        <Row icon={<Check />} onClick={() => navigate("/imsafe")}>
          I'm Safe
        </Row>
        <Row icon={<Phone />} onClick={() => navigate("/helplines")}>
          Helplines
        </Row>
      </div>
      <div className="section-title">
        <h3>Nearby Safe Places</h3>
        <button
          className="safe-view-all"
          onClick={() => navigate("/safe-places")}
        >
          View all ›
        </button>
      </div>
      <div className="stack">
        <Row
          icon={<Building2 />}
          onClick={() => navigate("/safe-places")}
        >
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