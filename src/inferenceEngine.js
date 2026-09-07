/**
  * Masina de inferenta cu forward chaning
 *
 * Functia principala
 *   forwardChaining(userInput, knowledgeBase) → InferenceResult
 * 
 * Tipul InferenceResult:
 * {
 *   facts: {
 *     bmi                       : number,
 *     categorie_bmi             : string,   // "subponderal"|"normal"|"supraponderal"|"obez"
 *     bmr                       : number,
 *     tdee                      : number,
 *     calorii_tinta             : number,
 *     distributie_macronutrienti: { proteine_procent, carbohidrati_procent, grasimi_procent, note },
 *     apa_recomandata_litri     : number,
 *     numar_mese_recomandat     : number,
 *     avertisment?              : string,
 *     ajustare_varsta?          : number,
 *   },
 *   log        : Array<{ step, formula, result }>,
 *   firedRules : string[],
 * }
 */

// Factori TDEE 
const ACTIVITY_FACTORS = {
  sedentara:     1.2,
  usoara:        1.375,
  moderata:      1.55,
  activa:        1.725,
  foarte_activa: 1.9,
};

//Evaluarea unei conditii individuale
/**
 * @param {string} factName  - numele faptului din tabela de lucru
 * @param {string} op        - operatorul: "<"|"<="|">"|">="|"=="|"in"
 * @param {*}      ref       - valoarea de referinta din regula
 * @param {object} facts     - tabela curenta de fapte
 * @returns {boolean}
 */
function evalCondition(factName, op, ref, facts) {
  const val = facts[factName];
  if (val === undefined || val === null) return false;

  switch (op) {
    case "<":  return val < ref;
    case "<=": return val <= ref;
    case ">":  return val > ref;
    case ">=": return val >= ref;
    case "==": return val === ref;
    case "in": return Array.isArray(ref) && ref.includes(val);
    default:
      console.warn(`[InferenceEngine] Operator necunoscut: "${op}"`);
      return false;
  }
}

// Verific daca toate conditiile unei reguli sunt satisfacute

function ruleMatches(rule, facts) {
  return rule.if.conditions.every(({ fact, operator, value }) =>
    evalCondition(fact, operator, value, facts)
  );
}

//Evaluator de formule aritmetice
/**
 * Formulele din Baza de cunostinte sunt stringuri:
 *   "tdee - 500", "greutate * 0.033", "calorii_tinta + 150"
 *
 * Algoritmul:
 *   1. Sortează cheile din 'facts' descrescator dupa lungime
 *      (pentru a evita substituiri parțiale).
 *   2. Inlocuieste fiecare cheie numerica cu valoarea ei.
 *   3. Valideaza ca expresia contine doar cifre si operatori aritmetici.
 *   4. Evalueaza si returneaza rezultatul rotunjit la 2 zecimale.
 *
 * @param {string} formulaStr - formula din campul 'then.formula' al regulii
 * @param {object} facts      - tabela curenta de fapte
 * @returns {number|null}
 */
function evaluateFormula(formulaStr, facts) {
  let expr = formulaStr;

  const sortedKeys = Object.keys(facts).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    const val = facts[key];
    if (typeof val === "number") {
      expr = expr.replace(new RegExp(`\\b${key}\\b`, "g"), String(val));
    }
  }

  if (!/^[\d\s+\-*/().]+$/.test(expr)) {
    console.warn(`[InferenceEngine] Formulă nesigură: "${expr}" (original: "${formulaStr}")`);
    return null;
  }

  try {
    const result = Function(`"use strict"; return (${expr})`)();
    return +result.toFixed(2);
  } catch (err) {
    console.error(`[InferenceEngine] Eroare evaluare formulă "${formulaStr}" → "${expr}":`, err);
    return null;
  }
}

// Aplicarea concluziei unei reguli 
/**
 * Interpretez campul 'then' al regulii si actualizeaza 'facts'.
 * Campul 'then' poate contine:
 *   - set_fact + value          → setare directa a unui fapt
 *   - set_fact + formula        → calcul dinamic al unui fapt
 *   - override_calorii → recalculeaza 'calorii_tinta' (R020, R021)
 *
 * @returns {string} descrie actiunea efectuata pentru jurnal
 */
