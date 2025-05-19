-- Schema migration from SQLite to D1
PRAGMA foreign_keys = OFF;

CREATE TABLE movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    year INTEGER,
    href TEXT,
    extract TEXT,
    thumbnail TEXT,
    thumbnail_width INTEGER,
    thumbnail_height INTEGER
);
CREATE TABLE cast_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);
CREATE TABLE movie_cast (
    movie_id INTEGER,
    cast_id INTEGER,
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (cast_id) REFERENCES cast_members(id),
    PRIMARY KEY (movie_id, cast_id)
);
CREATE TABLE genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);
CREATE TABLE movie_genres (
    movie_id INTEGER,
    genre_id INTEGER,
    FOREIGN KEY (movie_id) REFERENCES movies(id),
    FOREIGN KEY (genre_id) REFERENCES genres(id),
    PRIMARY KEY (movie_id, genre_id)
);
CREATE VIRTUAL TABLE fts_movies USING fts5(title, extract);
CREATE TABLE IF NOT EXISTS "favorites" (
	"id"	INTEGER PRIMARY KEY AUTOINCREMENT,
	"session_id"	TEXT NOT NULL,
	"movie_id"	INTEGER NOT NULL
);

PRAGMA foreign_keys = ON;
