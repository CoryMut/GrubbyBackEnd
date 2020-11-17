DROP DATABASE IF EXISTS grubby;
DROP DATABASE IF EXISTS grubby_test;

CREATE DATABASE grubby;
CREATE DATABASE grubby_test;

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


INSERT INTO characters (name) VALUES ('Grubby'), ('Richard'), ('Dennis');

INSERT INTO users (username, password, email, is_admin) VALUES ('Cory','$2b$12$ayNgksMQ/Z6elK7xpQfEk.KboypDLbKTzhkEe0WAiVYBXug8dECqK','cory@corymutchler.com', true);

