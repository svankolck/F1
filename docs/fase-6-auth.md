# Fase 6 — Auth + Profile

> **Status:** Te doen  
> **Geschatte duur:** Week 8

---

## Doel

Gebruikersregistratie, login en profielbeheer via Supabase Auth met email-bevestiging.

## Taken

- [ ] **Supabase Auth configuratie**
  - Email + wachtwoord provider inschakelen
  - Bevestigingsmail template aanpassen (F1-thema)
  - Redirect URL's instellen (Vercel domeinen)
  - Row-Level Security (RLS) policies schrijven
- [ ] **Login pagina** (`/login`)
  - Login formulier: email + wachtwoord
  - Link naar registratie
  - "Wachtwoord vergeten" flow
  - Error handling (onjuist wachtwoord, account niet gevonden)
- [ ] **Registratie pagina** (`/login?mode=register`)
  - Velden: voornaam, achternaam, email, username, wachtwoord (2x)
  - Profielfoto upload (optioneel)
  - Checkbox: akkoord algemene voorwaarden
  - Validatie: wachtwoord minimaal 8 tekens, username uniek
  - Na registratie: bevestigingsmail verzonden → activatielink
  - Na activatie: automatisch ingelogd, redirect naar Home
- [ ] **Profiel pagina** (`/profile`) — beschermd
  - Profielfoto wijzigen (upload naar Supabase Storage)
  - Naam aanpassen
  - Username: **niet wijzigbaar** (read-only weergave)
  - Wachtwoord wijzigen
  - Account verwijderen (met bevestiging)
- [ ] **Beschermde routes**
  - Middleware: check auth-status bij `/profile`, `/game`, `/admin`
  - Redirect naar `/login` als niet ingelogd
- [ ] **Conditionele navigatie**
  - BottomNav: "Login" → "Profiel" als ingelogd
  - Game tab: alleen zichtbaar als ingelogd

## Componenten

| Component | Beschrijving |
|-----------|-------------|
| `LoginForm.tsx` | Email + wachtwoord login |
| `RegisterForm.tsx` | Registratie met validatie |
| `ProfileCard.tsx` | Profielweergave met edit-mogelijkheid |
| `AvatarUpload.tsx` | Drag-and-drop foto upload |
| `AuthProvider.tsx` | Context provider voor auth-state |

## Database Schema

```sql
-- Supabase Auth handles users table automatically
-- We extend with a profiles table

CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  username text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

## Supabase Client Setup

```typescript
// lib/supabase/client.ts (browser)
import { createBrowserClient } from '@supabase/ssr';

// lib/supabase/server.ts (Server Components)
import { createServerClient } from '@supabase/ssr';

// middleware.ts (route protection)
import { createServerClient } from '@supabase/ssr';
```

## Design

- Login/register: centraal op de pagina, glass-card styling
- Form inputs: donkere achtergrond, rode focus-border
- Error messages: rode tekst onder het veld
- Success states: groene checkmark animatie
- Profiel: kaart met grote avatar, bewerkbare velden
