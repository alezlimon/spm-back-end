# API Contract Status - Frontend Integration

Last verified: 2026-04-05
Error contract DoD rollout date: 2026-04-05
Frontend fallback translation removal target: 2026-04-12

This document reflects the API contract that is actually implemented in the backend today.

## Environments and URLs

- Dev base URL: http://localhost:5005
- Allowed frontend origin in local .env: http://localhost:3000
- Staging URL: not defined in this repository
- Production URL: not defined in this repository
- API versioning: none today

## Routing base paths

- Resource routes use /api/...
- Auth routes are mounted on /auth/...
- Auth router is also available under /api/auth/... via index router

Recommended frontend usage now:
- Use /auth/... for auth
- Use /api/... for domain resources

## Swagger / OpenAPI / Postman

- Swagger / OpenAPI: not available today
- Postman collection: spm-api.postman_collection.json

## Error Contract (DoD)

Every non-2xx response returns this envelope:

{
  "message": "Birth date is required and must be a valid date (YYYY-MM-DD)",
  "errorCode": "GUEST_BIRTHDATE_INVALID",
  "details": [
    "birthDate is missing or invalid"
  ]
}

Status policy:
- 400 validation/input errors
- 401 authentication/session errors
- 403 forbidden actions (reserved for role rules)
- 404 not found
- 409 conflicts/duplicates
- 500 unexpected server errors

Stable errorCode catalog:
- ROUTE_NOT_FOUND
- AUTH_INVALID_TOKEN
- AUTH_SIGNUP_REQUIRED_FIELDS
- AUTH_EMAIL_INVALID
- AUTH_PASSWORD_WEAK
- AUTH_USER_ALREADY_EXISTS
- AUTH_LOGIN_REQUIRED_FIELDS
- AUTH_INVALID_CREDENTIALS
- VALIDATION_ERROR
- INVALID_INPUT
- DUPLICATE_RESOURCE
- INTERNAL_SERVER_ERROR
- PROPERTY_NOT_FOUND
- PROPERTY_ROOMS_NOT_FOUND
- ROOM_NOT_FOUND
- GUEST_BIRTHDATE_INVALID
- GUEST_SEARCH_QUERY_REQUIRED
- GUEST_NOT_FOUND
- GUEST_DUPLICATE
- BOOKING_NOT_FOUND
- BOOKING_ROOM_REQUIRED
- BOOKING_DATES_INVALID
- BOOKING_DATE_RANGE_INVALID
- BOOKING_GUEST_FIELDS_MISSING
- BOOKING_GUEST_BIRTHDATE_INVALID
- BOOKING_GUEST_REQUIRED

## Auth

Implemented:
- POST /auth/signup
- POST /auth/login
- GET /auth/verify

Not implemented:
- POST /auth/register
- GET /auth/me
- POST /auth/refresh
- POST /auth/logout

Token:
- JWT, HS256, expires in 6h
- Header: Authorization: Bearer <token>

Examples:
- 400 AUTH_SIGNUP_REQUIRED_FIELDS
- 400 AUTH_EMAIL_INVALID
- 400 AUTH_PASSWORD_WEAK
- 409 AUTH_USER_ALREADY_EXISTS
- 400 AUTH_LOGIN_REQUIRED_FIELDS
- 401 AUTH_INVALID_CREDENTIALS
- 401 AUTH_INVALID_TOKEN

## Guests

Implemented:
- GET /api/guests
- GET /api/guests/search?query=...
- POST /api/guests
- PUT /api/guests/:id
- DELETE /api/guests/:id

Not implemented:
- GET /api/guests/:id

Fields:
- Required: firstName, lastName, email, document, birthDate
- Optional: phone, nationality, notes

Duplicate behavior:
- POST /api/guests returns 409 with GUEST_DUPLICATE when email/document already exists

Examples:
- 400 GUEST_BIRTHDATE_INVALID
- 400 GUEST_SEARCH_QUERY_REQUIRED
- 404 GUEST_NOT_FOUND
- 409 GUEST_DUPLICATE
- 401 AUTH_INVALID_TOKEN on protected routes

## Bookings

Implemented:
- GET /api/bookings
- GET /api/bookings/:id
- POST /api/bookings
- PUT /api/bookings/:id/checkin
- PUT /api/bookings/:id/checkout
- PUT /api/bookings/:bookingId/assign-guest

