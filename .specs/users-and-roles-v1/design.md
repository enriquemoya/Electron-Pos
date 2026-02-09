# Design: Users and Roles v1

## High-level architecture
- Prisma model for users and roles.
- Cloud API admin routes for user CRUD.
- Validation layer for user input.
- Admin endpoints protected by existing secret middleware.

## Data model
User:
- id (uuid)
- email (nullable, unique)
- phone (nullable, unique)
- firstName (nullable)
- lastName (nullable)
- birthDate (nullable, date)
- role (enum: CUSTOMER, ADMIN)
- status (enum: ACTIVE, DISABLED)
- createdAt, updatedAt

Address:
- id (uuid)
- userId (fk)
- street
- externalNumber
- internalNumber (nullable)
- postalCode
- neighborhood
- city
- state
- country
- references (nullable)
- createdAt, updatedAt

## API contracts
Admin-only endpoints (protected):
- GET /admin/users
- GET /admin/users/:id
- POST /admin/users
- PATCH /admin/users/:id
- DELETE /admin/users/:id

Address management (admin-only):
- GET /admin/users/:id/addresses
- POST /admin/users/:id/addresses
- PATCH /admin/users/:id/addresses/:addressId
- DELETE /admin/users/:id/addresses/:addressId

List pagination:
- GET /admin/users?page=1&pageSize=25
- Response: { items, page, pageSize, total, hasMore }

Response shapes:
- GET /admin/users: { items: UserAdmin[], page, pageSize, total, hasMore }
- GET /admin/users/:id: { user: UserAdmin }
- POST /admin/users: { user: UserAdmin }
- PATCH /admin/users/:id: { user: UserAdmin }
- DELETE /admin/users/:id: { status: "disabled" }
- GET /admin/users/:id/addresses: { items: Address[] }
- POST /admin/users/:id/addresses: { address: Address }
- PATCH /admin/users/:id/addresses/:addressId: { address: Address }
- DELETE /admin/users/:id/addresses/:addressId: { status: "deleted" }

UserAdmin fields:
- id, email, phone, firstName, lastName, birthDate, role, status, createdAt, updatedAt

Address fields:
- id, userId, street, externalNumber, internalNumber, postalCode, neighborhood, city, state, country, references, createdAt, updatedAt

Response constraints:
- Only admin endpoints return user data.
- Public endpoints must not expose user PII.
- Admin responses may include user profile fields and address data.

## Validation
- email: basic format check when provided
- phone: basic format check when provided
- role/status: enum validation
- At least one of email or phone is required.
- Address requires street, externalNumber, postalCode, neighborhood, city, state, country.
- birthDate format: YYYY-MM-DD

## Error strings (must match exactly)
- unauthorized
- invalid request
- email required
- phone required
- email or phone required
- email invalid
- phone invalid
- role invalid
- status invalid
- email already exists
- phone already exists
- user not found
- address not found
- address invalid
- pagination invalid

## Error model
- Use existing Cloud API error response shape {"error":"..."}.
- Validation errors return 400 with specific error strings.

## Data access
- Use Prisma for all user CRUD operations.
- No raw SQL for user management.
- Addresses are related to users via Prisma relation.

## Edge cases
- Ensure uniqueness for email/phone when provided.
- Allow user records with email-only, phone-only, or both.
- Deleting user is a soft delete (status DISABLED), no hard delete.
- Address delete can be hard delete.
