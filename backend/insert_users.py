import json
from datetime import datetime
from app.database import SessionLocal
from sqlalchemy import insert

# --- Models ---
from app.models.models import (
    UserAccount,
    UserProfile,
    PIN,
    CSR,
    Request,
    Category,
    request_shortlists,
)


# --- Utility Functions ---
def load_json(filename):
    with open(filename, "r", encoding="utf-8") as f:
        return json.load(f)


def parse_dt(value):
    """Best-effort datetime parser; returns None if empty/invalid."""
    if not value:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S",):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            pass
    try:
        return datetime.fromisoformat(value)
    except Exception:
        return None


# -----------------------------
# 🧩 IMPORTERS
# -----------------------------

def import_user_profiles(db):
    """Import user profile roles from user_profiles.json."""
    try:
        profiles = load_json("user_profiles.json")
    except FileNotFoundError:
        print("⚠️ user_profiles.json not found — will create default profiles.")
        profiles = [
            {"name": "PLATFORM", "status": "active"},
            {"name": "ADMIN", "status": "active"},
            {"name": "CSR", "status": "active"},
            {"name": "PIN", "status": "active"},
        ]

    created = 0
    for p in profiles:
        name = p.get("name")
        status = p.get("status", "active")

        if not name:
            continue

        existing = db.query(UserProfile).filter(UserProfile.name.ilike(name)).first()
        if existing:
            print(f"⚠️ Skipped existing profile: {name}")
            continue

        db.add(UserProfile(name=name, status=status))
        created += 1
        print(f"✅ Added profile: {name}")

    db.commit()
    print(f"🎉 user_profiles imported successfully! Added={created}")


def import_user_accounts(db):
    users = load_json("user_accounts.json")

    for u in users:
        last_login = parse_dt(u.get("last_login"))

        # Skip existing usernames
        if db.query(UserAccount).filter_by(username=u["username"]).first():
            print(f"⚠️ Skipped existing user: {u['username']}")
            continue

        # Match role by name (if exists)
        role_name = u.get("role")
        role_id = None
        if role_name:
            profile = db.query(UserProfile).filter(UserProfile.name.ilike(role_name)).first()
            if profile:
                role_id = profile.id
            else:
                print(f"⚠️ Role '{role_name}' not found, defaulting to None")

        new_user = UserAccount(
            username=u["username"],
            password=u["password"],
            email_address=u["email_address"],
            role=role_id,
            status=u.get("status", "active"),
            last_login=last_login,
        )
        db.add(new_user)
        print(f"✅ Added user: {u['username']}")

    db.commit()
    print("🎉 user_accounts imported successfully!")


def import_pins(db):
    pins = load_json("pins.json")
    for p in pins:
        db.add(PIN(pin_user_id=p["pin_user_id"], id=p["id"]))
        print(f"✅ Added PIN user: {p['pin_user_id']}")
    db.commit()
    print("🎉 pins imported successfully!")


def import_csrs(db):
    csrs = load_json("csrs.json")
    for c in csrs:
        db.add(CSR(csr_user_id=c["csr_user_id"], id=c["id"], company=c.get("company", "N/A")))
        print(f"✅ Added CSR user: {c['csr_user_id']}")
    db.commit()
    print("🎉 csrs imported successfully!")


def import_categories(db):
    """Load categories from JSON or dynamically from requests.json."""
    try:
        categories = load_json("categories.json")
    except FileNotFoundError:
        print("⚠️ categories.json not found — will create from requests instead.")
        categories = []

    if not categories:
        try:
            requests = load_json("pin_requests.json")
            categories = sorted({r.get("service_type") or r.get("type") or "Misc" for r in requests})
            categories = [{"name": c} for c in categories]
        except Exception:
            categories = [{"name": "Misc"}]

    for c in categories:
        name = (c.get("name") or "").strip()
        if not name:
            continue
        existing = db.query(Category).filter(Category.name.ilike(name)).first()
        if existing:
            print(f"⚠️ Skipped existing category: {name}")
            continue
        db.add(Category(name=name))
        print(f"✅ Added category: {name}")

    db.commit()
    print("🎉 categories imported successfully!")


def import_requests(db):
    rows = load_json("pin_requests.json")

    created = 0
    skipped_no_pin = 0
    skipped_no_csr = 0

    for r in rows:
        pin_user_id = r["pin_user_id"]

        # Ensure the PIN exists
        if not db.query(PIN).filter(PIN.pin_user_id == pin_user_id).first():
            print(f"⚠️ Skipped request (no matching PIN): pin_user_id={pin_user_id}")
            skipped_no_pin += 1
            continue

        assigned_to = r.get("assigned_to")
        if assigned_to is not None:
            csr_exists = db.query(CSR).filter(CSR.csr_user_id == assigned_to).first()
            if not csr_exists:
                print(f"⚠️ Skipped request (invalid CSR ID={assigned_to})")
                skipped_no_csr += 1
                continue

        title = r["title"].strip()
        description = (r.get("description") or "").strip() or None
        status = r.get("status", "pending")
        service_type = r.get("service_type") or r.get("type") or "Misc"

        # 🟩 Find or create category
        category = db.query(Category).filter(Category.name.ilike(service_type)).first()
        if not category:
            category = Category(name=service_type)
            db.add(category)
            db.commit()
            db.refresh(category)

        new_req = Request(
            pin_user_id=pin_user_id,
            title=title,
            description=description,
            status=status,
            assigned_to=assigned_to,
            completed_at=parse_dt(r.get("completed_at")),
            view=r.get("view", 0),
            category_id=category.id,
        )

        # Optional timestamps
        if ca := parse_dt(r.get("created_at")):
            new_req.created_at = ca
        if ua := parse_dt(r.get("updated_at")):
            new_req.updated_at = ua

        db.add(new_req)
        created += 1
        print(f"✅ Added request for PIN {pin_user_id}: {title} (category={category.name})")

    db.commit()
    print(f"🎉 requests imported successfully! Added={created}, skipped_no_pin={skipped_no_pin}, skipped_no_csr={skipped_no_csr}")


