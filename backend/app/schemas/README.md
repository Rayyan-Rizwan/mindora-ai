# Pydantic Schemas

Request/response validation models — separate from SQLAlchemy models in app/models/.
Naming convention: UserCreate, UserResponse, UserUpdate, etc.
Never expose password_hash or other sensitive fields in a *Response schema.
