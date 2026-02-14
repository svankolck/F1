# Fase 7 — Prediction Game

> **Status:** Te doen  
> **Geschatte duur:** Week 9–10

---

## Doel

F1 voorspellingsspel waarbij gebruikers de pole-sitter en top 3 voorspellen per race, met een ranglijst en seizoensoverzicht.

## Taken

- [ ] **Game pagina** (`/game`) — alleen voor ingelogde gebruikers
  - Toggle: **Prediction** / **Stand**
  - **Prediction tab:**
    - Selecteer pole-sitter + P1/P2/P3 voor komend raceweekend
    - Dropdown/zoekbare lijst met alle rijders
    - Countdown timers:
      - Tot kwalificatie → daarna: pole prediction locked
      - Tot race start → daarna: top 3 prediction locked
    - Na kwalificatie: pole predictions van andere gebruikers zichtbaar
    - Na race: alle predictions zichtbaar + automatische puntenberekening
  - **Stand tab:**
    - Seizoensranking: username + totaal punten + aantal races
    - Puntengrafiek: puntenverloop per ronde (vergelijkbaar met Battle chart)
    - Gebruikers selecteerbaar voor vergelijking
    - Klik op gebruiker → detail: race-voor-race punten

## Puntenberekening

| Voorspelling | Punten |
|---|---|
| Pole position correct | 25 |
| P1 correct | 25 |
| P2 correct | 18 |
| P3 correct | 15 |
| Rijder wel in top 3 maar verkeerde plek | 10 |

**Maximum per race:** 25 (pole) + 25 (P1) + 18 (P2) + 15 (P3) = **83 punten**

## Database Schema

```sql
CREATE TABLE predictions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  season int NOT NULL,
  round int NOT NULL,
  pole_driver_id text,
  p1_driver_id text,
  p2_driver_id text,
  p3_driver_id text,
  submitted_at timestamp with time zone DEFAULT now(),
  locked_quali boolean DEFAULT false,
  locked_race boolean DEFAULT false,
  UNIQUE(user_id, season, round)
);

CREATE TABLE game_scores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  season int NOT NULL,
  round int NOT NULL,
  pole_points int DEFAULT 0,
  p1_points int DEFAULT 0,
  p2_points int DEFAULT 0,
  p3_points int DEFAULT 0,
  bonus_points int DEFAULT 0,
  total_points int DEFAULT 0,
  calculated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, season, round)
);

CREATE TABLE game_seasons (
  season int PRIMARY KEY,
  is_active boolean DEFAULT true,
  start_date timestamp with time zone,
  end_date timestamp with time zone
);

-- RLS Policies
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Users can read all predictions AFTER lock
CREATE POLICY "Predictions readable after lock"
  ON predictions FOR SELECT
  USING (locked_race = true OR user_id = auth.uid());

-- Users can only modify their own predictions before lock
CREATE POLICY "Users can insert own predictions"
  ON predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own unlocked predictions"
  ON predictions FOR UPDATE
  USING (auth.uid() = user_id AND locked_race = false);

-- Game scores readable by all
CREATE POLICY "Scores readable by all"
  ON game_scores FOR SELECT USING (true);
```

## Componenten

| Component | Beschrijving |
|-----------|-------------|
| `PredictionForm.tsx` | Formulier met driver-selectie voor pole + P1/P2/P3 |
| `DriverPicker.tsx` | Zoekbare dropdown met rijders + teamkleuren |
| `PredictionLockTimer.tsx` | Countdown tot lock + visuele indicator |
| `GameLeaderboard.tsx` | Ranglijst tabel met punten en trends |
| `GamePointsChart.tsx` | Recharts grafiek: puntenverloop per ronde |
| `PredictionReview.tsx` | Overzicht eigen + andere predictions na afloop |

## Automatische Puntenberekening

```typescript
// Triggered via Supabase Edge Function of API route na elke race
async function calculateGameScores(season: number, round: number) {
  // 1. Haal werkelijke uitslag op via Jolpica API
  // 2. Haal alle predictions op voor deze ronde
  // 3. Bereken punten per gebruiker
  // 4. Sla op in game_scores tabel
  // 5. Update Supabase Realtime → clients krijgen update
}
```

## Design

- Prediction form: kaarten per selectie (Pole, P1, P2, P3)
- Lock-indicator: rood knipperend voor bijna-locked, groen voor open
- Na lock: kaarten worden read-only met een slot-icoontje
- Leaderboard: glassmorphism tabel, goud/zilver/brons voor top 3
- Puntengrafiek: zelfde stijl als Battle chart
