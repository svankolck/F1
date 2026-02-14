# Fase 1 — Foundation + Home Page ✅

> **Status:** Afgerond  
> **Geschatte duur:** Week 1–2

---

## Doel

Basis opzetten van de F1 #247 webapp: project scaffolding, design system, API-integratie en een volledig werkende Home page.

## Taken

- [x] Next.js 14 project opzetten (App Router, TypeScript, Tailwind CSS)
- [x] Dependencies installeren (Supabase, Recharts)
- [x] Design system opzetten
  - Dark theme (`#1a0a0a`), rode accent (`#e10600`)
  - Fonts: Space Grotesk (headings), JetBrains Mono (data)
  - Glassmorphism cards, grid-patronen, animaties
- [x] `BottomNav` component (6 tabs: Home, Timing, Standings, Results, Game, Login)
- [x] `Header` component met F1 #247 branding
- [x] Root `Layout` met header + navigatie
- [x] Jolpica API wrapper (`lib/api/jolpica.ts`)
  - Racekalender, standen, uitslagen, kwalificatie
  - ISR caching (revalidate: 300s)
- [x] OpenF1 API wrapper (`lib/api/openf1.ts`)
  - Sessies, rijders, posities, rondetijden, stints, pitstops
  - Polling cache (revalidate: 30s)
- [x] Home page
  - Countdown timer naar volgende race
  - Circuit info card met echte track SVG (Melbourne)
  - Sessie-schema (FP1, Quali, Race) in Amsterdam-tijd
  - Vorig jaar podium met rijderfoto's (F1 CDN)
  - "Full Race Results" button
- [x] Placeholder pagina's voor alle routes
- [x] Header branding verbetering (grotere tekst, uitlijning)
- [ ] Deploy naar Vercel (initieel)

## Technische Details

### API Endpoints (Jolpica)
```
GET /ergast/f1/current/next.json           → Volgende race
GET /ergast/f1/{seizoen}/circuits/{id}/results.json → Uitslagen per circuit
GET /ergast/f1/{seizoen}/driverstandings.json      → WK-stand
```

### Bestanden
| Bestand | Beschrijving |
|---------|-------------|
| `app/page.tsx` | Home page (server component) |
| `app/layout.tsx` | Root layout |
| `components/layout/Header.tsx` | Header met branding |
| `components/layout/BottomNav.tsx` | Bottom navigatie |
| `components/home/Countdown.tsx` | Client-side countdown timer |
| `components/home/PodiumCards.tsx` | Podium met rijderfoto's |
| `lib/api/jolpica.ts` | Jolpica API wrapper |
| `lib/api/openf1.ts` | OpenF1 API wrapper |
| `lib/types/f1.ts` | TypeScript types + helper functies |
| `public/tracks/melbourne.svg` | Circuit SVG (Albert Park) |

### Design Tokens
```css
--f1-bg: #1a0a0a
--f1-surface: #221010
--f1-red: #e10600
```
