# Fase 5 — Live Timing

> **Status:** Voltooid ✅  
> **Voltooid op:** 2026-02-14

---

## Doel

Responsieve live timing pagina met posities, rondetijden, pitstops en optioneel een track position map.

## Taken

- [x] **Live Timing pagina** (`/timing`)
  - Detectie: is er een actieve sessie? (OpenF1 `/sessions`)
    - **Geen sessie:** Countdown naar volgende GP (hergebruik Home countdown)
    - **Sessie actief:** Live timing view
  - Live timing tabel met polling (elke 5–30 seconden)
  - Kwalificatie-modus: Q1/Q2/Q3 tabs

### Responsive Timing Tabel

| Scherm | Kolommen |
|--------|----------|
| **Mobiel verticaal** | Positie, Rijder (code), Interval, Gap to leader |
| **Mobiel horizontaal** | + Laatste ronde, S1/S2/S3, Pitstops, Banden |
| **Desktop** | + Track position map met auto-icoontjes |

- [x] **Track Position Map** (desktop only)
  - Circuit SVG als achtergrond
  - Auto-icoontjes (rijdernummer + teamkleur) op de baan
  - Positie-updates via OpenF1 `/location` endpoint
  - Smooth animatie tussen positie-updates

## Componenten

| Component | Beschrijving |
|-----------|-------------|
| `LiveTimingTable.tsx` | Responsieve tabel met rijderposities |
| `TimingRow.tsx` | Enkele rij met kleur-gecodeerde sectortijden |
| `TrackMap.tsx` | SVG circuit met auto-posities |
| `SessionSelector.tsx` | FP1/FP2/FP3/Quali/Race tabs |
| `QualifyingView.tsx` | Q1/Q2/Q3 split view |
| `TyreIndicator.tsx` | Bandencompound indicator (S/M/H/I/W) |

## API Endpoints (OpenF1)

```
GET /v1/sessions?year={jaar}&country_name={land}     → Sessie-info
GET /v1/position?session_key={key}                    → Live posities
GET /v1/laps?session_key={key}&driver_number={nr}     → Rondetijden
GET /v1/stints?session_key={key}                      → Banden/stints
GET /v1/pit?session_key={key}                         → Pitstops
GET /v1/location?session_key={key}                    → Auto-locaties (x,y)
GET /v1/race_control?session_key={key}                → Safety car, rode vlag, etc.
```

## Polling Strategie

```typescript
// Client-side polling met configurable interval
const POLL_INTERVALS = {
  positions: 5000,    // 5s — kern-data
  laps: 10000,        // 10s — rondetijden
  stints: 30000,      // 30s — banden veranderen niet vaak
  location: 3000,     // 3s — track map (alleen desktop)
  raceControl: 10000, // 10s — berichten
};
```

> [!WARNING]
> **OpenF1 rate limits:** Gebruik caching en batch-requests waar mogelijk. Overweeg een server-side cache (API route) om client-calls te bundelen.

## Design

- Sectortijden: paars (persoonlijk beste), groen (sessie-beste), geel (normaal)
- Gap-kleuren: groen voor inhaalactie, rood voor terugval
- Bandencompound: kleur-gecodeerd (Rood=S, Geel=M, Wit=H, Groen=I, Blauw=W)
- Track map: donkere achtergrond, lichtgrijze baan, teamkleur-bolletjes
