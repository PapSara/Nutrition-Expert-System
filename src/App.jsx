
import { useState } from "react";
import { forwardChaining } from "./inferenceEngine.js";
import knowledgeBase from "./knowledgeBase.json";

//Paleta de culori
const THEME = {
  bg:           "#F9FAFB",
  card:         "#FFFFFF",
  border:       "#E5E7EB",
  primary:      "#14B8A6",
  primaryDark:  "#0F766E",
  textMain:     "#1F2937",
  textMuted:    "#6B7280",
  accentBlue:   "#3B82F6",
  accentGreen:  "#10B981",
  accentOrange: "#F59E0B",
  danger:       "#EF4444",
  warning:      "#FEF2F2",
};

// Mapare label BMI
const BMI_LABEL = {
  subponderal:   "Subponderal",
  normal:        "Greutate normală",
  supraponderal: "Supraponderal",
  obez:          "Obez",
};

// Culoarea indicatorului BMI în functie de categorie
const BMI_COLOR = {
  subponderal:   THEME.accentBlue,
  normal:        THEME.accentGreen,
  supraponderal: THEME.accentOrange,
  obez:          THEME.danger,
};

// Date statice pentru selectori 
const activityOptions = [
  { value: "sedentara",     label: "Sedentară",       desc: "Muncă de birou, fără sport",                        icon: "🪑" },
  { value: "usoara",        label: "Ușoară",           desc: "Sport ușor 1-3 zile/săptămână",                     icon: "🚶‍♂️" },
  { value: "moderata",      label: "Moderată",         desc: "Sport moderat 3-5 zile/săptămână",                  icon: "🏃‍♂️" },
  { value: "activa",        label: "Activă",           desc: "Sport intens 6-7 zile/săptămână",                   icon: "💪" },
  { value: "foarte_activa", label: "Foarte activă",    desc: "Muncă fizică grea sau antrenamente 2x/zi",          icon: "🏋️‍♀️" },
];

const goalOptions = [
  { value: "slabire",             label: "Slăbire",              desc: "Doresc să pierd în greutate",                    icon: "📉" },
  { value: "mentinere",           label: "Menținere",            desc: "Doresc să îmi mențin greutatea actuală",          icon: "⚖️" },
  { value: "crestere_in_greutate",label: "Creștere în greutate", desc: "Doresc să iau în greutate (masă musculară)",      icon: "📈" },
];

// Validare input 
function validateForm(form) {
  const errors = {};
  const v = +form.varsta, g = +form.greutate, i = +form.inaltime;
  if (!form.varsta  || v < 10  || v > 100) errors.varsta   = "Introduceți o vârstă între 10 și 100 ani.";
  if (!form.greutate|| g < 20  || g > 300) errors.greutate = "Introduceți o greutate între 20 și 300 kg.";
  if (!form.inaltime|| i < 100 || i > 250) errors.inaltime = "Introduceți o înălțime între 100 și 250 cm.";
  return errors;
}

//  COMPONENTE UI SI ELEMENTE DE STIL

const PageContainer = ({ children }) => (
  <div style={{
    minHeight: "100vh", background: THEME.bg, color: THEME.textMain,
    fontFamily: "system-ui, -apple-system, sans-serif", padding: "40px 20px",
  }}>
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>{children}</div>
  </div>
);

const Header = () => (
  <header style={{ textAlign: "center", marginBottom: "40px" }}>
    <div style={{ fontSize: "40px", marginBottom: "10px" }}>🍃</div>
    <h1 style={{ margin: 0, fontSize: "32px", fontWeight: 800, color: THEME.textMain, letterSpacing: "-0.5px" }}>
      Asistentul Tău de Nutriție
    </h1>
    <p style={{ margin: "10px auto 0", fontSize: "16px", color: THEME.textMuted, maxWidth: "500px" }}>
      Completează datele de mai jos și lasă sistemul nostru expert să îți genereze un plan personalizat.
    </p>
  </header>
);

