# US-10 Safe Places QA

## T-10.1
- [ ] Seed script inserts >= 50 places
- [ ] Categories present: police, hospital, pharmacy, shelter
- [ ] Data source doc exists (backend/docs/safe-places-data-source.md)

## T-10.2
- [ ] GET /api/safe-places returns list
- [ ] ?category=police filters correctly
- [ ] After network restore, list refreshes
- [ ] Offline: cached list still shows in UI

## T-10.3
- [ ] List view shows places
- [ ] Map markers visible for places with coordinates
- [ ] Category filter chips work
- [ ] Navigate opens Google Maps / native maps
- [ ] Empty state when no results

## T-10.4 evidence
- [ ] Screenshot: list + filter
- [ ] Screenshot: map markers
- [ ] Note: offline cache test (DevTools → Network → Offline)  