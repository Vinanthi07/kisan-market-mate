# KisanSaathi (किसानसाथी)

> **Right Market. Right Time. Better Income.**

KisanSaathi is a full-stack, mobile-first agricultural decision intelligence web application built for Indian small and marginal farmers, Farmer Producer Organisations (FPOs), local produce buyers, transport operators, and rural agricultural entrepreneurs.

---

## Table of Contents

1. [Core Features & Application Modules](#core-features--application-modules)
2. [Mathematical Formulations](#mathematical-formulations)
3. [Scientific Grounding & Safety Disclosures](#scientific-grounding--safety-disclosures)
4. [Language & Voice Accessibility](#language--voice-accessibility)
5. [Architecture & Technology Stack](#architecture--technology-stack)
6. [Data Sources & Demonstration Standard](#data-sources--demonstration-standard)
7. [Installation & Local Setup](#installation--local-setup)
8. [Testing & Verification](#testing--verification)
9. [Deployment Guide](#deployment-guide)

---

## Core Features & Application Modules

KisanSaathi provides 13 dedicated, accessible modules:

| Route            | Module Name                            | Description                                                                                                                                                                        |
| ---------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`              | **Home Dashboard**                     | Market spread highlights, 12-module access grid, voice summary, quick location picker.                                                                                             |
| `/mandi-prices`  | **KisanMandi — Mandi Prices**          | Searchable APMC mandi prices, filter by crop, state, district, arrival date, min/max/modal prices, data freshness, and Agmarknet disclosures.                                      |
| `/best-market`   | **Best Market Finder**                 | Core multi-market comparison engine ranking nearby APMCs by estimated net proceeds after deducting transport, mandi fees, loading, packaging, and custom expenses.                 |
| `/when-to-sell`  | **When to Sell Decision Support**      | 3-day and 7-day moving price averages, perishability risk guards, farmer cash flow checks, and transparent sell-now-vs-wait advisory.                                              |
| `/trends`        | **Price Trends & Crop Planning**       | 15/30/60-day interactive Recharts modal price curves, multi-market comparison, and cautious seasonal planning worksheet with sensitivity analysis.                                 |
| `/calculator`    | **Farming Profit Calculator**          | Comprehensive cultivation economics engine, seed/fertilizer/labor/irrigation cost breakdowns, break-even selling price, and scenario persistence.                                  |
| `/buyers`        | **Direct Buyer Marketplace**           | Verified direct buyer listings (FPOs, retail aggregators, processing units), farmer produce listing form with local image previews and phone privacy toggle.                       |
| `/fertilizer`    | **Organic Fertilizer Marketplace**     | Vermicompost, jeevamrutha, and aged farmyard manure listings with feedstock and batch date disclosures; educational composting preparation guide.                                  |
| `/workshops`     | **Farmer Training & Workshops**        | Krishi Vigyan Kendra (KVK) and agricultural university extension sessions, registration modal with LocalStorage persistence, and empty state fallback.                             |
| `/transport`     | **Transport Coordination**             | Vehicle capacity matching (mini-trucks, tractors, pickups), distance estimation, driver quote comparison, and shared group freight load coordination.                              |
| `/lantana-guard` | **Lantana Eco-Guard (Research Pilot)** | Evidence-grounded research synthesis of _Lantana camara_ leaf bioactivity against stored-product coleopterans (PMC4571242, PMC10819012) with mandatory food safety warning banner. |
| `/profile`       | **Farmer Profile & Settings**          | Personal farm details, preferred language (6 languages), location defaults, freight cost configuration, dark/light theme toggle, and offline cache reset.                          |
| `/about`         | **Help, About & Data Sources**         | Mission statement, Agmarknet/data.gov.in integration status, formula documentation, offline PWA instructions, and emergency contact directory.                                     |

---

## Mathematical Formulations

### 1. Net Proceeds Formula (Best Market Finder)

KisanSaathi calculates the true net take-home realization for every candidate APMC yard before a farmer loads a vehicle:

$$\text{Net Proceeds} = (\text{Expected Price per Unit} \times \text{Quantity}) - \text{Transport Cost} - \text{Market Fees} - \text{Loading/Unloading Costs} - \text{Packaging Costs} - \text{Other Expenses}$$

- **Transport Cost**: Calculated using road distance estimate ($D_{\text{road}} \approx D_{\text{haversine}} \times 1.3$) multiplied by the vehicle rate per quintal per km, or overridden by a direct transporter quote.
- **Market Fees**: APMC statutory cess percentage (typically 1.5% - 2.0%) applied to gross turnover.
- **Loading & Packaging**: Standard labor and bag charges per unit volume.
- **Rejection Policy**: Non-positive quantities, invalid prices, and negative costs are rejected immediately with validation alerts.

### 2. Moving Average Calculations (When to Sell)

- **3-Day Average**: $\bar{P}_{3} = \frac{1}{3} \sum_{i=1}^{3} P_i$ (calculated strictly over the 3 most recent valid observed dates).
- **7-Day Average**: $\bar{P}_{7} = \frac{1}{7} \sum_{i=1}^{7} P_i$ (calculated strictly over the 7 most recent valid observed dates).
- **Advisory Logic**: If $\bar{P}_3 > \bar{P}_7$, recent trend is upward; if $\bar{P}_3 < \bar{P}_7$, recent trend is downward. If the crop is highly perishable (e.g., tomato, okra) or the farmer reports urgent cash needs, the system forces a cautionary "Sell Promptly" advisory to prevent farm shed deterioration.

### 3. Break-Even Price (Farming Profit Calculator)

$$\text{Break-Even Price per Unit} = \frac{\text{Total Cultivation Cost}}{\text{Expected Yield}}$$

---

## Scientific Grounding & Safety Disclosures

The **Lantana Eco-Guard** module explores the utilization of invasive _Lantana camara_ biomass. To protect farmers from unvalidated practices, all claims are rigorously grounded in peer-reviewed scientific literature:

### Peer-Reviewed Literature Grounding

1. **Rajashekar et al. (2014)** (_J Food Sci Technol_, PMC4571242):
   - Demonstrates that concentrated methanol extract of _Lantana camara_ leaves exhibited contact toxicity against adult _Sitophilus oryzae_, _Callosobruchus chinensis_, and _Tribolium castaneum_ under sealed laboratory bioassays ($320\text{ mL}$ to $850\text{ mL}$ containers).
   - Identifies lantadene triterpenoids as bioactive chemical constituents.
2. **Aisha et al. (2024)** (_Molecules_, PMC10819012):
   - Hydrodistillation of leaves yielded $0.24\%$ essential oil dominated by $\beta$-caryophyllene ($69.96\%$), displaying in-vitro fumigant mortality against _Tribolium castaneum_, _Lasioderma serricorne_, and _Callosobruchus chinensis_.

### Mandatory Safety Notice

The application prominently displays the following warning banner on all relevant views:

> **MANDATORY SAFETY NOTICE**: Experimental _Lantana_ preparations have not been established as safe or effective for food-storage use. Do not place experimental preparations in or near food, stored grain, animal feed, or areas accessible to children, livestock or pets.

- **Unvalidated Hypothesis**: The hypothesis that raw _Lantana_ leaves can be directly placed into farm grain stores to deter rodents is unvalidated by peer-reviewed agricultural science. _Lantana camara_ contains hepatotoxic lantadenes dangerous to livestock and humans.
- **No Chemical Recipes**: The application does not provide unverified chemical extraction recipes.

---

## Language & Voice Accessibility

- **6 Supported Languages**: English (`en`), Kannada (`kn`), Hindi (`hi`), Tamil (`ta`), Telugu (`te`), and Marathi (`mr`).
- **Web Speech API (`ListenButton`)**: Integrated text-to-speech reading advisories, market rankings, and workshop details in the user's chosen local dialect (`kn-IN`, `hi-IN`, `ta-IN`, `te-IN`, `mr-IN`, `en-IN`).
- **Voice Crop Search**: Microphone button on the crop selector allows speech recognition for effortless crop lookup on mobile devices.
- **Zero Ambiguity UI**: Touch targets exceed 48px, status indicators combine iconography with text labels (never color alone), and custom SVG crop illustrations ensure immediate recognition for semi-literate users.

---

## Architecture & Technology Stack

- **Framework**: React 19 with TypeScript
- **Routing & Server Engine**: TanStack Start & TanStack Router (file-based routing with automatic types)
- **Styling**: Tailwind CSS v4 & Lucide React Icons
- **Data Visualizations**: Recharts for 60-day interactive price curves
- **Geographic Mapping**: Leaflet & OpenStreetMap for APMC mandi yard locations
- **Build Tool**: Vite 8 with Nitro deployment preset
- **Package Manager**: `pnpm` (v11.1.2)
- **Testing**: Vitest with React Testing Library

---

## Data Sources & Demonstration Standard

- **Agmarknet / data.gov.in connection**: The Mandi Prices screen requests live commodity records through the server-only `/api/mandi-prices` proxy. The proxy uses the data.gov.in resource for current daily mandi prices and never returns the API key to the client.
- **Configure the secret**: Register for a data.gov.in API key. For local PowerShell, set `$env:DATA_GOV_IN_API_KEY = "your-key"` in the same terminal before starting `pnpm dev`. For Cloudflare Workers, configure it as a secret with `npx wrangler secret put DATA_GOV_IN_API_KEY`. Do not use a `VITE_` prefix or commit the key.
- **Safe fallback**: If the secret is missing, the upstream API fails, or no matching records are returned, the screen shows clearly marked DEMO benchmark records and explains why. Live data is badged separately and includes the upstream arrival date.
- **Other DEMO content**: Buyer postings, fertilizer batches, and workshop listings are demonstration data and remain explicitly badged.

---

## Installation & Local Setup

### Prerequisites

- Node.js 20+ (Node v22 recommended)
- `pnpm` (install via `npm i -g pnpm`)

### Setup Instructions

```bash
# 1. Clone or navigate to the workspace
cd kisan-market-mate-main

# 2. Install all dependencies cleanly
pnpm install

# 3. Copy public configuration defaults (optional)
cp .env.example .env

# 4. Start the development server
pnpm dev
```

To use live Agmarknet data on Windows, set the `DATA_GOV_IN_API_KEY` secret in the PowerShell terminal first; see [Data Sources & Demonstration Standard](#data-sources--demonstration-standard).

The application will launch at `http://localhost:3000`.

---

## Testing & Verification

Run the automated test suite covering master net proceeds calculations, unit conversions, perishability risk guards, break-even economics, and route rendering:

```bash
# Run all unit tests
pnpm test

# Run ESLint validation
pnpm lint

# Format code with Prettier
pnpm format

# Verify production build
pnpm build
```

---

## Deployment Guide

### Deploy to Cloudflare Pages / Workers

The project is preconfigured with Nitro's `cloudflare-module` preset.

```bash
pnpm build
npx wrangler pages deploy .output/public
```

### Deploy to Vercel

1. Set Root Directory to repository root.
2. Build Command: `pnpm build`
3. Output Directory: `.output/public`
4. Install Command: `pnpm install`

### Deploy to Netlify

1. Build Command: `pnpm build`
2. Publish Directory: `.output/public`
