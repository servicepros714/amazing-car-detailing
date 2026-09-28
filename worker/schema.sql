-- Shared detailing bookings table (safe to run on an existing shared DB).
-- The Worker also creates this automatically on first non-payment request.
CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, date TEXT NOT NULL, time TEXT NOT NULL, service TEXT, name TEXT, phone TEXT, email TEXT, vehicle TEXT, address TEXT, notes TEXT, source TEXT, created_at TEXT, status TEXT, reschedule_date TEXT, reschedule_time TEXT, notes2 TEXT, original_date TEXT, original_time TEXT, payment_status TEXT);
