\c grubby 

CREATE TABLE email_tokens
(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email_token TEXT,
    email_token_expires TEXT
);

CREATE TABLE password_tokens
(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    password_token TEXT,
    password_token_expires TEXT
);