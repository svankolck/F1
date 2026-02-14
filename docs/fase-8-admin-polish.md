# Fase 8 — Admin + Polish

> **Status:** Te doen  
> **Geschatte duur:** Week 11–12

---

## Doel

Admin dashboard voor beheer en finale optimalisatie, testing en deployment.

## Taken

### Admin Dashboard

- [ ] **Admin pagina** (`/admin`) — alleen voor admins
  - Dashboard overzicht:
    - Totaal actieve gebruikers
    - Actief game-seizoen
    - Laatste race + volgende race
    - Recente registraties
  - **User management** (`/admin/users`)
    - Tabel met alle gebruikers
    - Zoeken op username/email
    - Activeer/deactiveer accounts
    - Verwijder accounts
    - Bekijk game-statistieken per gebruiker
  - **Game management** (`/admin/game`)
    - Seizoen openen/sluiten
    - Punten herberekenen voor specifieke ronde
    - Preview puntenberekening vóór publicatie
    - Export ranglijst als CSV

### Polish & Optimalisatie

- [ ] **Performance**
  - Lighthouse audit (target: 90+ op alle metrics)
  - Image optimization (Next.js `<Image>`, WebP, lazy loading)
  - Code splitting per route
  - API response caching strategie reviewen
  - Bundle size analyse (`@next/bundle-analyzer`)
- [ ] **Mobile polish**
  - Touch targets minimaal 44×44px
  - Haptic feedback op interacties (waar ondersteund)
  - Pull-to-refresh op live timing
  - Landscape modus voor timing tabel
  - Safe area's voor notch/eiland devices
  - PWA manifest + service worker voor offline fallback
- [ ] **SEO & Accessibility**
  - Meta tags per pagina (dynamische titles)
  - Open Graph images per race
  - Semantic HTML audit
  - Keyboard navigatie testen
  - ARIA labels op interactieve elementen
  - Color contrast checken (WCAG AA)
- [ ] **Testing**
  - Unit tests: puntenberekening, timezone conversie
  - Integration tests: API wrappers met mocked responses
  - E2E tests: registratie flow, prediction flow
  - Cross-browser testing (Chrome, Safari, Firefox)
- [ ] **Deployment**
  - Vercel project configureren
  - Environment variables instellen (Supabase keys)
  - Custom domein koppelen (optioneel)
  - Preview deploys per branch
  - Monitoring & error tracking opzetten

## Database (Admin)

```sql
-- Admin role check
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user';

-- Admin-only policies
CREATE POLICY "Admins can view all users"
  ON profiles FOR SELECT
  USING (is_admin() OR id = auth.uid());

CREATE POLICY "Admins can update any user"
  ON profiles FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete users"
  ON profiles FOR DELETE
  USING (is_admin());
```

## Componenten

| Component | Beschrijving |
|-----------|-------------|
| `AdminLayout.tsx` | Admin-specifieke layout met sidebar |
| `AdminDashboard.tsx` | Overzicht met statistieken |
| `UserTable.tsx` | Zoekbare user management tabel |
| `GameAdmin.tsx` | Seizoen- en puntenbeheer |
| `AdminGuard.tsx` | Route-bescherming voor admin-only |

## Checklist Finale Review

- [ ] Alle pagina's laadden binnen 3 seconden op 3G
- [ ] Geen console errors in productie
- [ ] Favicon en PWA iconen ingesteld
- [ ] 404 pagina ontworpen
- [ ] Loading states op alle data-afhankelijke views
- [ ] Error boundaries op kritieke componenten
- [ ] Rate limiting op API routes
- [ ] CORS configuratie geverifieerd
- [ ] Supabase RLS policies getestt
- [ ] Backup strategie voor database
