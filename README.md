# Kisan Market Mate

Build a mobile-first Progressive Web App called "KisanMandi" that helps small farmers in India decide where and when to sell their produce for the best net profit after transport costs.

USERS
Low-literacy, low-English farmers on budget Android phones. The design must work with icons, numbers, colors and voice, not reading.

HARD DESIGN RULES
- NO emojis anywhere. Use Lucide icons (or custom SVG) only. Every icon must have a short local-language label next to it.
- Big touch targets (min 48px), high contrast, large numbers, minimal text, one primary action per screen.
- Status is shown with color AND a symbol (check = best, dash = okay, cross = poor), never color alone.
- Crops are shown as large illustrated pictures, not just text.
- Light and dark mode.

LANGUAGES
English, Hindi, Tamil, Telugu, Kannada, Marathi. Language picker on first launch and always reachable from the top bar. All UI text, crop names, market names and voice output follow the chosen language. Use an i18n file so languages are easy to add. Mark the translations as "needs native review" in a comment.

VOICE
A "Listen" button (speaker icon) on every result screen reads the advice aloud in the selected language using the Web Speech API (speechSynthesis), with the correct lang code (hi-IN, ta-IN, te-IN, kn-IN, mr-IN, en-IN). If no voice is installed, show a friendly fallback message. Add voice input for crop selection if the browser supports it.

SCREENS
1. Onboarding: language, then location (GPS or pick state, district, village from dropdowns), then crop picture grid.
2. SELL screen (core feature):
   - Inputs: crop (picture buttons), quantity in quintals, village (auto from GPS).
   - Map (Leaflet + OpenStreetMap) showing nearby mandis as numbered markers colored green, yellow or red by net profit. Tapping a marker or card highlights it and draws the route line.
   - Ranked list of markets. Each card shows: rank, market name, big net price per quintal in rupees, and icon rows for distance (km), price, transport cost, mandi fees, estimated spoilage loss.
   - Net profit formula: net per quintal = market price - (distance_km x transport_rate_per_quintal_per_km) - (mandi fee % x price) - spoilage loss. Make transport rate editable (default 1.8 rupees per quintal per km) with an optional "my vehicle" setting.
   - Show "extra money vs nearest market" as a green badge so the farmer sees the benefit.
   - Direct buyer option (grocery apps and FPOs) appears in the same list with a "Direct" icon badge.
3. WAIT OR SELL advice banner at the top of results:
   - Compare today's best net price with a trend-based 7 to 10 day forecast (simple moving average or linear trend on the last 30 to 90 days of prices).
   - If the expected gain after storage cost is positive and the crop's shelf life allows, show "WAIT N days" with an hourglass icon and the expected gain in rupees. Otherwise show "SELL NOW".
   - Include a crop shelf-life table (normal vs with Lantana leaf protection). Label the Lantana effect clearly as "traditional method, pilot, not guaranteed".
   - Always show a small disclaimer: "Forecast is a trend estimate, not a guarantee."
4. WHAT TO SOW screen: ranks crops for the current season by expected profit per acre = (expected price x typical yield) - typical input cost, using historical mandi prices. Show a simple horizontal bar list with crop pictures and rupee values. Cost and yield figures are editable defaults per crop.
5. BUYERS screen: list of direct buyers (sample data) with crop, price per quintal and weekly quantity, plus a "Contact" button that opens a phone call or WhatsApp link. Add a simple form for a farmer to post a "I have produce" listing.
6. LEARN screen: three picture-led cards with audio narration: Manure and bio-fertilizer workshop (compost, vermicompost), Lantana camara leaf storage against rodents (pilot), and how to read the market ranking.

DATA
- Use Supabase for backend (tables: markets, prices, crops, buyers, listings).
- Create an edge function that fetches daily mandi prices from the Agmarknet API on data.gov.in (modal, min, max price by commodity, market, district, state) and stores them in the prices table. Put the API key in a secret, never in client code.
- Seed realistic sample data for Karnataka, Tamil Nadu, Maharashtra and Andhra/Telangana for onion, tomato, maize, potato, groundnut and paddy so the app works before live data is connected.
- Show a "Price updated: date" label on results so farmers know how fresh the data is.
- Distances: use haversine x 1.3 as the road estimate, with an option to plug in a routing API later.

TECH
React + TypeScript + Tailwind + shadcn/ui, Lucide icons, Leaflet, Supabase. PWA with installable manifest and offline cache of the last fetched prices. Fast on 3G: lazy-load the map, keep bundle small.

QUALITY
- Clean component structure, typed data models, all user-facing strings in the i18n files.
- Handle empty, loading and offline states with icon plus short local-language message.
- Accessibility: aria-labels, readable font sizes (min 16px), works with screen readers.

OUT OF SCOPE FOR NOW (leave hooks only)
WhatsApp bot and IVR phone access for feature phones, payments, user accounts beyond a simple phone-number login.

Start with the onboarding, SELL screen and language and voice system first, then add the other screens.
You should build this before token ends

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kisan-market-mate.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0d510112-bb11-4ca3-bd8a-4ce90fd30231).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
