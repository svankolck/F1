# Sprint Weekend Support (Variant B) — Volledig Plan

> Dit plan beschrijft de implementatie voor volledige sprintweekend-support met scoring op 4 sessies:
> `sprint_qualifying`, `sprint`, `qualifying`, `race`.

---

## Productbesluit (vastgelegd)

1. **Scoring model = Variant B**
- Scoren op alle 4 competitieve sessies:
  - Sprint Qualifying
  - Sprint Race
  - Qualifying
  - Race

2. **Default predictions altijd toepassen**
- Profiel-defaults moeten automatisch gevuld kunnen worden voor **alle sessies**:
  - `sprint_qualifying`, `sprint`, `qualifying`, `race`
- Voor elke sessie geldt lock op basis van sessiestart.

3. **Non-sprint weekend**
- Alleen `qualifying` + `race` aanwezig en scorend.

---

## Huidige gaten (samenvatting)

1. Game-UI is nu hardcoded op 2 sessies (quali + race) en mist sprintsessies als losse voorspelbare/scorende onderdelen.
2. Results toont geen sprintresultaten-tab.
3. Home toont geen sprintsessies in sessie-overzicht.
4. Scoring-engine en DB-checks laten nu alleen `race` en `sprint` score-rijen toe.
5. Pole-puntenmodel is inconsistent tussen prediction-opslag en scoring.

---

## Doelarchitectuur

### 1) Sessie-gedreven model (single source of truth)
- Gebruik overal `WeekendSchedule.sessions` als leidend.
- Geen hardcoded duo-structuur meer (`qualiSession` + `raceSession`).
- UI, defaults, locking, scoring, admin moeten dezelfde sessietypen respecteren.

### 2) Scoring per sessietype
- `qualifying` en `sprint_qualifying`:
  - Scoren op `pole_driver_id` (eventueel later uitbreiden met top-3 kwalificatievoorspelling, nu niet nodig).
- `race` en `sprint`:
  - Scoren op `p1/p2/p3` (+ bonusregels).

### 3) Defaults per sessie
- Bij sessie zonder user-prediction:
  - Gebruik profieldefaults zolang sessie niet locked is.
  - `pole_driver_id` alleen voor kwalificatie-sessies.
  - `p1/p2/p3` voor race/sprint sessies.

### 4) Transparantie in UI
- Toon per sessie:
  - status (open/locked/completed)
  - countdown
  - of er default of user-pick staat
  - gescoorde punten zodra beschikbaar

## Detectie sprintweekend

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
  return Boolean(race.Sprint || race.SprintQualifying);
}
```

---

## Implementatieplan (concreet)

### Fase A — Game UI refactor naar N sessies
1. Vervang 2-sessie rendering in `GameClient` door iteratie over `schedule.sessions`.
2. Render per sessie een eigen `PredictionBoard` met juiste `sessionType`.
3. Toon countdown per sessie (dus op sprintweekend 4 timers).
4. Voeg sessieprogressie UI toe (bestaande `WeekendProgressBar` koppelen/gebruiken).

### Fase B — Defaults voor alle sessies
1. Houd huidige “auto-create prediction when missing” aan, maar volledig sessiegedreven.
2. Zorg dat defaults op sprintweekend voor 4 sessies worden toegepast.
3. Label/markeer `is_default` in UI (optioneel maar aanbevolen voor debug).

### Fase C — Scoring engine uitbreiden naar 4 sessies
1. `calculateScores` ondersteunen voor:
   - `qualifying`
   - `sprint_qualifying`
   - `sprint`
   - `race`
2. Definieer scoreregels:
   - kwalificatie-sessies: pole-only score
   - race/sprint: top-3 + bonus
3. Auto-score cron uitbreiden met 4 session types en juiste buffers.
4. Admin panel session selector uitbreiden met 4 opties.

### Fase D — Database migraties
1. `game_scores.session_type` check uitbreiden:
   - van `('race','sprint')`
   - naar `('qualifying','sprint_qualifying','sprint','race')`
2. `scoring_log.session_type` check idem.
3. Indexen en unique constraints blijven bruikbaar (`user_id, season, round, session_type`).
4. Migratie idempotent maken.

### Fase E — Results pagina sprint-support
1. API payload uitbreiden met `sprintResults`.
2. Results tabs:
   - Race
   - Qualifying
   - Sprint (alleen tonen als sprintweekend)
3. Sprintklassificatie in eigen tabel (hergebruik race table component waar mogelijk).

### Fase F — Home sprint-sessies
1. Sessiegrid dynamisch maken:
   - standaard 3 (FP1, Quali, Race)
   - sprintweekend 5 (FP1, Sprint Quali, Sprint, Quali, Race)
2. Labels en tijden consistent formatteren.

### Fase G — Testmatrix
1. Non-sprint weekend:
   - 2 sessies zichtbaar en scorend.
2. Sprint weekend:
   - 4 sessies zichtbaar, locktijden correct, defaults toegepast.
3. Scoring:
   - handmatig via admin + auto-score cron.
4. Regressie:
   - leaderboard totalen, chart, scoring-log statussen.

---

## Technische notities / risico's

1. **Databron Sprint Qualifying results**
- Jolpica heeft geen duidelijke endpoint-pariteit voor sprint qualifying results.
- Oplossing:
  - primair: officiële beschikbare endpoint gebruiken indien bevestigd.
  - fallback: OpenF1- of alternatieve bron toevoegen alleen voor sprint qualifying uitslag.

2. **Pole model expliciet houden**
- Qualifying-pole en SprintQualifying-pole moeten elk in hun eigen sessiescore vallen.
- Vermijd impliciete “race session bevat pole” logica.

3. **Backfill beleid**
- Bestaande seizoenen zonder quali-score entries blijven geldig.
- Nieuwe logic moet ontbreken van oudere score-rijen netjes tolereren.

---

## Definitie van Done

1. Sprintweekend toont 4 voorspelbare sessies in Game.
2. Defaults worden automatisch toegepast voor alle open sessies.
3. Alle 4 sessietypen kunnen gescoord worden (admin + cron).
4. DB accepteert en bewaart scores/logs voor alle 4 sessietypen.
5. Results toont sprintuitslagen waar beschikbaar.
6. Home toont sprintsessies in het sessie-overzicht.
