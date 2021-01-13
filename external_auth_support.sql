\c grubby 

ALTER TABLE favorites DROP CONSTRAINT favorites_username_fkey;
ALTER TABLE emoji DROP CONSTRAINT emoji_username_fkey;

ALTER TABLE users
  DROP CONSTRAINT users_pkey;

ALTER TABLE users ADD COLUMN id SERIAL PRIMARY KEY;
ALTER TABLE users ADD PRIMARY KEY (id);
ALTER TABLE users ADD COLUMN external_login BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN display_name TEXT UNIQUE;

ALTER TABLE users ADD CONSTRAINT unique_username UNIQUE (username);

ALTER TABLE favorites ADD CONSTRAINT favorites_username_fkey FOREIGN KEY (username) REFERENCES users (username) ON DELETE CASCADE;
ALTER TABLE emoji ADD CONSTRAINT emoji_username_fkey FOREIGN KEY (username) REFERENCES users (username) ON DELETE CASCADE;

ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

DROP TABLE IF EXISTS external_auth_provider;


CREATE TABLE external_auth_provider (
    id SERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE user_external_login 
(
    id SERIAL PRIMARY KEY,
    user_account_id INT REFERENCES users(id) ON DELETE CASCADE,
    external_auth_provider_id INTEGER REFERENCES external_auth_provider(id) ON DELETE CASCADE,
    external_user_id VARCHAR(255),
    email VARCHAR(30)
);

INSERT INTO external_auth_provider (name) VALUES ('Google');

-- UPDATE users SET display_name = username;
