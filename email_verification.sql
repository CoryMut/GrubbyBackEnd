\c grubby 

ALTER TABLE users ADD COLUMN verified BOOLEAN DEFAULT FALSE;

ALTER TABLE users ADD COLUMN email_token TEXT;

ALTER TABLE users ADD COLUMN email_token_expires TEXT;

ALTER TABLE users ADD COLUMN reset_token TEXT;

ALTER TABLE users ADD COLUMN reset_token_expires TEXT;