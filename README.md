# Rule-Based Nutrition Expert System

A university team project that implements a rule-based expert system for generating personalized, orientative nutrition recommendations from user-provided data.

The application uses a custom **Forward Chaining** inference engine, a JSON knowledge base containing **17 IF–THEN rules**, and a React interface for collecting user data and displaying the derived recommendations.

## Features

- Collects age, weight, height, sex, physical-activity level, and nutrition goal
- Calculates intermediate facts such as BMI, BMR, and TDEE
- Applies prioritized IF–THEN rules using Forward Chaining
- Generates a daily calorie target
- Recommends macronutrient distribution
- Provides hydration and meal-frequency recommendations
- Detects selected atypical situations and displays warnings
- Displays an inference log showing the rules that fired

## Technologies

- React
- JavaScript
- JSON
- Vite
- Rule-Based Systems
- Forward Chaining

## Project Architecture

```text
nutrition-expert-system/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── inferenceEngine.js
│   └── knowledgeBase.json
├── docs/
│   └── Documentatie_SistemExpert_Nutritie.docx
├── screenshots/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

### Knowledge Base

`src/knowledgeBase.json` contains:

- the schema for facts entered by the user;
- definitions for intermediate facts such as BMI, BMR, and TDEE;
- 17 prioritized IF–THEN rules covering BMI classification, calorie targets, warnings, macronutrients, age adjustments, hydration, and meal frequency.

### Inference Engine

`src/inferenceEngine.js` implements the Forward Chaining algorithm. It:

1. starts from the facts provided by the user;
2. computes intermediate facts;
3. sorts rules by priority;
4. repeatedly fires matching rules;
5. updates the working fact set until no new rule can be activated;
6. returns the derived facts, fired rules, and inference log.

### User Interface

`src/App.jsx` contains the React interface, including input validation, reusable form components, result cards, and the inference-log view.

## Team

- **Sara-Kristin Pap** — Knowledge base: definition and structuring of the rule set
- **Șerban Costea** — Graphical interface: React web application
- **Alexandru-George Duță** — Inference engine: Forward Chaining algorithm

## Run Locally

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Then open the local address shown by Vite in your browser.

## Build

```bash
npm run build
npm run preview
```

## Academic Context

Expert Systems university project, 2026.

## Notes

The recommendations produced by this project are educational and orientative. The current rule set does not cover special medical cases and is not intended to replace professional medical or nutritional advice.
