# Sprint Race Support — Impact op Bestaande Pagina's

> Dit plan beschrijft welke aanpassingen nodig zijn om sprint races correct te ondersteunen in de bestaande pagina's (Fase 1–5).

---

## Achtergrond

Sommige F1 weekenden hebben een sprintformat:
- **Normaal weekend:** FP1, FP2, FP3, Qualifying, Race
- **Sprintweekend:** FP1, Sprint Qualifying, Sprint Race, Qualifying, Race

De Jolpica API levert sessie-informatie via het `sprint` veld in de race data.

---

## Impact per Pagina

### 1. Home (`/`)
**Huidig:** Toont countdown naar race + sessietijden (FP1, QUALI, RACE).
**Aanpassing:**
- Detecteer of het weekend een sprintweekend is
- Toon extra sessieblokken: **Sprint Quali** en **Sprint Race**
- Sessie grid uitbreiden van 3 naar 5 kolommen bij sprintweekend

### 2. Timing (`/timing`)
**Huidig:** Live timing voor FP, Qualifying en Race sessies.
**Aanpassing:**
- `SessionSelector` uitbreiden met Sprint Qualifying en Sprint Race opties
- Sprint qualifying heeft ander format (SQ1/SQ2/SQ3 vs Q1/Q2/Q3)
- Sprint race timing ondersteunen (korter, ~100km)

### 3. Results (`/results`)
**Huidig:** Toont race resultaten per ronde.
**Aanpassing:**
- Toon **Sprint** tab/sectie naast de race resultaten als het een sprintweekend was
- Sprint resultaat ophalen via Jolpica `/sprint` endpoint
- Sprint punten (8-7-6-5-4-3-2-1) tonen naast WK-punten

### 4. Standings (`/standings`)
**Huidig:** Driver en Constructor standings.
**Aanpassing:**
- Geen directe aanpassing nodig — standings van Jolpica bevatten al sprint punten
- Optioneel: in detail-view per coureur sprint-resultaten apart tonen

### 5. Battle Analytics (`/standings/battle`)
**Huidig:** Directe vergelijking tussen 2 coureurs.
**Aanpassing:**
- Overlay sprint-resultaten in de grafiek (aparte kleur/stippellijn)
- Sprint data ophalen naast reguliere race data

---

## Detectie Sprintweekend

```typescript
// Jolpica API response bevat sprint data als het een sprintweekend is
interface RaceSchedule {
  round: string;
  raceName: string;
  Sprint?: { date: string; time: string };
  SprintQualifying?: { date: string; time: string };
  // ... overige sessies
}

function isSprintWeekend(race: RaceSchedule): boolean {
  return !!race.Sprint;
}
```

---

## Prioriteit

| Pagina | Impact | Prioriteit |
|--------|--------|-----------|
| Game (`/game`) | Centraal — sprint predictions + scoring | 🔴 Hoog (Fase 7) |
| Home (`/`) | Extra sessieblokken tonen | 🟡 Medium |
| Results (`/results`) | Sprint resultaten tabel | 🟡 Medium |
| Timing (`/timing`) | Sprint sessies in selector | 🟢 Laag |
| Standings (`/standings`) | Al correct (API bevat sprint) | ⚪ Geen |
| Battle (`/standings/battle`) | Sprint overlay optioneel | 🟢 Laag |

> **Voorstel:** Sprint support in Game (Fase 7) eerst bouwen. Home en Results bijwerken als onderdeel van Fase 8 polish. Timing en Battle als nice-to-have.
