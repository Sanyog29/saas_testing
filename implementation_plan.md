# Utilities Logging & Analytics v2 — Implementation Plan

## Overview
This plan implements the PRD for Utilities Logging & Analytics v2, covering Electricity and Diesel modules with explicit multiplier selection, automatic cost computation, and unified analytics.

---

## User Review Required

> [!IMPORTANT]
> **Breaking Changes**: This upgrade fundamentally changes the data model. Existing readings will need migration scripts to populate new fields like `multiplier_used`, `tariff_used`, and `computed_cost`.

> [!CAUTION]  
> **kWh Removed**: Per PRD, only **kVAh** is used. All UI and DB references to kWh will be removed.

---

## Proposed Changes

### Database Schema (Phase 1)

---

#### [NEW] `backend/db/migrations/utilities_v2_schema.sql`

New tables and modifications for the utilities v2 system:

**1. Meter Multipliers Table (Versioned)**
```sql
CREATE TABLE IF NOT EXISTS meter_multipliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id uuid NOT NULL REFERENCES electricity_meters(id) ON DELETE CASCADE,
  ct_ratio text NOT NULL,           -- e.g., "200/5"
  pt_ratio text NOT NULL,           -- e.g., "11kV/110V"  
  meter_constant numeric DEFAULT 1.0,
  multiplier_value numeric GENERATED ALWAYS AS (
    (CAST(SPLIT_PART(ct_ratio, '/', 1) AS numeric) / NULLIF(CAST(SPLIT_PART(ct_ratio, '/', 2) AS numeric), 0)) *
    (CAST(REPLACE(SPLIT_PART(pt_ratio, '/', 1), 'kV', '000') AS numeric) / NULLIF(CAST(REPLACE(SPLIT_PART(pt_ratio, '/', 2), 'V', '') AS numeric), 0)) *
    meter_constant
  ) STORED,
  effective_from date NOT NULL,
  effective_to date,                -- NULL = still active
  reason text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);
```

**2. Grid Tariff Table (Versioned)**
```sql
CREATE TABLE IF NOT EXISTS grid_tariffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  utility_provider text,
  rate_per_unit numeric NOT NULL,   -- ₹ per kVAh
  unit_type text DEFAULT 'kVAh',
  effective_from date NOT NULL,
  effective_to date,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);
```

**3. DG Cost Table (Versioned)**
```sql
CREATE TABLE IF NOT EXISTS dg_tariffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generator_id uuid NOT NULL REFERENCES diesel_generators(id) ON DELETE CASCADE,
  cost_per_unit numeric NOT NULL,   -- ₹ per litre
  effective_from date NOT NULL,
  effective_to date,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);
```

**4. Modify electricity_readings Table**
```sql
ALTER TABLE electricity_readings 
  ADD COLUMN IF NOT EXISTS multiplier_id uuid REFERENCES meter_multipliers(id),
  ADD COLUMN IF NOT EXISTS multiplier_value numeric,
  ADD COLUMN IF NOT EXISTS tariff_id uuid REFERENCES grid_tariffs(id),
  ADD COLUMN IF NOT EXISTS tariff_rate numeric,
  ADD COLUMN IF NOT EXISTS final_units numeric,
  ADD COLUMN IF NOT EXISTS computed_cost numeric,
  DROP COLUMN IF EXISTS peak_load_kw;
```

---

### Backend API (Phase 2)

---

#### [NEW] `app/api/properties/[propertyId]/meter-multipliers/route.ts`

CRUD for meter multipliers:
- `GET`: List all multipliers for a meter (optionally filter by date)
- `POST`: Create new multiplier version (never overwrite)

---

#### [NEW] `app/api/properties/[propertyId]/grid-tariffs/route.ts`

CRUD for grid tariffs:
- `GET`: List tariffs, get active tariff for date
- `POST`: Create new tariff version

---

#### [MODIFY] `app/api/properties/[propertyId]/electricity-readings/route.ts`

Update the POST handler to:
1. Require `multiplier_id` in request body
2. Fetch multiplier value and tariff rate
3. Compute `final_units = raw_units * multiplier_value`
4. Compute `computed_cost = final_units * tariff_rate`
5. Store all audit fields

---

#### [MODIFY] `app/api/properties/[propertyId]/diesel-readings/route.ts`

Update to include cost computation:
1. Fetch active DG tariff
2. Compute `computed_cost = units * cost_per_unit`
3. Store audit fields

---

### Frontend Components (Phase 3)

---

