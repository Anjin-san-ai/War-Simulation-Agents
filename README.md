# World Command Center

An interactive **OSINT-style command center**: a 3D Earth globe with layered intelligence (satellites, maritime, GPS jamming, conflict news), optional **AI war simulation** (Six Thinking Hats), and a live **intel ticker**.

## Quick start

```bash
npm install
cd server && npm install && cd ..
```

**Globe + UI only** (war simulation button will fail until the API is running):

```bash
npm run dev
```

**Globe + LangGraph war API** (recommended): run the Node server and Vite together:

```bash
npm run dev:all
```

Open [http://localhost:5173](http://localhost:5173) — Vite proxies `/api` to the API on port **3000**.

```bash
npm run build   # production build
npm run preview # preview production build
```

## Configuration

### War simulation (Node + LangGraph)

Keys stay on the **server**. Copy [`server/.env.example`](server/.env.example) to `server/.env` and set `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT_NAME`, and `AZURE_OPENAI_API_VERSION`. See [`server/README.md`](server/README.md).

Without `server/.env`, `POST /api/war-simulation` returns 503 and the war panel shows an error when you run a simulation.

Optional: set `VITE_WAR_API_URL` if the API is not on `http://localhost:3000` (otherwise the Vite proxy is enough in dev).

### Conflict news enrichment (browser)

GDELT article geolocation still calls Azure from the client when configured. Copy `.env.example` to `.env` in the project root and set:

| Variable | Description |
|----------|-------------|
| `VITE_AZURE_OPENAI_ENDPOINT` | Azure resource URL (trailing slash OK) |
| `VITE_AZURE_OPENAI_KEY` | API key |
| `VITE_AZURE_OPENAI_DEPLOYMENT` | Deployment name (default `gpt-4o`) |
| `VITE_AZURE_OPENAI_API_VERSION` | API version (default `2025-01-01-preview`) |

Without valid keys, conflict articles may fall back to placeholder coordinates only where the app provides them.

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
