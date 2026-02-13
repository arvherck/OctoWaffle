import { useState } from "react";

function App() {
  const [consultants, setConsultants] = useState([
    { id: 1, name: "Consultant 1", rate: 120, hoursPerWeek: 40, weeks: 12, allocation: 100 }
  ]);

  const addConsultant = () => {
    setConsultants([
      ...consultants,
      {
        id: Date.now(),
        name: `Consultant ${consultants.length + 1}`,
        rate: 0,
        hoursPerWeek: 40,
        weeks: 0,
        allocation: 100
      }
    ]);
  };

  const updateConsultant = (id, field, value) => {
    setConsultants(
      consultants.map(c =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
  };

  const calculateConsultantTotal = (c) => {
    return c.rate * c.hoursPerWeek * c.weeks * (c.allocation / 100);
  };

  const totalProjectPrice = consultants.reduce(
    (sum, c) => sum + calculateConsultantTotal(c),
    0
  );

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Consulting Project Calculator</h1>

      {consultants.map(c => (
        <div
          key={c.id}
          style={{
            border: "1px solid #ddd",
            padding: 20,
            marginBottom: 20,
            borderRadius: 8
          }}
        >
          <h3>{c.name}</h3>

          <input
            type="number"
            placeholder="Hourly Rate"
            value={c.rate}
            onChange={(e) => updateConsultant(c.id, "rate", Number(e.target.value))}
          />

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

          <h4>
            Consultant Total: €{calculateConsultantTotal(c).toLocaleString()}
          </h4>
        </div>
      ))}

      <button onClick={addConsultant} style={{ padding: 10 }}>
        + Add Consultant
      </button>

      <hr style={{ margin: "40px 0" }} />

      <h2>
        Total Project Price: €{totalProjectPrice.toLocaleString()}
      </h2>
    </div>
  );
}

export default App;
