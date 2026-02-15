# Fase 7 — Prediction Game

> **Status:** Te doen  
> **Geschatte duur:** Week 9–10

---

## Doel

F1 voorspellingsspel waarbij gebruikers per raceweekend **5 voorspellingen** doen:
1. **Pole position** (gesloten bij start kwalificatie)
2. **Race top 3** — P1/P2/P3 (gesloten bij start race)
3. **Sprint pole** (alleen bij sprintweekenden, gesloten bij start sprint qualifying)
4. **Sprint top 3** — P1/P2/P3 (alleen bij sprintweekenden, gesloten bij start sprint race)

Elke gebruiker kan in zijn profiel **default coureurs** instellen die automatisch worden ingevuld als fallback.

---

## Weekend Progress Bar

Bovenaan de game pagina een visuele **voortgangsbalk** die het weekend verloop toont:

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ QUALI    │→ │ SPRINT Q │→ │ SPRINT   │→ │ RACE     │
│ ✅ 25pt  │  │ 🔒 -     │  │ ⏳ open  │  │ ⏳ open  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

- **Donker blok** = sessie is voorbij, toont behaalde punten
- **Actief blok** = huidige open sessie, knippert/gloeit
- **Leeg blok** = nog niet beschikbaar
- Bij niet-sprintweekend: alleen QUALI + RACE blokken
- Klik op afgerond blok → toont jouw prediction vs. werkelijke uitslag

---

## Puntenberekening

### Hoofdrace

| Voorspelling | Punten |
|---|---|
| Pole position correct | 25 |
| P1 correct | 25 |
| P2 correct | 18 |
| P3 correct | 15 |
| Coureur wél in top 3 maar verkeerde plek | 10 per coureur |

**Maximum per race:** 25 + 25 + 18 + 15 = **83 punten**

### Sprint Race

| Voorspelling | Punten |
|---|---|
| Sprint pole correct | 8 |
| Sprint P1 correct | 8 |
| Sprint P2 correct | 7 |
| Sprint P3 correct | 6 |
| Coureur wél in top 3 maar verkeerde plek | 5 per coureur |

**Maximum per sprint:** 8 + 8 + 7 + 6 = **29 punten**

**Maximum per sprintweekend:** 83 + 29 = **112 punten**

---

## Taken

- [ ] **Game pagina** (`/game`) — alleen voor ingelogde gebruikers
  - Toggle: **Prediction** / **Stand**
  - **Weekend Progress Bar** bovenaan (zie hierboven)
  - **Prediction tab:**
    - Per sessie: **drag & drop** interface voor pole-sitter + P1/P2/P3
    - Lock countdown per sessie (op basis van sessietijden uit API)
    - Gebruiker kan predictions wijzigen totdat de sessie begint
    - Na sessie start: predictions read-only + predictions van andere gebruikers **direct zichtbaar**
    - Als uitslag nog niet binnen: *"Even geduld, scores worden berekend..."*
  - **Stand tab:**
    - Seizoensranking: username + totaal punten + aantal races
    - Puntengrafiek per ronde (zelfde stijl als Battle chart)
    - Gebruikers selecteerbaar voor vergelijking
    - Klik op gebruiker → race-voor-race detail

- [ ] **Default coureurs in profiel**
  - In profiel pagina: sectie om default coureurs in te stellen
  - Default pole-sitter coureur
  - Default top 3 (P1/P2/P3)
  - Worden automatisch ingevuld bij nieuw raceweekend als de gebruiker (nog) niks heeft ingevuld

- [ ] **Driver list endpoint**
  - API route `/api/drivers` — haalt coureurs + teams op via Jolpica
  - Cache resultaat voor 24 uur
  - Fallback: statische JSON met 2026 grid als API niet beschikbaar is

- [ ] **Puntenberekening**
  - API route `/api/game/calculate` (admin-only)
  - Haalt werkelijke uitslag op via Jolpica API
  - Berekent punten per gebruiker (inclusief default fallback)
  - Slaat op in `game_scores` tabel
  - Aparte berekening voor sprint en hoofdrace

---

## Database Schema

```sql
CREATE TABLE predictions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  season int NOT NULL,
  round int NOT NULL,
  session_type text NOT NULL, -- 'qualifying', 'race', 'sprint_qualifying', 'sprint'
  pole_driver_id text,        -- alleen voor qualifying/sprint_qualifying
  p1_driver_id text,
  p2_driver_id text,
  p3_driver_id text,
  is_default boolean DEFAULT false, -- true indien via default coureurs ingevuld
  submitted_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, season, round, session_type)
);

CREATE TABLE game_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  season int NOT NULL,
  round int NOT NULL,
  session_type text NOT NULL, -- 'race' of 'sprint'
  pole_points int DEFAULT 0,
  p1_points int DEFAULT 0,
  p2_points int DEFAULT 0,
  p3_points int DEFAULT 0,
  bonus_points int DEFAULT 0,
  total_points int DEFAULT 0,
  calculated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, season, round, session_type)
);

-- Default driver preferences per user
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_pole_driver text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_p1_driver text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_p2_driver text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_p3_driver text;

-- RLS Policies
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Predictions: eigen predictions altijd leesbaar, anderen pas na sessie
CREATE POLICY "Own predictions always readable"
  ON predictions FOR SELECT
  USING (user_id = auth.uid());

-- Andere predictions zichtbaar zodra de sessie is gestart
-- (lock check wordt client-side gedaan op basis van sessietijden)
-- Server-side: alle predictions leesbaar, client filtert op sessie-status
CREATE POLICY "All predictions readable"
  ON predictions FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own predictions"
  ON predictions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own predictions"
  ON predictions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Scores readable by all"
  ON game_scores FOR SELECT USING (true);
```

