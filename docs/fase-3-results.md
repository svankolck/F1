# Fase 3 — Race Results

> **Status:** Voltooid ✅  
> **Voltooid op:** 2026-02-14

---

## Doel

Race-uitslagenpagina met race-navigatie, top-3 podium showcase en volledige classificatie.

## Taken

- [x] **Results pagina** (`/results`)
- [x] **Kwalificatie-uitslagen** (tab of toggle)

## Componenten

| Component | Beschrijving |
|-----------|-------------|
| `RaceSlider.tsx` | Hergebruik van `RoundSlider` met race-specifieke data |
| `PodiumShowcase.tsx` | Grote top-3 weergave met foto's en podium-styling |
| `ClassificationTable.tsx` | Volledige uitslags-tabel |
| `QualifyingTable.tsx` | Q1/Q2/Q3 tabel met eliminatie-markers |
| `FastestLapBadge.tsx` | Paarse indicator voor snelste ronde |

## API Endpoints

```
GET /ergast/f1/{seizoen}/{ronde}/results.json      → Race-uitslag
GET /ergast/f1/{seizoen}/{ronde}/qualifying.json   → Kwalificatie
GET /ergast/f1/{seizoen}/{ronde}/pitstops.json     → Pitstops
GET /ergast/f1/{seizoen}/{ronde}/laps.json         → Rondetijden
```

## Design

- Podium: vergelijkbaar met Home page maar groter en gedetailleerder
- Classificatie: alternerende rij-tinten, snelste ronde in paars
- Status-badges: groen (Completed), rood pulserend (Live), geel (Upcoming)
- Responsief: op mobiel stacked layout, op desktop naast elkaar
