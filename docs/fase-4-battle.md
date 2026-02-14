# Fase 4 — Battle Analytics

> **Status:** Te doen  
> **Geschatte duur:** Week 5

---

## Doel

Interactieve puntentrajectgrafiek waarmee je seizoensverloop van rijders kunt vergelijken.

## Taken

- [ ] **Battle pagina** (`/standings/battle` of als tab op standings)
  - Grafiek: punten (Y-as) vs rondes (X-as)
  - Recharts `LineChart` met meerdere datasets
  - Default: top 3 rijders in de huidige stand geselecteerd
  - Rijders selecteren/deselecteren onder de grafiek
    - Checkboxes of toggle-chips met teamkleuren
  - Hover op datapunt: tooltip met punten + rijderafkorting
  - Lijnkleuren = teamkleuren uit `TEAM_COLORS` mapping
  - Seizoenselector (zelfde als standings)
- [ ] **Responsive design**
  - Desktop: brede grafiek met legenda rechts
  - Tablet: grafiek met legenda onder
  - Mobiel: zoom/pan op grafiek, legenda als horizontale scroll

## Componenten

| Component | Beschrijving |
|-----------|-------------|
| `BattleChart.tsx` | Recharts `LineChart` met multi-line data |
| `DriverSelector.tsx` | Chips/checkboxes om rijders toe te voegen/verwijderen |
| `ChartTooltip.tsx` | Custom tooltip met rijderinfo + punten |

## API Endpoints

```
GET /ergast/f1/{seizoen}/driverstandings.json              → Finale stand
GET /ergast/f1/{seizoen}/{ronde}/driverstandings.json      → Stand per ronde (loop 1..N)
```

> **Let op:** Om het puntenverloop te berekenen, moet je de stand na elke ronde ophalen. Cache dit agressief.

## Data Transformatie

```typescript
interface BattleDataPoint {
  round: number;
  circuitName: string;
  [driverId: string]: number; // punten per rijder
}

// Voorbeeld:
// { round: 1, circuitName: "Bahrain", max_verstappen: 25, norris: 18, leclerc: 15 }
```

## Design

- Donkere achtergrond met lichte grid-lijnen
- Teamkleuren als lijnen (uit `TEAM_COLORS`)
- Hover-state: verticale lijn + tooltip
- Smooth interpolation (Recharts `type="monotone"`)
- Driver chips: kleine ronde foto + afkorting + teamkleur border