#### [MODIFY] `frontend/components/electricity/ElectricityLoggerCard.tsx`

Major changes per PRD:
1. **Remove** peak load input field
2. **Add** multiplier dropdown (explicit selection, mandatory)
3. **Add** computed cost display (read-only)
4. **Add** card flip animation for multiplier editing
5. Change labels from "kWh" to "kVAh"
6. Show **cost before units** in result box

---

#### [NEW] `frontend/components/electricity/MeterMultiplierEditor.tsx`

Card flip back-side component:
- CT Ratio input
- PT Ratio input  
- Meter Constant input
- Effective From date picker
- Reason (optional)
- Save/Cancel buttons

---

#### [MODIFY] `frontend/components/diesel/DieselLoggerCard.tsx`

Updates for parity:
1. **Add** computed cost display (read-only)
2. Show **cost before units** in result box
3. Match UI patterns with electricity

---

#### [NEW] `frontend/components/utilities/UtilitiesSummaryTile.tsx`

Unified summary tile component (reused across electricity/diesel):
```tsx
interface SummaryTileProps {
  title: string;              // "Electricity Summary" | "Diesel Summary"
  costIncurred: number;       // ₹ amount
  unitsConsumed: number;      // kVAh or Litres
  unitLabel: string;          // "kVAh" | "Units"
  todayUnits?: number;
  todayCost?: number;
  loggingDate?: Date;
}
```

---

#### [NEW] `frontend/components/utilities/UnifiedAnalyticsDashboard.tsx`

Single analytics page with:
1. **Summary Tile** (hero section)
2. **Time Toggle**: Today | Last 30 Days
3. **Scope Toggle**: Combined | Meter-wise
4. **Trends Graph** with toggle: Units (kVAh) | Cost (₹)
5. **Breakdown Table**
6. **Export Button** (finance-ready columns)

---

### Design System (Phase 4)

---

#### [MODIFY] `app/globals.css`

Add global energy tokens:
```css
:root {
  --energy-primary: #f97316;    /* Orange-500 */
  --energy-success: #22c55e;    /* Green-500 */
  --energy-warning: #eab308;    /* Yellow-500 */
  --energy-bg: #fff7ed;         /* Orange-50 */
  --energy-border: #ffedd5;     /* Orange-100 */
}

[data-theme="dark"] {
  --energy-primary: #fb923c;
  --energy-success: #4ade80;
  --energy-warning: #facc15;
  --energy-bg: #1c1917;
  --energy-border: #292524;
}
```

---

## Verification Plan

### Automated Tests
1. Run existing API tests: `npm run test:api`
2. Test multiplier CRUD operations
3. Verify cost computation accuracy
4. Test time-versioning (effective_from/to logic)

### Manual Verification
1. Create a meter with multiplier
2. Log a reading with explicit multiplier selection
3. Verify cost = units × tariff × multiplier
4. Edit multiplier via card flip
5. Confirm new version created (no overwrite)
6. Check analytics aggregation across meters
7. Export data and validate finance columns

---

## Implementation Order

| Phase | Component | Priority |
|-------|-----------|----------|
| 1 | Database migrations | Critical |
| 2 | Multiplier API | Critical |
| 3 | Tariff API | Critical |
| 4 | Electricity Logger v2 | High |
| 5 | Diesel Logger updates | High |
| 6 | Summary Tile component | Medium |
| 7 | Unified Analytics | Medium |
| 8 | Export functionality | Low |

---

## Files Summary

| Action | File |
|--------|------|
| NEW | `backend/db/migrations/utilities_v2_schema.sql` |
| NEW | `app/api/properties/[propertyId]/meter-multipliers/route.ts` |
| NEW | `app/api/properties/[propertyId]/grid-tariffs/route.ts` |
| NEW | `app/api/properties/[propertyId]/dg-tariffs/route.ts` |
| MODIFY | `app/api/properties/[propertyId]/electricity-readings/route.ts` |
| MODIFY | `app/api/properties/[propertyId]/diesel-readings/route.ts` |
| MODIFY | `frontend/components/electricity/ElectricityLoggerCard.tsx` |
| NEW | `frontend/components/electricity/MeterMultiplierEditor.tsx` |
| MODIFY | `frontend/components/diesel/DieselLoggerCard.tsx` |
| NEW | `frontend/components/utilities/UtilitiesSummaryTile.tsx` |
| NEW | `frontend/components/utilities/UnifiedAnalyticsDashboard.tsx` |
| MODIFY | `app/globals.css` |