---

## Lock Mechanisme

De lock is **server-side gevalideerd**:
1. Client haalt sessietijden op via Jolpica API (FP1, Quali, Sprint, Race starttijden)
2. Client toont countdown en blokkeert invullen na deadline
3. **Server verificeert** bij elke insert/update of de sessie nog niet gestart is
4. Dit voorkomt manipulatie via dev tools

```typescript
// Server-side lock check (in API route)
function isSessionLocked(sessionStartTime: string): boolean {
  return new Date() >= new Date(sessionStartTime);
}
```

---

## Drag & Drop Prediction UX

De kern van de prediction-ervaring is een visueel aantrekkelijke **drag & drop** interface:

### Layout

```
┌─────────────────────────────────────────────────┐
│  COUREURS POOL (scrollbaar grid)                │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ VER │ │ NOR │ │ LEC │ │ PIA │ │ HAM │ ...   │
│  │ RBR │ │ MCL │ │ FER │ │ MCL │ │ FER │       │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
└─────────────────────────────────────────────────┘
            │ drag ↓
┌──────────────────────────────────────────────────┐
│  DROP ZONES                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ 🏁 POLE    │ │  P1  (25)  │ │  P2  (18)  │   │
│  │            │ │            │ │            │   │
│  │  Drop hier │ │  Drop hier │ │  Drop hier │   │
│  └────────────┘ └────────────┘ └────────────┘   │
│                 ┌────────────┐                   │
│                 │  P3  (15)  │                   │
│                 │  Drop hier │                   │
│                 └────────────┘                   │
└──────────────────────────────────────────────────┘
```

### Visuele Details

- **Coureur kaartjes** (pool):
  - Teamkleur als linkerborder (4px)
  - Coureur afkorting + team naam
  - Kleine portretfoto
  - Glassmorphism achtergrond
  - Hover: licht oplichten + schaal 1.05
  - Tijdens drag: schaduw + opacity 0.8 + rotatie

- **Drop zones**:
  - Lege state: gestippelde border, subtiel pulserende glow
  - Hover (met kaart erboven): border wordt F1-rood, achtergrond gloeit
  - Gevuld: teamkleur accent, coureur naam groot, punten indicator
  - Slot (locked): donkerder, slot-icoontje, geen interactie
  - Pole zone is groter/prominenter dan P1-P3

- **Animaties**:
  - Kaart droppen: satisfying snap-animatie met korte bounce
  - Kaart verwijderen uit zone: kaart vliegt terug naar pool
  - Lock countdown: zone border pulseert sneller naarmate deadline nadert

- **Mobile**: tap om coureur te selecteren → tap op zone om te plaatsen (geen drag op mobile)

---

## Componenten

| Component | Beschrijving |
|-----------|-------------|
| `WeekendProgressBar.tsx` | Voortgangsblokken per sessie met punten en status |
| `PredictionBoard.tsx` | Drag & drop container met driver pool en drop zones |
| `DriverCard.tsx` | Draggable coureur kaartje met teamkleur, foto, naam |
| `DropZone.tsx` | Drop target voor pole/P1/P2/P3 met visuele states |
| `PredictionLockTimer.tsx` | Countdown tot lock + visuele indicator per sessie |
| `GameLeaderboard.tsx` | Seizoensranking tabel met punten en trends |
| `GamePointsChart.tsx` | Recharts grafiek: puntenverloop per ronde |
| `PredictionReview.tsx` | Eigen + andere predictions na afloop (read-only) |
| `DefaultDriverSettings.tsx` | Profiel-sectie voor standaard coureur keuzes |

---

## Design

- **Progress bar**: glassmorphism blokken, gloeiend rood voor actieve sessie, donker met punten voor afgerond
- **Prediction kaarten**: F1-thema met teamkleur accent per geselecteerde coureur
- **Lock-indicator**: rood knipperend voor bijna-locked, groen voor open, slot-icoontje voor locked
- **Leaderboard**: glassmorphism tabel, goud/zilver/brons iconen voor top 3
- **Driver picker**: zoekbaar, met coureur foto, team logo en teamkleur border
- **"Scores worden berekend"**: subtiele loading animatie wanneer race voorbij is maar uitslag nog niet verwerkt
