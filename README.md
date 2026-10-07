# Nirapod-Poth

## Incident report API

- `POST /api/reports` creates a report. Send `incidentType`, `location`, and
  `description`; optional `latitude` and `longitude` must be supplied together.
- `GET /api/reports/nearby?latitude=<lat>&longitude=<lng>&radiusKm=<km>` lists
  geolocated reports within the requested radius (5 km by default; maximum 100 km).
- `GET /api/reports` lists the latest reports.
- `POST /api/reports/:reportId/vote` accepts
  `{ "voterId": "<stable-client-id>", "vote": "upvote" | "downvote" }`.
  A voter has one current vote per report; repeating the same vote is idempotent
  and choosing the other value changes that vote. Responses include `upvotes`,
  `downvotes`, `score`, and (for the voting request) `userVote`.

The current auth routes do not provide an authenticated user identity, so the
vote API accepts a client-supplied stable `voterId`. Once authentication is
available, it should be taken from the authenticated user instead.