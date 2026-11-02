# Safree — Database

_Version 0.1.0 · Generated 2026-05-30_

## Tables (24)
### `profiles`
```
id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
email         TEXT NOT NULL UNIQUE
full_name     TEXT
avatar_url    TEXT
role          user_role NOT NULL DEFAULT 'user'
email_verified BOOLEAN NOT NULL DEFAULT FALSE
phone         TEXT
bio           TEXT
created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `stores`
```
id                UUID PRIMARY KEY DEFAULT uuid_generate_v4()
owner_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
name              TEXT NOT NULL
slug              TEXT NOT NULL UNIQUE
description       TEXT
subtype           store_subtype NOT NULL DEFAULT 'store'
logo_url          TEXT
banner_url        TEXT
location_state    TEXT
location_city     TEXT
location_coords   GEOGRAPHY(POINT, 4326)
stripe_account_id TEXT
is_verified       BOOLEAN NOT NULL DEFAULT FALSE
is_active         BOOLEAN NOT NULL DEFAULT TRUE
created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `categories`
```
id         UUID PRIMARY KEY DEFAULT uuid_generate_v4()
name       TEXT NOT NULL
slug       TEXT NOT NULL UNIQUE
parent_id  UUID REFERENCES categories(id) ON DELETE SET NULL
type       TEXT NOT NULL CHECK (type IN ('product', 'experience'))
icon_url   TEXT
sort_order INTEGER NOT NULL DEFAULT 0
```

### `species`
```
id        UUID PRIMARY KEY DEFAULT uuid_generate_v4()
name      TEXT NOT NULL
slug      TEXT NOT NULL UNIQUE
type      TEXT NOT NULL CHECK (type IN ('game', 'fish', 'bird'))
image_url TEXT
```

### `products`
```
id               UUID PRIMARY KEY DEFAULT uuid_generate_v4()
store_id         UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE
category_id      UUID REFERENCES categories(id) ON DELETE SET NULL
title            TEXT NOT NULL
description      TEXT
price            NUMERIC(10, 2) NOT NULL
compare_at_price NUMERIC(10, 2)
images           TEXT[] NOT NULL DEFAULT '{}'
stock            INTEGER NOT NULL DEFAULT 0
sku              TEXT
status           listing_status NOT NULL DEFAULT 'pending'
species_ids      UUID[] NOT NULL DEFAULT '{}'
created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `experiences`
```
id               UUID PRIMARY KEY DEFAULT uuid_generate_v4()
store_id         UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE
category_id      UUID REFERENCES categories(id) ON DELETE SET NULL
title            TEXT NOT NULL
description      TEXT
price_per_person NUMERIC(10, 2) NOT NULL
max_guests       INTEGER NOT NULL DEFAULT 1
images           TEXT[] NOT NULL DEFAULT '{}'
location_name    TEXT
location_state   TEXT
location_coords  GEOGRAPHY(POINT, 4326)
duration_days    INTEGER
status           listing_status NOT NULL DEFAULT 'pending'
species_ids      UUID[] NOT NULL DEFAULT '{}'
amenities        TEXT[] NOT NULL DEFAULT '{}'
created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `availability`
```
id            UUID PRIMARY KEY DEFAULT uuid_generate_v4()
experience_id UUID NOT NULL REFERENCES experiences(id) ON DELETE CASCADE
date          DATE NOT NULL
slots         INTEGER NOT NULL DEFAULT 0
is_blocked    BOOLEAN NOT NULL DEFAULT FALSE
created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `cart_items`
```
id         UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE
quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0)
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
UNIQUE (user_id, product_id)
```

### `orders`
```
id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT
store_id                UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT
items                   JSONB NOT NULL DEFAULT '[]'
subtotal                NUMERIC(10, 2) NOT NULL
tax                     NUMERIC(10, 2) NOT NULL DEFAULT 0
total                   NUMERIC(10, 2) NOT NULL
status                  order_status NOT NULL DEFAULT 'pending'
stripe_payment_intent_id TEXT
shipping_address        JSONB
tracking_number         TEXT
created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `bookings`
```
id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT
experience_id           UUID NOT NULL REFERENCES experiences(id) ON DELETE RESTRICT
store_id                UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT
guests                  INTEGER NOT NULL DEFAULT 1
start_date              DATE NOT NULL
end_date                DATE NOT NULL
total                   NUMERIC(10, 2) NOT NULL
status                  booking_status NOT NULL DEFAULT 'pending'
stripe_payment_intent_id TEXT
special_requests        TEXT
created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `disputes`
```
id                UUID PRIMARY KEY DEFAULT uuid_generate_v4()
ref_type          dispute_ref_type NOT NULL
ref_id            UUID NOT NULL
opened_by_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT
store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT
reason            TEXT NOT NULL
status            dispute_status NOT NULL DEFAULT 'open'
resolution_note   TEXT
resolved_at       TIMESTAMPTZ
created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `reviews`
```
id         UUID PRIMARY KEY DEFAULT uuid_generate_v4()
ref_type   dispute_ref_type NOT NULL
ref_id     UUID NOT NULL
user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5)
body       TEXT
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
UNIQUE (ref_type, ref_id, user_id)
```

