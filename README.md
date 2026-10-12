# Awwwards Creative Lab ◈

A modular, multi-site creative engineering laboratory for building, testing, and presenting **Awwwards-caliber** digital experiences, kinetic scrollytelling, and spatial interfaces.

---

## Directory Architecture

```text
Awwwards/
├── sites/                          # Self-contained Awwwards site concepts
│   ├── aurelia/                    # Site 01: Atelier Aurelia (Neoclassical Luxury Atelier)
│   │   ├── index.html              # Pinned 500vh stage & editorial layout
│   │   ├── styles.css              # Custom tokens, hairline grids, cards
│   │   ├── main.js                 # 60fps scrub engine, audio drone, sticky guardian
│   │   ├── public/                 # Video (hero_scrub.mp4) & high-res renders
│   │   ├── previews/               # Screenshot archive & mobile captures
│   │   └── README.md               # Site specs & interaction design details
│   └── _template/                  # Clean starter boilerplate for new sites
│       ├── index.html              # Modern typography & sticky hero stage
│       ├── styles.css              # Curated CSS variables & glassmorphism
│       ├── main.js                 # Smooth scroll lerp loop & sticky guardian
│       └── README.md               # Quickstart guide
├── tools/                          # Developer toolchain & automation
│   ├── server.py                   # RFC 7233 byte-range streaming HTTP server
│   ├── create_site.py              # CLI site generator (instant scaffolding)
│   ├── cdp_helper.py               # Headless CDP automated screenshot engine
│   └── test_cdp.py                 # Remote debugging verification runner
├── shared/                         # Reusable assets across sites
│   ├── css/                        # Shared resets & typography presets
│   └── js/                         # Audio synthesizers, lerp math, easing
├── server.py                       # Root entrypoint proxy to tools/server.py
├── index.html                      # Creative Lab Master Showcase Hub
├── hub.css                         # Showcase Hub styling
└── README.md                       # Repository guide (this file)
```

---

## Running the Local Environment

### 1. Multi-Site Studio Mode (Default)
Starts the local dev server serving the Master Showcase Hub and all sites:
```bash
python3 server.py
```
- **Showcase Hub**: [http://localhost:8080/](http://localhost:8080/)
- **Atelier Aurelia**: [http://localhost:8080/sites/aurelia/](http://localhost:8080/sites/aurelia/) *(or shortcut `/aurelia`)*
- **Starter Template**: [http://localhost:8080/sites/_template/](http://localhost:8080/sites/_template/)

### 2. Dedicated Single-Site Focus Mode
Mount any specific site directly at root `http://localhost:8080/`:
```bash
python3 server.py --site aurelia
```

---

## Creating a New Site in Seconds

To scaffold a completely fresh, self-contained Awwwards website:
```bash
python3 tools/create_site.py <site-slug>

# Example:
python3 tools/create_site.py kinetic-monolith
```
This automatically:
1. Copies `sites/_template/` to `sites/<site-slug>/`.
2. Formats all titles and brand placeholders.
3. Makes it immediately live at `http://localhost:8080/sites/<site-slug>/`.

---

## Core Engineering Standards

Every site built in this laboratory adheres to the following standards:

1. **Active Sticky Guardian**:
   Native `position: sticky` is backed by a per-frame fallback guardian in JavaScript that ensures hero stages never scroll away into an empty or black void on any browser or operating system.
2. **RFC 7233 Byte-Range Video Scrubbing**:
   The custom `server.py` implements partial content streaming (`HTTP 206`), enabling intra-frame 60fps video scrub seeking without playback buffering.
3. **Procedural Web Audio**:
   Interactive audio feedback (ambient drones, oscillator harmonics) using the browser's native Web Audio API with zero external libraries.
4. **Editorial Typography Scale**:
   Curated pairings (e.g., *Cinzel* + *Cormorant Garamond* + *Space Grotesk*) using fluid CSS `clamp()` and responsive ratios down to 390px mobile viewports.