Booking detail contract (sprint-frozen):
- GET /api/bookings/:id requires Authorization Bearer token
- On success, room and guest are populated with a stable minimal shape:
  - room: _id, roomNumber, type
  - guest: _id, firstName, lastName, email
- Not found returns 404 with BOOKING_NOT_FOUND envelope
- Missing/invalid token returns 401 with AUTH_INVALID_TOKEN envelope

Pricing snapshot in booking detail:
- Not included yet in current payload.
- Planned fields for next contract increment:
  - base
  - taxes
  - discounts
  - total
  - currency
- Current available pricing field: totalPrice

Not implemented:
- PUT /api/bookings/:id
- PATCH /api/bookings/:id
- DELETE /api/bookings/:id
- Filtered list endpoint by date/status/room/guest
- Cancel endpoint

Examples:
- 400 BOOKING_ROOM_REQUIRED
- 400 BOOKING_DATES_INVALID
- 400 BOOKING_DATE_RANGE_INVALID
- 400 BOOKING_GUEST_FIELDS_MISSING
- 400 BOOKING_GUEST_BIRTHDATE_INVALID
- 400 BOOKING_GUEST_REQUIRED
- 404 BOOKING_NOT_FOUND
- 404 ROOM_NOT_FOUND
- 404 GUEST_NOT_FOUND
- 401 AUTH_INVALID_TOKEN

## Properties and Rooms (read endpoints)

Properties implemented:
- GET /api/properties
- GET /api/properties/:propertyId
- GET /api/properties/:propertyId/rooms
- GET /api/properties/:propertyId/overview

Property errors:
- 404 PROPERTY_NOT_FOUND
- 404 PROPERTY_ROOMS_NOT_FOUND

Rooms implemented:
- GET /api/rooms
- GET /api/rooms/:id/bookings
- PATCH /api/rooms/:roomId/status

Room errors:
- 404 ROOM_NOT_FOUND

## QA Acceptance (executed)

Priority endpoints were tested with live requests for:
- one 400 case
- one 401 case
- one 404 or 409 case

Result:
- Envelope shape and language are aligned with DoD in covered flows.

## Backward Compatibility Window

- Error contract rollout date: 2026-04-05
- Frontend fallback translation removal target: 2026-04-12
- After this date, frontend should consume backend errors directly.

## Billing Display Contract Freeze

- Official timezone: UTC
- Currency: EUR
- Rounding rule: half-up, 2 decimals

Current implementation note:
- booking totalPrice is currently persisted as a Number and computed from room price and nights where totalPrice is not provided.
- full billing snapshot fields (base, taxes, discounts, total, currency) are planned but not yet returned in booking detail payload.

## Invoices Contract Freeze (MVP)

Frontend billing MVP request has been accepted as the frozen target contract.

Implementation status:
- Endpoints in this section are contract-frozen but not yet implemented in backend routes/models.
- Until implementation is live, frontend may keep temporary mock fallback.

### GET /api/invoices

Filters:
- propertyId
- status
- search
- optional from
- optional to

Response:
- array of invoices with:
  - id or _id
  - invoiceNumber
  - propertyId
  - bookingId
  - guestName or guest snapshot
  - currency
  - subtotal
  - taxes
  - discounts
  - total
  - amountPaid
  - balanceDue
  - status = draft, issued, partially_paid, paid, void, overdue
  - issuedAt
  - dueDate

### GET /api/invoices/:id

Response:
- full invoice detail
- payments array

### POST /api/invoices

Payload:
- propertyId
- bookingId optional
- guestName or guest snapshot
- subtotal
- taxes
- discounts
- dueDate

Backend rules:
- backend calculates and persists final totals
- backend persists audit-safe pricing snapshot in invoice record

### POST /api/invoices/:id/payments

Payload:
- amount
- method = card, cash, bank_transfer
- reference
- notes
- paidAt

Backend rules:
- backend recalculates amountPaid
- backend recalculates balanceDue
- backend recalculates final invoice status

### Global ownership and finance rules

- Currency: EUR
- Rounding: half-up, 2 decimals
- Timezone: UTC
- overdue status is backend-owned once this contract is live

## Integration Assets

- Postman collection: spm-api.postman_collection.json
- Seed command: node scripts/seed.js
- Demo users:
  - admin@hotel.com / Admin123!
  - staff@hotel.com / Staff123!

## Contract Stability

- Error contract for priority endpoints is frozen for current sprint.
- Remaining instability is on missing feature endpoints, not on error envelope shape.