### `integration_keys`
```
id            UUID PRIMARY KEY DEFAULT uuid_generate_v4()
service       TEXT NOT NULL UNIQUE
key_encrypted TEXT NOT NULL
created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `audit_log`
```
id          UUID PRIMARY KEY DEFAULT uuid_generate_v4()
actor_id    UUID NOT NULL
actor_role  user_role NOT NULL
action      TEXT NOT NULL
target_type TEXT NOT NULL
target_id   UUID
metadata    JSONB
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `notifications`
```
id         UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
type       notification_type NOT NULL
title      TEXT NOT NULL
body       TEXT
ref_type   TEXT
ref_id     UUID
is_read    BOOLEAN NOT NULL DEFAULT FALSE
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `product_specs`
```
id         UUID PRIMARY KEY DEFAULT uuid_generate_v4()
product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE
key        TEXT NOT NULL
value      TEXT NOT NULL
sort_order INTEGER NOT NULL DEFAULT 0
```

### `product_qa`
```
id           UUID PRIMARY KEY DEFAULT uuid_generate_v4()
product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE
asked_by     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
question     TEXT NOT NULL
answer       TEXT
answered_by  UUID REFERENCES profiles(id) ON DELETE SET NULL
answered_at  TIMESTAMPTZ
created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `saved_items`
```
id         UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
UNIQUE (user_id, product_id)
```

### `shipping_addresses`
```
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
full_name  text NOT NULL
line1      text NOT NULL
line2      text
city       text NOT NULL
state      text NOT NULL
zip        text NOT NULL
country    text NOT NULL DEFAULT 'US'
is_default boolean NOT NULL DEFAULT false
created_at timestamptz NOT NULL DEFAULT now()
```

### `shipping_rates`
```
id                 uuid PRIMARY KEY DEFAULT gen_random_uuid()
name               text NOT NULL
description        text
price              numeric(10,2) NOT NULL
estimated_days_min int NOT NULL DEFAULT 5
estimated_days_max int NOT NULL DEFAULT 7
is_active          boolean NOT NULL DEFAULT true
sort_order         int NOT NULL DEFAULT 0
created_at         timestamptz NOT NULL DEFAULT now()
```

### `content_flags`
```
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
ref_type      TEXT NOT NULL CHECK (ref_type IN ('product', 'experience', 'review'))
ref_id        UUID NOT NULL
reported_by   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
reason        TEXT NOT NULL
details       TEXT
status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'removed', 'escalated'))
resolved_by   UUID REFERENCES profiles(id) ON DELETE SET NULL
resolved_at   TIMESTAMPTZ
created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `prohibited_keywords`
```
id         UUID PRIMARY KEY DEFAULT gen_random_uuid()
keyword    TEXT NOT NULL UNIQUE
category   TEXT NOT NULL CHECK (category IN ('firearm', 'cites_species', 'hate_speech', 'other'))
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `hero_slides`
```
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
image_url   TEXT NOT NULL
headline    TEXT NOT NULL
subtext     TEXT
cta_text    TEXT
cta_url     TEXT
sort_order  INTEGER NOT NULL DEFAULT 0
is_active   BOOLEAN NOT NULL DEFAULT TRUE
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### `featured_content`
```
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
section     TEXT NOT NULL CHECK (section IN ('most_notable', 'featured_grounds', 'featured_deals'))
ref_type    TEXT NOT NULL CHECK (ref_type IN ('product', 'experience'))
ref_id      UUID NOT NULL
sale_price  NUMERIC(10, 2)
sort_order  INTEGER NOT NULL DEFAULT 0
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
UNIQUE (section, ref_id)
```

## ENUM Types
- **user_role**: admin, moderator, store, user
- **store_subtype**: store, coto
- **listing_status**: pending, active, rejected, archived
- **order_status**: pending, paid, shipped, delivered, disputed, refunded, cancelled
- **booking_status**: pending, confirmed, completed, disputed, refunded, cancelled
- **dispute_status**: open, under_review, resolved_refund, resolved_no_refund, closed
- **dispute_ref_type**: order, booking
- **notification_type**: listing_approved, listing_rejected, new_order, new_booking, dispute_opened, dispute_resolved, funds_released, verification_approved, review_received

## Indexes (34)
| Index | Table |
|---|---|
| products_search_idx | products |
| experiences_search_idx | experiences |
| idx_products_status | products |
| idx_products_store | products |
| idx_products_category | products |
| idx_products_status_created | products |
| idx_products_featured | products |
| idx_experiences_status | experiences |
| idx_experiences_store | experiences |
| idx_experiences_type | experiences |
| idx_experiences_state | experiences |
| idx_experiences_coords | experiences |
| idx_orders_user | orders |
| idx_orders_store | orders |
| idx_orders_status | orders |
| idx_orders_pi | orders |
| idx_bookings_user | bookings |
| idx_bookings_experience | bookings |
| idx_bookings_store | bookings |
| idx_bookings_status | bookings |
| idx_bookings_release | bookings |
| idx_availability_exp_date | availability |
| idx_disputes_status | disputes |
| idx_disputes_store | disputes |
| idx_disputes_opened_by | disputes |
| idx_disputes_ref | disputes |
| idx_reviews_store | reviews |
| idx_reviews_ref | reviews |
| idx_notifications_user | notifications |
| idx_notifications_unread | notifications |
| idx_cart_user | cart_items |
| idx_content_flags_status | content_flags |
| idx_audit_created | audit_log |
| idx_audit_action | audit_log |

## RLS
Row Level Security is enabled on all tables. Policies are defined in
`supabase/rls-policies/`. Highlights:
- Users read/write only their own rows (orders, bookings, cart, reviews, disputes).
- Stores/Cotos scope to rows for their own store.
- `integration_keys` and `audit_log` are service-role only (no client policies).
- Public read is limited to `status = 'active'` listings.
The RLS audit (`scripts/rls-audit.mjs`) verifies these on every deploy.

## PostGIS
Enabled. `experiences.location_coords` is `GEOGRAPHY(POINT,4326)` with a GIST index. Map discovery uses `ST_MakeEnvelope` (bounds) and `ST_Distance` (nearby) via the `experiences_in_bounds` / `experiences_near_point` functions.

