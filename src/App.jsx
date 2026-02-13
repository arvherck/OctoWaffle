import { useEffect, useMemo, useRef, useState } from "react";
import { RATE_CARD } from "./rateCard";
import {
  BASE_CURRENCY,
  SUPPORTED_CURRENCIES,
  getExchangeRate,
} from "./exchangeRates";

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

  const [selectedCurrency, setSelectedCurrency] = useState(BASE_CURRENCY);
  const [isCalculating, setIsCalculating] = useState(false);
  const [updatedConsultantId, setUpdatedConsultantId] = useState(null);

  const calculationTimerRef = useRef(null);
  const updateFlashTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (calculationTimerRef.current) {
        clearTimeout(calculationTimerRef.current);
      }

      if (updateFlashTimerRef.current) {
        clearTimeout(updateFlashTimerRef.current);
      }
    };
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: selectedCurrency,
      maximumFractionDigits: 2,
    }).format(amount);

  const convertFromBaseCurrency = (amount) => {
    const rate = getExchangeRate(BASE_CURRENCY, selectedCurrency);
    return amount * rate;
  };

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

    setUpdatedConsultantId(id);
    if (updateFlashTimerRef.current) {
      clearTimeout(updateFlashTimerRef.current);
    }

    updateFlashTimerRef.current = setTimeout(() => {
      setUpdatedConsultantId(null);
    }, 450);
  };

  const calculateConsultantTotal = (c) => {
    const rate = getRateFromCard(c.country, c.seniority);
    return rate * c.hoursPerWeek * c.weeks * (c.allocation / 100);
  };

  const totalProjectPrice = useMemo(
    () => consultants.reduce((sum, c) => sum + calculateConsultantTotal(c), 0),
    [consultants]
  );

  const convertedTotalProjectPrice = convertFromBaseCurrency(totalProjectPrice);

  const hasMissingRequired = consultants.some(
    (c) => !c.country || !c.seniority
  );

  const runCalculationFeedback = () => {
    if (hasMissingRequired || isCalculating) {
      return;
    }

    setIsCalculating(true);

    if (calculationTimerRef.current) {
      clearTimeout(calculationTimerRef.current);
    }

    calculationTimerRef.current = setTimeout(() => {
      setIsCalculating(false);
    }, 600);
  };

  return (
    <div className="app-shell">
      <h1 className="app-title">Consulting Project Calculator</h1>

      <div className="field-wrap currency-select-wrap">
        <label htmlFor="contract-currency">Contract Currency</label>
        <select
          id="contract-currency"
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
        >
          {SUPPORTED_CURRENCIES.map((currencyCode) => (
            <option key={currencyCode} value={currencyCode}>
              {currencyCode}
            </option>
          ))}
        </select>
      </div>

      {consultants.map((c) => {
        const currentBaseRate = getRateFromCard(c.country, c.seniority);
        const currentRate = convertFromBaseCurrency(currentBaseRate);
        const hasSelectionError = !c.country || !c.seniority;
        const convertedConsultantTotal = convertFromBaseCurrency(
          calculateConsultantTotal(c)
        );

        return (
          <section
            key={c.id}
            className={`consultant-card ${
              updatedConsultantId === c.id ? "card-updated" : ""
            }`}
            aria-label={`${c.name} pricing configuration`}
          >
            <h3 className="consultant-name">{c.name}</h3>

            <div className="field-group grouped-selects">
              <p className="group-label">Role Profile</p>
              <div className="field-grid two-col">
                <div className="field-wrap">
                  <label htmlFor={`country-${c.id}`}>Country</label>
                  <select
                    id={`country-${c.id}`}
                    aria-label={`${c.name} country`}
                    value={c.country}
                    onChange={(e) =>
                      updateConsultant(c.id, "country", e.target.value)
                    }
                  >
                    <option value="">Select country</option>
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-wrap">
                  <label htmlFor={`seniority-${c.id}`}>Seniority</label>
                  <select
                    id={`seniority-${c.id}`}
                    aria-label={`${c.name} seniority`}
                    value={c.seniority}
                    onChange={(e) =>
                      updateConsultant(c.id, "seniority", e.target.value)
                    }
                  >
                    <option value="">Select seniority</option>
                    {SENIORITY_OPTIONS.map((seniority) => (
                      <option key={seniority} value={seniority}>
                        {seniority}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {hasSelectionError && (
                <p className="inline-error" role="alert">
                  Select both country and seniority to calculate an accurate rate.
                </p>
              )}
            </div>

            <div className="field-group">
              <div className="field-grid three-col">
                <div className="field-wrap">
                  <label htmlFor={`hours-${c.id}`}>Hours per Week</label>
                  <div className="input-with-unit">
                    <input
                      id={`hours-${c.id}`}
                      aria-label={`${c.name} hours per week`}
                      type="number"
                      min="0"
                      value={c.hoursPerWeek}
                      onChange={(e) =>
                        updateConsultant(c.id, "hoursPerWeek", Number(e.target.value))
                      }
                    />
                    <span className="unit">h</span>
                  </div>
                </div>

                <div className="field-wrap">
                  <label htmlFor={`weeks-${c.id}`}>Number of Weeks</label>
                  <div className="input-with-unit">
                    <input
                      id={`weeks-${c.id}`}
                      aria-label={`${c.name} number of weeks`}
                      type="number"
                      min="0"
                      value={c.weeks}
                      onChange={(e) =>
                        updateConsultant(c.id, "weeks", Number(e.target.value))
                      }
                    />
                    <span className="unit">weeks</span>
                  </div>
                </div>

                <div className="field-wrap">
                  <label htmlFor={`allocation-${c.id}`}>Allocation</label>
                  <div className="input-with-unit">
                    <input
                      id={`allocation-${c.id}`}
                      aria-label={`${c.name} allocation percentage`}
                      type="number"
                      min="0"
                      max="100"
                      value={c.allocation}
                      onChange={(e) =>
                        updateConsultant(c.id, "allocation", Number(e.target.value))
                      }
                    />
                    <span className="unit">%</span>
                  </div>
                  <p
                    className="helper-text"
                    title="Allocation applies the selected % of total consultant capacity to project cost."
                  >
                    Allocation % applies a utilization factor to the total consultant
                    cost.
                  </p>
                </div>
              </div>
            </div>

            <div className="rate-panel" aria-live="polite">
              <p className="rate-label">Hourly Rate Applied</p>
              <p className="rate-value">
                {formatCurrency(currentRate)}
                <span className="unit-inline">/h</span>
              </p>
            </div>

            <h4 className="consultant-total">
              Consultant Total: {formatCurrency(convertedConsultantTotal)}
            </h4>
          </section>
        );
      })}

      <div className="actions-row">
        <button className="btn-secondary" onClick={addConsultant}>
          + Add Consultant
        </button>

        <button
          className="btn-primary"
          onClick={runCalculationFeedback}
          disabled={hasMissingRequired || isCalculating}
          aria-label="Calculate project price"
        >
          {isCalculating ? "Calculating..." : "Calculate Project Price"}
        </button>
      </div>

      {hasMissingRequired && (
        <p className="inline-warning" role="alert">
          Complete required selections for every consultant to enable calculation.
        </p>
      )}

      <hr className="divider" />

      <section className="summary-card" aria-live="polite">
        <h2>Total Project Price: {formatCurrency(convertedTotalProjectPrice)}</h2>

        <h3>Summary</h3>
        {consultants.map((c) => {
          const rate = convertFromBaseCurrency(getRateFromCard(c.country, c.seniority));
          const totalHours = c.hoursPerWeek * c.weeks;
          const total = convertFromBaseCurrency(calculateConsultantTotal(c));

          return (
            <div key={`summary-${c.id}`} className="summary-line">
              <span>{c.name}</span>
              <span>
                Rate: {formatCurrency(rate)}/h | Hours: {totalHours}h | Allocation: {" "}
                {c.allocation}% | Total: {formatCurrency(total)}
              </span>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default App;
