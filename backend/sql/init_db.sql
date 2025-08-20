-- init_db.sql: create required tables for application

-- enable uuid extension (needed for uuid_generate_v4)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(100) NOT NULL,
  email varchar(150) NOT NULL UNIQUE,
  bio text NULL,
  password text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
