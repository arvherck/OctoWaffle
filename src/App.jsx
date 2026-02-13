import { useState } from "react";
import { RATE_CARD } from "./rateCard";

const COUNTRY_OPTIONS = Object.keys(RATE_CARD);
const SENIORITY_OPTIONS = Object.keys(RATE_CARD[COUNTRY_OPTIONS[0]] ?? {});

const getRateFromCard = (country, seniority) => RATE_CARD[country]?.[seniority] ?? 0;

function App() {
  const [consultants, setConsultants] = useState([
    {
      id: 1,
      name: "Consultant 1",
      country: "Sweden",
      seniority: "Mid",
      hoursPerWeek: 40,
      weeks: 12,
      allocation: 100,
    },
  ]);

  const addConsultant = () => {
    setConsultants([
      ...consultants,
      {
        id: Date.now(),
        name: `Consultant ${consultants.length + 1}`,
        country: "",
        seniority: "",
        hoursPerWeek: 40,
        weeks: 0,
        allocation: 100,
      },
    ]);
  };

  const updateConsultant = (id, field, value) => {
    setConsultants(
      consultants.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const calculateConsultantTotal = (c) => {
    const rate = getRateFromCard(c.country, c.seniority);
    return rate * c.hoursPerWeek * c.weeks * (c.allocation / 100);
  };

  const totalProjectPrice = consultants.reduce(
    (sum, c) => sum + calculateConsultantTotal(c),
    0
  );

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Consulting Project Calculator</h1>

      {consultants.map((c) => {
        const currentRate = getRateFromCard(c.country, c.seniority);

        return (
          <div
            key={c.id}
            style={{
              border: "1px solid #ddd",
              padding: 20,
              marginBottom: 20,
              borderRadius: 8,
            }}
          >
            <h3>{c.name}</h3>

            <select
              value={c.country}
              onChange={(e) => updateConsultant(c.id, "country", e.target.value)}
            >
              <option value="">Select Country</option>
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>

            <select
              value={c.seniority}
              onChange={(e) => updateConsultant(c.id, "seniority", e.target.value)}
            >
              <option value="">Select Seniority</option>
              {SENIORITY_OPTIONS.map((seniority) => (
                <option key={seniority} value={seniority}>
                  {seniority}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Hours per Week"
              value={c.hoursPerWeek}
              onChange={(e) => updateConsultant(c.id, "hoursPerWeek", Number(e.target.value))}
            />

            <input
              type="number"
              placeholder="Number of Weeks"
              value={c.weeks}
              onChange={(e) => updateConsultant(c.id, "weeks", Number(e.target.value))}
            />

            <input
              type="number"
              placeholder="Allocation (%)"
              value={c.allocation}
              onChange={(e) => updateConsultant(c.id, "allocation", Number(e.target.value))}
            />

            <p style={{ margin: "12px 0 0" }}>
              Hourly Rate: €{currentRate ? currentRate.toLocaleString() : 0}
            </p>

            <h4>Consultant Total: €{calculateConsultantTotal(c).toLocaleString()}</h4>
          </div>
        );
      })}

      <button onClick={addConsultant} style={{ padding: 10 }}>
        + Add Consultant
      </button>

      <hr style={{ margin: "40px 0" }} />

      <h2>Total Project Price: €{totalProjectPrice.toLocaleString()}</h2>
    </div>
  );
}

export default App;
