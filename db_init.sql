-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create trails table with proper geometry type
CREATE TABLE IF NOT EXISTS trails (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50),
    length_meters NUMERIC,
    elevation_gain_meters NUMERIC,
    surface VARCHAR(100),
    geom GEOMETRY(LineString, 4326),
    properties JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for fast queries
CREATE INDEX IF NOT EXISTS trails_geom_idx ON trails USING GIST(geom);

-- Create index on difficulty for filtering
CREATE INDEX IF NOT EXISTS trails_difficulty_idx ON trails(difficulty);

-- Create table for user activities (Phase 3)
CREATE TABLE IF NOT EXISTS user_activities (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    trail_id INTEGER REFERENCES trails(id),
    distance_meters NUMERIC,
    elevation_gain_meters NUMERIC,
    duration_seconds INTEGER,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    geom GEOMETRY(LineString, 4326),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for activities
CREATE INDEX IF NOT EXISTS activities_geom_idx ON user_activities USING GIST(geom);
CREATE INDEX IF NOT EXISTS activities_user_idx ON user_activities(user_id);

-- Create table for trail ratings/reviews
CREATE TABLE IF NOT EXISTS trail_reviews (
    id SERIAL PRIMARY KEY,
    trail_id INTEGER REFERENCES trails(id),
    user_id VARCHAR(255) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS reviews_trail_idx ON trail_reviews(trail_id);
CREATE INDEX IF NOT EXISTS reviews_user_idx ON trail_reviews(user_id);

-- Grant privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO developer;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO developer;
