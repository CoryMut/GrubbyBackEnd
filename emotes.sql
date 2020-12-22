\c grubby

DROP TABLE IF EXISTS emoji;

CREATE TABLE emoji
(
    username TEXT REFERENCES users(username) ON DELETE CASCADE,
    comic_id INT REFERENCES comics(comic_id) ON DELETE CASCADE,
    reaction TEXT NOT NULL
);

INSERT INTO emoji (username, comic_id, reaction) VALUES ('Cory', 181, 'Laughing');
