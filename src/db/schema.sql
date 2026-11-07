-- Auth.js (@auth/pg-adapter) tables
CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT, access_token TEXT, expires_at BIGINT,
  id_token TEXT, scope TEXT, session_state TEXT, token_type TEXT,
  PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL,
  PRIMARY KEY (id)
);
CREATE TABLE IF NOT EXISTS users (
  id SERIAL,
  name VARCHAR(255),
  email VARCHAR(255),
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  PRIMARY KEY (id)
);

-- Optional account sync: one row per app + key (flows, decks, heatmaps, notes, invoice templates, paste history)
CREATE TABLE IF NOT EXISTS user_state (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, app, key)
);

-- Email and password sign-in. Only a salted scrypt hash is stored.
CREATE TABLE IF NOT EXISTS credentials (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower ON users (lower(email));
