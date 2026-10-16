
import { useNavigate } from "react-router-dom";

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
    <main style={styles.container}>
      <button
        type="button"
        onClick={() => navigate("/home")}
        style={styles.backButton}
      >
        ← Back to Home
      </button>

      <h1 style={styles.heading}>Emergency Helplines</h1>

      <p style={styles.subtitle}>
        Important emergency and support numbers in Bangladesh.
      </p>

      <div style={styles.grid}>
        {helplines.map((item) => (
          <article key={item.number} style={styles.card}>
            <h2 style={styles.cardTitle}>{item.name}</h2>

            <p style={styles.description}>
              {item.description}
            </p>

            <p style={styles.number}>{item.number}</p>

            <a
              href={`tel:${item.number}`}
              style={styles.callButton}
            >
              Call {item.number}
            </a>
          </article>
        ))}
      </div>

      <p style={styles.note}>
        For immediate danger, contact the National Emergency
        Service at 999. Phone calls require a supported device
        and calling service.
      </p>
    </main>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "32px 20px",
    minHeight: "85vh",
  },
  backButton: {
    border: "none",
    background: "transparent",
    color: "#6541c1",
    cursor: "pointer",
    fontSize: "15px",
    marginBottom: "20px",
  },
  heading: {
    fontSize: "32px",
    color: "#171638",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#66617a",
    marginBottom: "30px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
    gap: "20px",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e6def5",
    borderRadius: "14px",
    padding: "24px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
  },
  cardTitle: {
    fontSize: "20px",
    color: "#171638",
  },
  description: {
    color: "#66617a",
    minHeight: "48px",
  },
  number: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#6541c1",
    margin: "16px 0",
  },
  callButton: {
    display: "inline-block",
    background: "#6541c1",
    color: "#ffffff",
    padding: "12px 22px",
    borderRadius: "8px",
    textDecoration: "none",
    fontWeight: "bold",
  },
  note: {
    marginTop: "28px",
    color: "#66617a",
    fontSize: "14px",
  },
};
