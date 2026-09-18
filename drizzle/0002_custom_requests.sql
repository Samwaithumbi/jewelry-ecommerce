-- Custom Requests Table
-- Stores custom jewelry order requests from customers

CREATE TYPE custom_request_status AS ENUM (
  'pending',
  'reviewing',
  'quoted',
  'approved',
  'rejected',
  'completed'
);

CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  description TEXT NOT NULL,
  budget_min_cents INTEGER,
  budget_max_cents INTEGER,
  metal_preference VARCHAR(50),
  timeline VARCHAR(100),
  photo_urls JSONB DEFAULT '[]'::jsonb,
  status custom_request_status DEFAULT 'pending' NOT NULL,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for better query performance
CREATE INDEX idx_custom_requests_user_id ON custom_requests(user_id);
CREATE INDEX idx_custom_requests_status ON custom_requests(status);
CREATE INDEX idx_custom_requests_created_at ON custom_requests(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_custom_requests_updated_at
  BEFORE UPDATE ON custom_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_requests_updated_at();