def import_request_shortlists(db):
    """Import CSR → Request shortlist relationships."""
    try:
        rows = load_json("request_shortlists.json")
    except FileNotFoundError:
        print("⚠️ request_shortlists.json not found — skipping import.")
        return

    created = 0
    skipped = 0

    for row in rows:
        csr_id = row.get("csr_user_id")
        req_id = row.get("request_id")

        if not csr_id or not req_id:
            skipped += 1
            continue

        # Check existence of CSR and Request
        csr_exists = db.query(CSR).filter(CSR.csr_user_id == csr_id).first()
        req_exists = db.query(Request).filter(Request.id == req_id).first()
        if not csr_exists or not req_exists:
            print(f"⚠️ Skipped shortlist link — invalid IDs (csr={csr_id}, request={req_id})")
            skipped += 1
            continue

        # Prevent duplicates
        existing = db.execute(
            request_shortlists.select().where(
                (request_shortlists.c.csr_user_id == csr_id)
                & (request_shortlists.c.request_id == req_id)
            )
        ).first()

        if existing:
            print(f"⚠️ Skipped existing shortlist: CSR {csr_id} → Request {req_id}")
            skipped += 1
            continue

        db.execute(
            insert(request_shortlists).values(
                csr_user_id=csr_id,
                request_id=req_id,
            )
        )
        created += 1
        print(f"✅ Linked CSR {csr_id} → Request {req_id}")

    db.commit()
    print(f"🎉 request_shortlists imported successfully! Added={created}, Skipped={skipped}")


def main():
    db = SessionLocal()
    try:
        # Order matters due to foreign keys
        import_user_profiles(db)
        import_user_accounts(db)
        import_pins(db)
        import_csrs(db)
        import_categories(db)
        import_requests(db)
        import_request_shortlists(db)
        print("\n✅ All data imported successfully!")
    except Exception as e:
        db.rollback()
        print("❌ Error during import:", e)
    finally:
        db.close()


if __name__ == "__main__":
    main()


# -- ==============================================================

# DROP TABLE IF EXISTS 
#     request_shortlists,
#     requests,
#     categories,
#     csrs,
#     pins,
#     user_accounts,
#     user_profiles
# CASCADE;

# CREATE TABLE user_profiles (
#     id SERIAL PRIMARY KEY,
#     name VARCHAR(100) UNIQUE NOT NULL,
#     status VARCHAR(20) NOT NULL DEFAULT 'active',
#     CONSTRAINT valid_profile_status CHECK (status IN ('active', 'suspended'))
# );

# CREATE TABLE user_accounts (
#     id SERIAL PRIMARY KEY,
#     username VARCHAR(50) UNIQUE NOT NULL,
#     password VARCHAR(100) NOT NULL,
#     email_address VARCHAR(100) UNIQUE NOT NULL,
#     role INTEGER REFERENCES user_profiles(id) ON DELETE SET NULL,
#     status VARCHAR(20) DEFAULT 'active',
#     last_login TIMESTAMP NULL
# );

# CREATE TABLE pins (
#     pin_user_id SERIAL PRIMARY KEY,
#     id INTEGER NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE
# );

# CREATE TABLE csrs (
#     csr_user_id SERIAL PRIMARY KEY,
#     id INTEGER NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
#     company VARCHAR(100) NOT NULL
# );

# CREATE TABLE categories (
#     id SERIAL PRIMARY KEY,
#     name VARCHAR(100) UNIQUE NOT NULL,
#     created_at TIMESTAMPTZ DEFAULT NOW(),
#     updated_at TIMESTAMPTZ DEFAULT NOW()
# );

# CREATE TABLE requests (
#     id SERIAL PRIMARY KEY,
#     pin_user_id INTEGER NOT NULL REFERENCES pins(pin_user_id) ON DELETE CASCADE,
#     title VARCHAR(255) NOT NULL,
#     description TEXT,
#     status VARCHAR(50) NOT NULL DEFAULT 'pending',
#     category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
#     assigned_to INTEGER REFERENCES csrs(csr_user_id) ON DELETE SET NULL,
#     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
#     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
#     completed_at TIMESTAMPTZ,
#     view INTEGER NOT NULL DEFAULT 0,
#     CONSTRAINT valid_status CHECK (status IN ('pending', 'assigned', 'completed'))
# );

# CREATE TABLE request_shortlists (
#     csr_user_id INTEGER NOT NULL REFERENCES csrs(csr_user_id) ON DELETE CASCADE,
#     request_id  INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
#     created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
#     PRIMARY KEY (csr_user_id, request_id)
# );