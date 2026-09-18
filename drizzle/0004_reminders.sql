-- Reminders Table
-- Stores birthday and anniversary reminders for gift suggestions

CREATE TYPE reminder_type AS ENUM ('birthday', 'anniversary');

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type reminder_type NOT NULL,
  reminder_date DATE NOT NULL,
  recipient_name VARCHAR(255),
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for better query performance
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_type ON reminders(type);
CREATE INDEX idx_reminders_date ON reminders(reminder_date);
CREATE INDEX idx_reminders_email_sent ON reminders(email_sent);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_reminders_updated_at();
