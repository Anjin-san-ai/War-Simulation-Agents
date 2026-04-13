# World Command Center

An interactive **OSINT-style command center**: a 3D Earth globe with layered intelligence (satellites, maritime, GPS jamming, conflict news), optional **AI war simulation** (Six Thinking Hats), and a live **intel ticker**.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build   # production build
npm run preview # preview production build
```

## Configuration (Azure OpenAI)

War simulation and news geolocation use **Azure OpenAI** (e.g. GPT-4o). Copy `.env.example` to `.env` and set:

| Variable | Description |
|----------|-------------|
| `VITE_AZURE_OPENAI_ENDPOINT` | Azure resource URL (trailing slash OK) |
| `VITE_AZURE_OPENAI_KEY` | API key |
| `VITE_AZURE_OPENAI_DEPLOYMENT` | Deployment name (default `gpt-4o`) |
| `VITE_AZURE_OPENAI_API_VERSION` | API version (default `2025-01-01-preview`) |

Without valid keys, war simulation will error and conflict articles may fall back to placeholder coordinates only where the app provides them.

---

## Features

### 3D globe & navigation

- **Drag** to rotate, **scroll** to zoom; click objects for details in the side panel.
- **Tiled satellite imagery** via `three-slippy-map-globe` (Esri World Imagery) so detail increases as you zoom in.
- **Country borders** from Natural Earth (TopoJSON → GeoJSON), aligned with the globe’s coordinate system.
- **Point-in-polygon** country pick: when zoomed in, you can **click a country** to enter war simulation mode.

### Intelligence layers (toggle in the right panel)

| Layer | What it shows |
|-------|----------------|
| **Satellites** | Real positions from **CelesTrak TLEs** + **satellite.js (SGP4)**; orbit lines; markers scale down when zoomed in. |
| **Flights (ADS-B)** | Optional layer; data from **OpenSky Network** when enabled (toggle may be off by default). |
| **Maritime (AIS)** | Vessel-style markers (simulated/sample traffic around major chokepoints). |
| **GPS Jamming** | Curated **interference-style zones** (heatmap-style discs on the globe). |
| **Conflict Events** | Headlines from **GDELT** when available; **Azure** enriches with lat/lng, intensity, and category. **Fallback headlines** show immediately if APIs are slow or unavailable. |
| **Country Borders** | Political boundaries overlay. |

### Object inspection

- Click a satellite, vessel, event marker, etc. to open a **detail card** with metadata (source, category, time, etc.).

### War simulation (Six Thinking Hats)

1. Zoom until the hint offers **country selection**, then **click a country**.
2. The right panel switches to **War Simulation**: choose **opponent**, **allies**, **enemies**, and **scenario filters** (economic, oil, tech, nuclear, civil unrest, cyber).
3. **Run simulation** → **Azure OpenAI** returns structured JSON:
   - **Six Thinking Hats** as parallel “agent” perspectives (facts, emotions, risks, optimism, creativity, strategy) with distinct narratives.
   - **Likely outcome**, **consensus**, **phases**, **risk percentages**, **winner** hint.
4. The results panel **expands to ~50% width** when a successful result is shown.
5. **Threat heatmap on the globe**: attacker, defender, allies, and opponents get colored translucent overlays driven by scenario risk metrics (without changing the text layout of the outcomes).

### Live conflict news

- **Bottom ticker**: scrolling **INTEL** headlines (severity color dot, source, relative time). Always visible; uses real GDELT+Azure data when possible, else curated fallback.
- **Latest Intel** in the layer panel: five most recent items, clickable like globe markers.

### Top bar

- **WORLD COMMAND CENTER** / **WAR SIMULATION** title depending on mode.
- **Live** indicator and **UTC clock**.
- **Layer / object counts** summary.
- **Sidebar toggle** to show or hide the right panel.

### Responsive layout

- Narrow screens stack the globe and side panel; UI remains usable on smaller viewports.

---

## Tech stack

- **React** + **Vite**
- **Tailwind CSS** (v4-style `@import` in CSS)
- **Three.js** + **three-slippy-map-globe** + **topojson-client** + **satellite.js**

## Data sources & APIs (summary)

| Source | Role |
|--------|------|
| Esri World Imagery (tiles) | Basemap |
| Natural Earth 110m | Borders |
| CelesTrak | Satellite TLEs |
| OpenSky | ADS-B flights (if layer on) |
| GDELT Doc API | Conflict articles |
| Azure OpenAI | War simulation + article geolocation / classification |
| Curated data | GPS jamming zones, maritime sample, ticker fallback |

## License

This project is released under the [MIT License](LICENSE).

## Push to GitHub

Create an empty repository on GitHub (no README if you want a clean first push), then from this project directory:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

Use the SSH remote URL instead if you prefer SSH keys.

## Disclaimer

This app is for **education and visualization** only. Simulations are **not predictions**; they are LLM-generated scenarios. Always verify real-world information with primary sources.
