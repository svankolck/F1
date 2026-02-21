# F1 App 2026 — Functionele Beheerhandleiding

Dit document is bedoeld voor functioneel beheerders van de F1 applicatie. Het beschrijft de periodieke beheertaken, handmatige acties rondom de voorspellingsgame, en veelvoorkomende troubleshoots.

---

## 📅 1. Periodieke Beheertaken (Seizoensafhankelijk)

### 1.1 Nieuw F1 Seizoen Starten
Voorafgaand aan elk nieuw F1 seizoen moeten een paar hardcoded variabelen in de codebase geüpdatet worden, omdat de externe API's pas data leveren ná de eerste live sessie.

1. **Rijders & Teams updaten:**  
   Bestand: `/lib/api/game.ts` → `FALLBACK_2026_DRIVERS`. Deze lijst met rijders wordt gebruikt zolang er geen live data in de API is.
2. **Kleuren & Logo's toevoegen:**  
   Bestand: `/lib/types/f1.ts` → Controleer `TEAM_COLORS`, `TEAM_LOGO_MAP` en `DRIVER_IMAGE_MAP` op nieuwe coureurs of teams die van naam veranderd zijn.

### 1.2 Nieuw F1 Weekend
De app haalt automatisch het huidige raceweekend op via de Jolpica API. Hier is normaal gesproken **geen handmatige beheeractie** voor nodig.

---

## 🎮 2. Voorspellingsgame (Game Management)

De Game draait deels automatisch (timelocks), maar de daadwerkelijke **puntenberekening moet handmatig door een beheerder gestart worden**.

### 2.1 Punten Berekenen na een Race/Sprint
1. Wacht tot de officiële uitslag van de sessie definitief is.
2. Roep als **applicatie back-end admin** het `/api/game/calculate` endpoint aan met de juiste parameters.
3. Dit vereist een valid sessie-token van een Supabase gebruiker met de `role = admin` ingesteld in de `profiles` tabel.

*Voorbeeld request (alleen toegestaan voor admins):*
```json
POST /api/game/calculate
{
  "season": "2026",
  "round": "1",
  "sessionType": "race"
}
```
Dit endpoint vult direct de `game_scores` tabel in Supabase, en het leaderboard wordt automatisch geüpdatet voor alle spelers. Na het scoren toont dit endpoint aan hoeveel spelers punten hebben gekregen (bijv. `"Scored 45 predictions"`).

### 2.2 Problemen met Voorspellingen
Als een gebruiker klaagt dat zijn/haar voorspelling "niet opgeslagen werd", is de meest voorkomende oorzaak dat zij geselecteerd  hebben *na* de deadline (de officiële starttijd van de sessie), of dat er een netwerkstoring was. Als de deadline verstreken is, klapt de UI dicht ("Session Locked") en weigert de backend via time-checks de update.

Spelers die een sessie vergeten in te vullen pakken automatisch terug op hun **Default Drivers** (ingesteld in hun Profiel). Dit gebeurt automatisch tijdens het triggeren van de puntenberekening. Er hoeft handmatig geen default-script afgetrapt te worden.

---

## 🌐 3. F1 API Troubleshoots

De app hangt sterk af van externe bronnen. Dit zijn de fallbacks en foutanalyses.

### 3.1 Live Timing (OpenF1 API) ligt plat of is leeg
- **Symptoom:** Gebruikers zien "Timing data currently not available" of de timing tabel blijft op "Replay modus" hangen tijdens een live race.
- **Root-cause:** OpenF1 heeft vertraging (~3 tot 5 minuten) of de OpenF1 service ligt plat.
- **Actie:** Geen beheeractie mogelijk behalve wachten. De app valt veilig terug zonder te crashen.

### 3.2 Race Uitslagen of Klassement(Jolpica API) update niet
- **Symptoom:** De race eindigde 30 minuten geleden, maar de uitslagpagina of kalender laat de race nog niet als "afgerond" zien.
- **Actie:** Jolpica (de backend) synchroniseert de Wikipedia/Ergast F1 tabellen en heeft af en toe vertraging. In de tussentijd moet de beheerder **wachten met het berekenen van de game-punten**; het calculate-endpoint trekt namelijk data in uit Jolpica om te bepalen wie er gewonnen heeft. Als de uitslag onbeslist is, scoort niemand P1 tot P3.

---

## 🛡️ 4. Beheerder Gebruikerstoegang (User Management)

### 4.1 Een profiel van naam wijzigen / verwijderen
User beheer gaat rechtstreeks via het **Supabase Dashboard**:
- Ga naar Supabase -> **Authentication -> Users**.
- Hierin staat het daadwerkelijke inlog-account (`auth.users`).
- Indien de User's weergave-naam beledigend of onjuist is, ga naar de `profiles` tabel, en overschrijf de kolom `username` of `first_name`. Pas de rij niet aan in `public_profiles` (dat is slechts een niet-aanpasbare View).

### 4.2 Beheerdersrechten uitdelen
Standaard krijgt iedereen bij het inloggen het profiel "user". Wil je iemand de rechten geven om de wedstrijdpunten te berekenen?
- Open Supabase -> Table Editor -> `profiles`.
- Zet de kolom `role` van de betreffende gebruiker om van `user` naar `admin`.

---

## 💾 5. Data Opschonen / Resetten

### 5.1 Testdata wissen voorafgaand aan het seizoen
Verwijder je test-voorspellingen en scores via de Supabase SQL Editor met:
```sql
DELETE FROM game_scores;
DELETE FROM predictions;
```
Dit verwijdert *niet* hun gebruikersaccounts, maar maakt het scorebord succesvol helemaal leeg. Dit dient eenmalig te gebeuren vóór de openingsrace in maart.
