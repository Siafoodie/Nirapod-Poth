import React from "react";
import { useNavigate } from "react-router-dom";
import { Diamond, Circle } from "lucide-react";
import Layout from "../components/Layout";
import { Row } from "../components/UI";

export default function Profile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <Layout title="Profile" back>
      <div className="profilehead">
        <div className="avatar">●</div>

        <div>
          <h1>{user.name || "User"}</h1>
          <p>Stay safe, stay confident.</p>
        </div>
      </div>

      <h3>Safety</h3>

      <Row
        icon={<Diamond />}
        onClick={() => navigate("/trusted-contact")}
      >
        Trusted Contacts
      </Row>

      <Row icon={<Diamond />}>
        Privacy Settings
      </Row>

      <Row icon={<Diamond />}>
        Location Permission
      </Row>

      <h3>App</h3>

      <Row
        icon={<Circle />}
        onClick={() => navigate("/emergency")}
      >
        Emergency Helplines
      </Row>

      <Row icon={<Circle />}>
        Offline Data
      </Row>

      <Row icon={<Circle />}>
        Language
      </Row>

      <Row icon={<Circle />}>
        Help
      </Row>

      <Row icon={<Circle />}>
        About Nirapod Poth
      </Row>

      <button
        className="logout"
        onClick={() => {
          localStorage.clear();
          navigate("/auth");
        }}
      >
        Sign Out
      </button>
    </Layout>
  );
}