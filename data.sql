DROP DATABASE IF EXISTS grubby;

CREATE DATABASE grubby;

\c grubby

CREATE TABLE characters
(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE comics
(
    id SERIAL PRIMARY KEY,
    comic_id INT NOT NULL UNIQUE,
    description TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    hash TEXT NOT NULL UNIQUE,
    date_posted TIMESTAMP DEFAULT NOW(),
    vector tsvector NOT NULL
);

CREATE TABLE characters_comics
        (
            character_id INT REFERENCES characters(id) ON DELETE CASCADE,
            comic_id INTEGER REFERENCES comics(id) ON DELETE CASCADE,
            PRIMARY KEY (character_id, comic_id)
        );

    CREATE TABLE users
    (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE
    );



CREATE TABLE favorites
    (
        username TEXT REFERENCES users(username) ON DELETE CASCADE,
        comic_id INT REFERENCES comics(comic_id) ON DELETE CASCADE,
        PRIMARY KEY (username, comic_id)
    );

-- CREATE TYPE reaction AS ENUM ('Laughing', 'Clapping', 'ROFL', 'Grinning', 'Clown');

CREATE TABLE emoji
(
    username TEXT REFERENCES users(username) ON DELETE CASCADE,
    comic_id INT REFERENCES comics(comic_id) ON DELETE CASCADE,
    reaction TEXT NOT NULL
);

CREATE TABLE user_emoji
(
    id TEXT REFERENCES users(username) ON DELETE CASCADE,
    comic_id INT REFERENCES comics(comic_id) ON DELETE CASCADE,
    reaction TEXT NOT NULL
);




INSERT INTO characters (name) VALUES ('Grubby'), ('Richard'), ('Dennis');

INSERT INTO users (username, password, email, is_admin) VALUES ('Cory','$2b$12$ayNgksMQ/Z6elK7xpQfEk.KboypDLbKTzhkEe0WAiVYBXug8dECqK','cory@corymutchler.com', true);

-- INSERT INTO comics(comic_id, description, name, hash, vector) VALUES (1, 'Grubby makes a small business', 'Grubby_1.jpg', '4a030cd2eb410b0f0b144ee2a3b96f4d', to_tsvector('english', 'Grubby makes a small business'));

-- INSERT INTO emoji (username, comic_id, reaction) VALUES ('Cory', 1, 'Laughing');