const Card = ({ children, title, icon }) => (
  <div style={{
    background: THEME.card, borderRadius: "20px", padding: "24px",
    border: `1px solid ${THEME.border}`, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
  }}>
    {title && (
      <h2 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "20px" }}>{icon}</span> {title}
      </h2>
    )}
    {children}
  </div>
);

const FieldLabel = ({ children }) => (
  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: THEME.textMain, marginBottom: "6px" }}>
    {children}
  </label>
);

const InputNumber = ({ unit, error, ...props }) => (
  <div style={{ position: "relative" }}>
    <input
      {...props}
      type="number"
      style={{
        width: "100%", padding: "12px 16px", paddingRight: unit ? "44px" : "16px",
        borderRadius: "10px",
        border: `1px solid ${error ? THEME.danger : THEME.border}`,
        fontSize: "16px", background: THEME.bg, boxSizing: "border-box",
        outline: "none",
      }}
    />
    {unit && (
      <span style={{
        position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)",
        color: THEME.textMuted, fontSize: "14px", pointerEvents: "none",
      }}>{unit}</span>
    )}
    {error && (
      <p style={{ margin: "4px 0 0", fontSize: "12px", color: THEME.danger }}>{error}</p>
    )}
  </div>
);

const SelectButtonGroup = ({ options, value, onChange }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
    {options.map(opt => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        style={{
          padding: "12px", borderRadius: "10px", cursor: "pointer",
          fontSize: "15px", fontWeight: 600,
          border: `2px solid ${value === opt.value ? THEME.primary : THEME.border}`,
          background: value === opt.value ? `${THEME.primary}10` : THEME.card,
          color: value === opt.value ? THEME.primaryDark : THEME.textMain,
          transition: "all 0.2s",
        }}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const ChoiceCard = ({ options, value, onChange }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
    {options.map(opt => (
      <div
        key={opt.value}
        onClick={() => onChange(opt.value)}
        style={{
          padding: "16px", borderRadius: "12px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: "16px",
          border: `2px solid ${value === opt.value ? THEME.primary : THEME.border}`,
          background: value === opt.value ? `${THEME.primary}05` : THEME.card,
          transition: "all 0.2s",
        }}
      >
        <div style={{ fontSize: "30px", width: "40px", textAlign: "center" }}>{opt.icon}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "16px", color: value === opt.value ? THEME.primaryDark : THEME.textMain }}>
            {opt.label}
          </div>
          <div style={{ fontSize: "13px", color: THEME.textMuted, marginTop: "2px" }}>{opt.desc}</div>
        </div>
        <div style={{
          marginLeft: "auto", width: "20px", height: "20px", borderRadius: "50%",
          border: `2px solid ${value === opt.value ? THEME.primary : THEME.border}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {value === opt.value && (
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: THEME.primary }} />
          )}
        </div>
      </div>
    ))}
  </div>
);

const ResultMiniCard = ({ label, value, unit, icon, color }) => (
  <div style={{
    background: THEME.bg, border: `1px solid ${THEME.border}`,
    borderRadius: "12px", padding: "16px", textAlign: "center",
  }}>
    <div style={{ fontSize: "20px", marginBottom: "5px" }}>{icon}</div>
    <div style={{ fontSize: "12px", textTransform: "uppercase", color: THEME.textMuted, letterSpacing: "1px", fontWeight: 600 }}>
      {label}
    </div>
    <div style={{ fontSize: "22px", fontWeight: 800, color: color || THEME.textMain, margin: "5px 0" }}>
      {value}
      {unit && <span style={{ fontSize: "13px", fontWeight: 600, color: THEME.textMuted, marginLeft: "3px" }}>{unit}</span>}
    </div>
  </div>
);

const MacroTag = ({ label, percent, color }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: "8px",
    background: `${color}10`, padding: "6px 12px",
    borderRadius: "20px", border: `1px solid ${color}30`,
  }}>
    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
    <span style={{ fontSize: "14px", fontWeight: 600, color: THEME.textMain }}>{label}</span>
    <span style={{ fontSize: "14px", fontWeight: 700, color, marginLeft: "auto" }}>{percent}%</span>
  </div>
);

//jurnal de inferenta 
const InferenceLog = ({ log, firedRules, totalRules }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: THEME.card, border: `1px solid ${THEME.border}`,
      borderRadius: "16px", padding: "20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>🔍</span>
          <span style={{ fontWeight: 700, fontSize: "16px" }}>Jurnal de inferență</span>
          <span style={{
            background: `${THEME.primary}15`, color: THEME.primaryDark,
            padding: "2px 10px", borderRadius: "12px", fontSize: "13px", fontWeight: 600,
          }}>
            {firedRules.length} / {totalRules} reguli activate
          </span>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            background: "transparent", border: `1px solid ${THEME.border}`,
            color: THEME.textMuted, borderRadius: "8px", padding: "6px 14px",
            cursor: "pointer", fontSize: "13px", fontFamily: "inherit",
          }}
        >
          {open ? "▲ Ascunde" : "▼ Afișează"} pași
        </button>
      </div>

      {/* Badge-uri reguli activate */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px" }}>
        {firedRules.map(id => (
          <span key={id} style={{
            background: `${THEME.primary}12`, border: `1px solid ${THEME.primary}40`,
            color: THEME.primaryDark, borderRadius: "6px", padding: "3px 10px",
            fontSize: "12px", fontWeight: 700, fontFamily: "monospace",
          }}>{id}</span>
        ))}
      </div>

      {/* Tabel pasi inferenta */}
      {open && (
        <div style={{ marginTop: "16px", overflowX: "auto", borderRadius: "10px", border: `1px solid ${THEME.border}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ background: THEME.bg }}>
                {["#", "Pas / Regulă", "Formulă", "Rezultat"].map(h => (
                  <th key={h} style={{
                    padding: "8px 12px", color: THEME.textMuted, textAlign: "left",
                    fontWeight: 600, borderBottom: `1px solid ${THEME.border}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.map((l, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : THEME.bg }}>
                  <td style={{ padding: "6px 12px", color: THEME.textMuted }}>{i + 1}</td>
                  <td style={{ padding: "6px 12px", color: THEME.primaryDark, fontWeight: 600 }}>{l.step}</td>
                  <td style={{ padding: "6px 12px", color: THEME.textMuted, fontFamily: "monospace" }}>{l.formula}</td>
                  <td style={{ padding: "6px 12px", color: THEME.textMain }}>{l.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

//  COMPONENTA PRINCIPALĂ

export default function App() {
  const [form, setForm] = useState({
    varsta: "25", greutate: "75", inaltime: "180",
    sex: "masculin", activitate_fizica: "moderata", obiectiv: "mentinere",
  });
  const [errors, setErrors]       = useState({});
  const [result, setResult]       = useState(null);   // rezultatul inferenței
  const [showResults, setShowResults] = useState(false);

  const updateForm = (key, value) => setForm(f => ({ ...f, [key]: value }));

  //Ruleaza masina de inferenta 
  function handleGenerate() {
    const validationErrors = validateForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const userInput = {
      varsta:            +form.varsta,
      greutate:          +form.greutate,
      inaltime:          +form.inaltime,
      sex:               form.sex,
      activitate_fizica: form.activitate_fizica,
      obiectiv:          form.obiectiv,
    };

    const inferenceResult = forwardChaining(userInput, knowledgeBase);
    setResult(inferenceResult);
    setShowResults(true);

    // Scroll
    setTimeout(() => {
      document.getElementById("results-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  const f = result?.facts;
  const macro = f?.distributie_macronutrienti;

  return (
    <PageContainer>
      <Header />

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "30px", alignItems: "start" }}>

        {/* ── FORMULAR ─────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          <Card title="Profilul Tău" icon="👤">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <FieldLabel>Vârstă</FieldLabel>
                <InputNumber
                  value={form.varsta}
                  onChange={e => updateForm("varsta", e.target.value)}
                  placeholder="ex: 30"
                  unit="ani"
                  error={errors.varsta}
                />
              </div>
              <div>
                <FieldLabel>Greutate</FieldLabel>
                <InputNumber
                  value={form.greutate}
                  onChange={e => updateForm("greutate", e.target.value)}
                  placeholder="ex: 70"
                  unit="kg"
                  error={errors.greutate}
                />
              </div>
              <div>
                <FieldLabel>Înălțime</FieldLabel>
                <InputNumber
                  value={form.inaltime}
                  onChange={e => updateForm("inaltime", e.target.value)}
                  placeholder="ex: 175"
                  unit="cm"
                  error={errors.inaltime}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Sex</FieldLabel>
              <SelectButtonGroup
                options={[{ value: "masculin", label: "Masculin" }, { value: "feminin", label: "Feminin" }]}
                value={form.sex}
                onChange={val => updateForm("sex", val)}
              />
            </div>
          </Card>

          <Card title="Stil de viață & Obiectiv" icon="🎯">
            <div style={{ marginBottom: "20px" }}>
              <FieldLabel>Nivelul de activitate fizică zilnică</FieldLabel>
              <ChoiceCard
                options={activityOptions}
                value={form.activitate_fizica}
                onChange={val => updateForm("activitate_fizica", val)}
              />
            </div>
            <div>
              <FieldLabel>Care este obiectivul tău principal?</FieldLabel>
              <ChoiceCard
                options={goalOptions}
                value={form.obiectiv}
                onChange={val => updateForm("obiectiv", val)}
              />
            </div>
          </Card>

          <button
            onClick={handleGenerate}
            style={{
              width: "100%", padding: "16px", borderRadius: "12px",
              background: THEME.primary, color: "white", border: "none",
              cursor: "pointer", fontSize: "18px", fontWeight: 700,
              transition: "background 0.2s",
              boxShadow: `0 4px 14px 0 ${THEME.primary}50`,
            }}
            onMouseEnter={e => e.target.style.background = THEME.primaryDark}
            onMouseLeave={e => e.target.style.background = THEME.primary}
          >
            Generează Plan Nutrițional →
          </button>
        </div>

        {/* ── REZULTATE ────────────────────────────────────── */}
        {showResults && f && (
          <div
            id="results-section"
            style={{
              display: "flex", flexDirection: "column", gap: "24px",
              marginTop: "20px", borderTop: `2px dashed ${THEME.border}`, paddingTop: "40px",
            }}
          >
            {/* Titlu secțiune */}
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
              <span style={{
                background: `${THEME.accentGreen}15`, color: THEME.accentGreen,
                padding: "8px 16px", borderRadius: "20px", fontWeight: 700, fontSize: "14px",
              }}>
                Rezultate Calculate
              </span>
              <h2 style={{ margin: "10px 0", fontSize: "28px", fontWeight: 800 }}>
                Planul Tău Este Gata!
              </h2>
            </div>

            {/* Avertisment (apare doar dacă masina de inferenta l-a derivat) */}
            {f.avertisment && (
              <div style={{
                background: THEME.warning, border: `1px solid ${THEME.danger}`,
                borderRadius: "12px", padding: "16px", color: THEME.danger,
                fontSize: "14px", display: "flex", gap: "10px", alignItems: "flex-start", fontWeight: 500,
              }}>
                <span style={{ fontSize: "20px", flexShrink: 0 }}>⚠️</span>
                {f.avertisment}
              </div>
            )}

            {/* Metrici principale */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
              <ResultMiniCard
                label="Status Corporal"
                value={BMI_LABEL[f.categorie_bmi] ?? f.categorie_bmi}
                unit={`(BMI ${f.bmi})`}
                icon="⚖️"
                color={BMI_COLOR[f.categorie_bmi] ?? THEME.accentGreen}
              />
              <ResultMiniCard
                label="Rată Metabolică Bazală"
                value={Math.round(f.bmr)}
                unit="kcal/zi"
                icon="🫀"
                color={THEME.accentBlue}
              />
              <ResultMiniCard
                label="Necesar Energetic Total"
                value={Math.round(f.tdee)}
                unit="kcal/zi"
                icon="⚡"
                color={THEME.accentOrange}
              />
              <ResultMiniCard
                label="Țintă Calorică Zilnică"
                value={Math.round(f.calorii_tinta)}
                unit="kcal/zi"
                icon="🔥"
                color={THEME.primary}
              />
            </div>

            {/* Macronutrienți + Hidratare & Mese */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

              {/* Macronutrienți */}
              {macro && (
                <Card title="Distribuție Macronutrienți" icon="🍽️">
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <MacroTag label="Proteine"     percent={macro.proteine_procent}     color={THEME.accentBlue} />
                    <MacroTag label="Carbohidrați" percent={macro.carbohidrati_procent} color={THEME.accentOrange} />
                    <MacroTag label="Grăsimi"      percent={macro.grasimi_procent}      color="#845EF7" />
                  </div>
                  {/* Grame calculate */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "16px" }}>
                    {[
                      { label: "Proteine",     g: Math.round(f.calorii_tinta * macro.proteine_procent     / 100 / 4), color: THEME.accentBlue },
                      { label: "Carbo.",       g: Math.round(f.calorii_tinta * macro.carbohidrati_procent / 100 / 4), color: THEME.accentOrange },
                      { label: "Grăsimi",      g: Math.round(f.calorii_tinta * macro.grasimi_procent      / 100 / 9), color: "#845EF7" },
                    ].map(m => (
                      <div key={m.label} style={{
                        background: THEME.bg, borderRadius: "10px", padding: "10px",
                        textAlign: "center", border: `1px solid ${THEME.border}`,
                      }}>
                        <div style={{ fontSize: "11px", color: THEME.textMuted }}>{m.label}</div>
                        <div style={{ fontSize: "20px", fontWeight: 800, color: m.color }}>{m.g}<span style={{ fontSize: "12px" }}>g</span></div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: "13px", color: THEME.textMuted, marginTop: "14px", fontStyle: "italic", lineHeight: "1.5" }}>
                    {macro.note}
                  </p>
                </Card>
              )}

              {/* Hidratare & Mese */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{
                  background: THEME.card, border: `1px solid ${THEME.border}`,
                  borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "15px",
                }}>
                  <div style={{ fontSize: "30px" }}>💧</div>
                  <div>
                    <div style={{ fontSize: "12px", color: THEME.textMuted, fontWeight: 600, textTransform: "uppercase" }}>
                      Hidratare Recomandată
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: THEME.accentBlue }}>
                      {f.apa_recomandata_litri} <span style={{ fontSize: "16px" }}>Litri / zi</span>
                    </div>
                    <div style={{ fontSize: "12px", color: THEME.textMuted, marginTop: "2px" }}>
                      {["activa", "foarte_activa"].includes(form.activitate_fizica)
                        ? "Inclusiv +0.5L pentru transpirație"
                        : "33 ml per kg corp pe zi"}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: THEME.card, border: `1px solid ${THEME.border}`,
                  borderRadius: "16px", padding: "20px", display: "flex", alignItems: "center", gap: "15px",
                }}>
                  <div style={{ fontSize: "30px" }}>🥣</div>
                  <div>
                    <div style={{ fontSize: "12px", color: THEME.textMuted, fontWeight: 600, textTransform: "uppercase" }}>
                      Frecvență Mese
                    </div>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: THEME.accentGreen }}>
                      {f.numar_mese_recomandat} <span style={{ fontSize: "16px" }}>mese / zi</span>
                    </div>
                    <div style={{ fontSize: "13px", color: THEME.textMuted }}>
                      {f.numar_mese_recomandat === 5
                        ? "3 mese principale + 2 gustări"
                        : "3 mese principale, fără gustări"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Jurnal de inferență */}
            <InferenceLog
              log={result.log}
              firedRules={result.firedRules}
              totalRules={knowledgeBase.rules.length}
            />

          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: "50px", textAlign: "center", fontSize: "12px",
          color: THEME.textMuted, borderTop: `1px solid ${THEME.border}`, paddingTop: "20px",
        }}>
          · Sistem Expert Nutriție · Forward Chaining
          <br />
          Pap Sara-Kristin &nbsp;·&nbsp; Costea Șerban &nbsp;·&nbsp; Duță Alexandru-George
        </div>

      </div>
    </PageContainer>
  );
}
