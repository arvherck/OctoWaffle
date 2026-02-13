import { useEffect, useMemo, useRef, useState } from "react";
import { RATE_CARD } from "./rateCard";
import {
  BASE_CURRENCY,
  SUPPORTED_CURRENCIES,
  getExchangeRates,
} from "./exchangeRates";

const COUNTRY_OPTIONS = Object.keys(RATE_CARD);
const SENIORITY_OPTIONS = Object.keys(RATE_CARD[COUNTRY_OPTIONS[0]] ?? {});
const CURRENCY_LOCALE_MAP = {
  EUR: "de-DE",
  USD: "en-US",
  GBP: "en-GB",
  SEK: "sv-SE",
};

const getRateFromCard = (country, seniority) => RATE_CARD[country]?.[seniority] ?? 0;

const formatTimestamp = (timestamp) =>
  new Date(timestamp).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

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
  const [exchangeRates, setExchangeRates] = useState({ [BASE_CURRENCY]: 1 });
  const [selectedCurrencyRate, setSelectedCurrencyRate] = useState(1);
  const [ratesLastUpdatedAt, setRatesLastUpdatedAt] = useState(new Date().toISOString());
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState("");
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

  useEffect(() => {
    let isMounted = true;

    const loadRates = async () => {
      setRatesLoading(true);
      setRatesError("");

      try {
        const latestRates = await getExchangeRates();

        if (!isMounted) {
          return;
        }

        const nextRate = latestRates[selectedCurrency] ?? 1;
        setExchangeRates(latestRates);
        setSelectedCurrencyRate(nextRate);
        setRatesLastUpdatedAt(new Date().toISOString());
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setSelectedCurrencyRate(exchangeRates[selectedCurrency] ?? 1);
        setRatesError(
          "We couldn't refresh exchange rates right now. Totals are shown with the most recently available rate."
        );
      } finally {
        if (isMounted) {
          setRatesLoading(false);
        }
      }
    };

    loadRates();

    return () => {
      isMounted = false;
    };
  }, [selectedCurrency]);

  const formatCurrency = (amount, currencyCode) => {
    const locale = CURRENCY_LOCALE_MAP[currencyCode] ?? "en-US";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const convertFromEuro = (amountInEuro) => amountInEuro * selectedCurrencyRate;

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

  const totalProjectPriceEur = useMemo(
    () => consultants.reduce((sum, c) => sum + calculateConsultantTotal(c), 0),
    [consultants]
  );

  const totalProjectPriceConverted = useMemo(
    () => convertFromEuro(totalProjectPriceEur),
    [totalProjectPriceEur, selectedCurrencyRate]
  );

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
        const currentEurRate = getRateFromCard(c.country, c.seniority);
        const currentRate = convertFromEuro(currentEurRate);
        const hasSelectionError = !c.country || !c.seniority;
        const consultantTotalEur = calculateConsultantTotal(c);
        const convertedConsultantTotal = convertFromEuro(consultantTotalEur);

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
                </div>
              </div>
            </div>

            <div className="rate-panel" aria-live="polite">
              <p className="rate-label">Hourly Rate Applied</p>
              <p className="rate-value">
                {formatCurrency(currentRate, selectedCurrency)}
                <span className="unit-inline">/h</span>
              </p>
              <p className="helper-text">EUR Base: {formatCurrency(currentEurRate, BASE_CURRENCY)}/h</p>
            </div>

            <h4 className="consultant-total">
              Consultant Total: {formatCurrency(convertedConsultantTotal, selectedCurrency)}
              <span className="summary-subline">
                ({formatCurrency(consultantTotalEur, BASE_CURRENCY)})
              </span>
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
        <h2>Total Project Price (EUR): {formatCurrency(totalProjectPriceEur, BASE_CURRENCY)}</h2>
        <h3>
          Total Project Price ({selectedCurrency}): {formatCurrency(totalProjectPriceConverted, selectedCurrency)}
        </h3>
        {ratesLoading && <p>Fetching latest exchange rates...</p>}
        {ratesError && <p role="alert">{ratesError}</p>}
        <p>
          1 EUR = {selectedCurrencyRate.toFixed(4)} {selectedCurrency}
        </p>
        <p>Rates Last Updated: {formatTimestamp(ratesLastUpdatedAt)}</p>

        <h3>Summary</h3>
        {consultants.map((c) => {
          const rateEur = getRateFromCard(c.country, c.seniority);
          const rateConverted = convertFromEuro(rateEur);
          const totalHours = c.hoursPerWeek * c.weeks;
          const totalEur = calculateConsultantTotal(c);
          const totalConverted = convertFromEuro(totalEur);

          return (
            <div key={`summary-${c.id}`} className="summary-line">
              <span>{c.name}</span>
              <span>
                Rate: {formatCurrency(rateConverted, selectedCurrency)}/h ({formatCurrency(rateEur, BASE_CURRENCY)}/h) | Hours: {totalHours}h |
                Allocation: {c.allocation}% | Total: {formatCurrency(totalConverted, selectedCurrency)} ({formatCurrency(totalEur, BASE_CURRENCY)})
              </span>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export default App;
