# Fase 2 — WK Standings + Rijder Detail

> **Status:** Voltooid ✅  
> **Voltooid op:** 2026-02-14

---

## Doel

Volledige WK-stand pagina bouwen met ronde-navigatie, seizoenselectie en een gedetailleerde rijderpagina met puntengrafiek.

## Taken

- [x] **Standings pagina** (`/standings`)
- [x] **Rijder Detail pagina** (`/standings/[driverId]`)
  - [x] Punten-staafgrafiek (Percentage-gebaseerd voor robuuste layout)

## Componenten

| Component | Beschrijving |
|-----------|-------------|
| `RoundSlider.tsx` | Horizontale slider met vlaggen per ronde |
| `SeasonSelector.tsx` | Dropdown of verticale slider voor seizoen |
| `StandingsTable.tsx` | Tabel met positie, rijder, team, punten, delta |
| `DriverCard.tsx` | Klikbare kaart met rijderinfo |
| `PointsChart.tsx` | Recharts lijn-grafiek puntenverloop |
| `RaceHistoryTable.tsx` | Tabel met race-voor-race resultaten |

## API Endpoints

```
GET /ergast/f1/{seizoen}/driverstandings.json
GET /ergast/f1/{seizoen}/constructorstandings.json
GET /ergast/f1/{seizoen}/{ronde}/driverstandings.json   → Stand na specifieke ronde
GET /ergast/f1/{seizoen}/drivers/{driverId}/results.json → Alle resultaten van een rijder
```

## Data Model

```typescript
interface StandingsView {
  season: string;
  round: string;
  type: 'drivers' | 'constructors';
  standings: DriverStanding[] | ConstructorStanding[];
}
```

## Design

- Design: Premium dark grey branding ("F1 #247")
- Tabel: donkere rijen met subtiele hover-state
- Positie-delta: groen voor stijging, rood voor daling, grijs voor gelijk
- Rijderfoto's: klein rond (40px) in de tabel
- Punten-staafgrafiek: categorical bars met team-kleur verlopen
- Ronde-slider: horizontaal scrollbaar, met desktop navigatie-pijlen
