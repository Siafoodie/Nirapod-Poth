
import { useNavigate } from "react-router-dom";
import "./Helplines.css";

const helplines = [
  {
    name: "National Emergency Service",
    number: "999",
    description: "Police, fire and ambulance emergency assistance",
  },
  {
    name: "Women and Children Helpline",
    number: "109",
    description: "Support for violence against women and children",
  },
  {
    name: "Child Helpline",
    number: "1098",
    description: "Help and protection for children",
  },
  {
    name: "Government Legal Aid",
    number: "16430",
    description: "Legal aid information and assistance",
  },
];

export default function Helplines() {
  const navigate = useNavigate();

  return (
    <main className="helplines-container">
      <button
        type="button"
        onClick={() => navigate("/home")}
        className="helplines-back"
      >
        ← Back to Home
      </button>

      <h1 className="helplines-heading">
        Emergency Helplines
      </h1>

      <p className="helplines-subtitle">
        Important emergency and support numbers in Bangladesh.
      </p>

      <div className="helplines-grid">
        {helplines.map((item) => (
          <article
            key={item.number}
            className="helplines-card"
          >
            <h2 className="helplines-card-title">
              {item.name}
            </h2>

            <p className="helplines-description">
              {item.description}
            </p>

            <p className="helplines-number">
              {item.number}
            </p>

            <a
              href={`tel:${item.number}`}
              className="helplines-call"
              aria-label={`Call ${item.name} at ${item.number}`}
            >
              Call {item.number}
            </a>
          </article>
        ))}
      </div>

      <p className="helplines-note">
        For immediate danger, contact the National Emergency
        Service at 999. Phone calls require a supported device
        and calling service.
      </p>
    </main>
  );
}
