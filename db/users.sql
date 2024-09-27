CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    height INTEGER, -- Height in cm
    weight INTEGER, -- Weight in kg
    dietary_preferences TEXT, -- Vegan, Vegetarian, etc.
    activity_level TEXT, -- Sedentary, Active, etc.
    target_calories INTEGER, -- Daily target calories
    target_weight INTEGER -- Desired weight goal
);