function applyConclusion(rule, facts) {
  const { then: t } = rule;
  let description = "";

  //Valoare directa (categorie_bmi, distributie_macronutrienti, numar_mese_recomandat, avertisment)
  if (t.value !== undefined) {
    facts[t.set_fact] = t.value;
    const displayVal = typeof t.value === "object"
      ? JSON.stringify(t.value).slice(0, 80) + "…"
      : String(t.value);
    description = `${t.set_fact} ← ${displayVal}`;
  }

  //Formula aritmetica (calorii_tinta, apa_recomandata_litri, ajustare_varsta)
  if (t.formula) {
    const computed = evaluateFormula(t.formula, facts);
    if (computed !== null) {
      facts[t.set_fact] = computed;
      description = `${t.set_fact} ← ${computed}  [formula: "${t.formula}"]`;
    }
  }

  //Override calorii — suprascrie calorii_tinta (R020 și R021)
  if (t.override_calorii) {
    const overrideVal = evaluateFormula(t.override_calorii, facts);
    if (overrideVal !== null) {
      facts["calorii_tinta"] = overrideVal;
      description += `  |  override calorii_tinta ← ${overrideVal}  [formula: "${t.override_calorii}"]`;
    }
  }

  return description;
}

//  Calculul faptelor intermediare 
/**
 * Deriva BMI, BMR și TDEE din faptele utilizatorului si le adaug in tabela de fapte.
 *
 * @param {object} facts - tabela de fapte 
 * @param {object} log   - jurnalul de inferenta 
 */
function computeIntermediateFacts(facts, log) {
  // BMI
  const h_m = facts.inaltime / 100;
  facts.bmi = +((facts.greutate / (h_m * h_m)).toFixed(2));
  log.push({
    step:    "Calcul BMI",
    formula: "greutate / (inaltime_m²)",
    result:  `bmi = ${facts.bmi}`,
  });

  // BMR 
  const bmrRaw = facts.sex === "masculin"
    ? 10 * facts.greutate + 6.25 * facts.inaltime - 5 * facts.varsta + 5
    : 10 * facts.greutate + 6.25 * facts.inaltime - 5 * facts.varsta - 161;
  facts.bmr = +bmrRaw.toFixed(2);
  log.push({
    step:    `Calcul BMR (${facts.sex})`,
    formula: facts.sex === "masculin"
      ? "10·greutate + 6.25·inaltime − 5·varsta + 5"
      : "10·greutate + 6.25·inaltime − 5·varsta − 161",
    result:  `bmr = ${facts.bmr} kcal/zi`,
  });

  // TDEE
  const factor = ACTIVITY_FACTORS[facts.activitate_fizica] ?? 1.2;
  facts.tdee = +((facts.bmr * factor).toFixed(2));
  log.push({
    step:    "Calcul TDEE",
    formula: `bmr × factor_activitate (${facts.activitate_fizica} = ${factor})`,
    result:  `tdee = ${facts.tdee} kcal/zi`,
  });
}

//  ALGORITMUL FORWARD CHAINING 
/**
 *   - Pornind de la faptele cunoscute (datele utilizatorului + fapte intermediare)
 *   - Aplic repetat regulile ale caror premise sunt satisfacute
 *   - Adaug concluziile in tabela de fapte
 *   - Se opreste cand nu mai poate activa nicio regula noua
 *
 * @param {object} userInput      - faptele initiale ale utilizatorului
 * @param {object} knowledgeBase  - obiectul din baza_de_cunostinte.json
 * @returns {{ facts, log, firedRules }}
 */
export function forwardChaining(userInput, knowledgeBase) {
  // Tabela de fapte de lucru
  const facts = { ...userInput };
  const log = [];
  const firedRules = [];

  //Fapte intermediare derivate
  computeIntermediateFacts(facts, log);

  //Sortez regulile dupa prioritate crescatoare
  const sortedRules = [...knowledgeBase.rules].sort(
    (a, b) => a.priority - b.priority
  );

  //Bucla principala Forward Chaining
  let changed = true;
  while (changed) {
    changed = false;
    for (const rule of sortedRules) {
      if (firedRules.includes(rule.id)) continue;
      if (ruleMatches(rule, facts)) {
        const actionDesc = applyConclusion(rule, facts);
        log.push({
          step:    `Regulă ${rule.id} — "${rule.name}"`,
          formula: rule.then.formula ?? rule.then.override_calorii ?? "valoare directă",
          result:  actionDesc,
        });
        firedRules.push(rule.id);
        changed = true;
      }
    }
  }

  //Ajustare finala de varsta (R040/R041)
  if (facts.ajustare_varsta !== undefined) {
    const before = facts.calorii_tinta;
    facts.calorii_tinta = facts.ajustare_varsta;
    log.push({
      step:    "Ajustare vârstă aplicată",
      formula: "calorii_tinta ← ajustare_varsta",
      result:  `calorii_tinta: ${before} → ${facts.calorii_tinta} kcal/zi`,
    });
  }

  return { facts, log, firedRules };
}
