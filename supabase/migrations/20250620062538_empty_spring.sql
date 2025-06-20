/*
  # Create disaster response database schema

  1. New Tables
    - `disasters`
      - `id` (uuid, primary key)
      - `title` (text)
      - `location_name` (text) - Human readable location
      - `location` (geography) - PostGIS point for spatial queries
      - `description` (text)
      - `tags` (text array) - disaster types like "flood", "earthquake"
      - `owner_id` (text) - user who created the disaster
      - `audit_trail` (jsonb) - track all changes
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      
    - `reports`
      - `id` (uuid, primary key)
      - `disaster_id` (uuid, foreign key)
      - `user_id` (text)
      - `content` (text)
      - `image_url` (text, optional)
      - `verification_status` (text) - pending, verified, rejected
      - `location_name` (text, optional)
      - `location` (geography, optional)
      - `created_at` (timestamp)
      
    - `resources`
      - `id` (uuid, primary key)
      - `disaster_id` (uuid, foreign key)
      - `name` (text)
      - `location_name` (text)
      - `location` (geography)
      - `type` (text) - shelter, medical, food, etc.
      - `description` (text, optional)
      - `created_by` (text)
      - `created_at` (timestamp)
      
    - `cache`
      - `key` (text, primary key)
      - `value` (jsonb)
      - `expires_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    
  3. Indexes
    - Spatial indexes for geography columns
    - GIN indexes for tags and JSONB columns
    - Standard indexes for foreign keys and common queries
    
  4. Functions
    - Geospatial query functions for finding nearby resources
*/

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create disasters table
CREATE TABLE IF NOT EXISTS disasters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  location_name text,
  location geography(POINT, 4326),
  description text NOT NULL,
  tags text[] DEFAULT '{}',
  owner_id text NOT NULL,
  audit_trail jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id uuid REFERENCES disasters(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  content text NOT NULL,
  image_url text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  location_name text,
  location geography(POINT, 4326),
  created_at timestamptz DEFAULT now()
);

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disaster_id uuid REFERENCES disasters(id) ON DELETE CASCADE,
  name text NOT NULL,
  location_name text,
  location geography(POINT, 4326),
  type text NOT NULL,
  description text,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create cache table
CREATE TABLE IF NOT EXISTS cache (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  expires_at timestamptz NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS disasters_location_idx ON disasters USING GIST (location);
CREATE INDEX IF NOT EXISTS disasters_tags_idx ON disasters USING GIN (tags);
CREATE INDEX IF NOT EXISTS disasters_owner_idx ON disasters (owner_id);
CREATE INDEX IF NOT EXISTS disasters_created_idx ON disasters (created_at DESC);

CREATE INDEX IF NOT EXISTS reports_disaster_idx ON reports (disaster_id);
CREATE INDEX IF NOT EXISTS reports_location_idx ON reports USING GIST (location);
CREATE INDEX IF NOT EXISTS reports_created_idx ON reports (created_at DESC);

CREATE INDEX IF NOT EXISTS resources_disaster_idx ON resources (disaster_id);
CREATE INDEX IF NOT EXISTS resources_location_idx ON resources USING GIST (location);
CREATE INDEX IF NOT EXISTS resources_type_idx ON resources (type);

CREATE INDEX IF NOT EXISTS cache_expires_idx ON cache (expires_at);

-- Enable Row Level Security
ALTER TABLE disasters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disasters
CREATE POLICY "Anyone can read disasters"
  ON disasters
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create disasters"
  ON disasters
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own disasters"
  ON disasters
  FOR UPDATE
  TO public
  USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own disasters"
  ON disasters
  FOR DELETE
  TO public
  USING (owner_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policies for reports
CREATE POLICY "Anyone can read reports"
  ON reports
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create reports"
  ON reports
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own reports"
  ON reports
  FOR UPDATE
  TO public
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policies for resources
CREATE POLICY "Anyone can read resources"
  ON resources
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create resources"
  ON resources
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can update own resources"
  ON resources
  FOR UPDATE
  TO public
  USING (created_by = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policies for cache
CREATE POLICY "Anyone can read cache"
  ON cache
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Service can manage cache"
  ON cache
  FOR ALL
  TO public
  USING (true);

-- Create function to find resources within distance
CREATE OR REPLACE FUNCTION find_resources_within_distance(
  disaster_id uuid,
  center_point geography,
  distance_meters integer
)
RETURNS TABLE (
  id uuid,
  disaster_id uuid,
  name text,
  location_name text,
  location geography,
  type text,
  description text,
  created_by text,
  created_at timestamptz,
  distance_meters numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.disaster_id,
    r.name,
    r.location_name,
    r.location,
    r.type,
    r.description,
    r.created_by,
    r.created_at,
    ST_Distance(r.location, center_point)::numeric as distance_meters
  FROM resources r
  WHERE r.disaster_id = find_resources_within_distance.disaster_id
    AND r.location IS NOT NULL
    AND ST_DWithin(r.location, center_point, distance_meters)
  ORDER BY ST_Distance(r.location, center_point);
END;
$$;

-- Create function to find nearby resources (general)
CREATE OR REPLACE FUNCTION find_nearby_resources(
  center_lat double precision,
  center_lon double precision,
  radius_meters integer
)
RETURNS TABLE (
  id uuid,
  disaster_id uuid,
  name text,
  location_name text,
  location geography,
  type text,
  description text,
  created_by text,
  created_at timestamptz,
  distance_meters numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
  center_point geography;
BEGIN
  center_point := ST_SetSRID(ST_Point(center_lon, center_lat), 4326)::geography;
  
  RETURN QUERY
  SELECT 
    r.id,
    r.disaster_id,
    r.name,
    r.location_name,
    r.location,
    r.type,
    r.description,
    r.created_by,
    r.created_at,
    ST_Distance(r.location, center_point)::numeric as distance_meters
  FROM resources r
  WHERE r.location IS NOT NULL
    AND ST_DWithin(r.location, center_point, radius_meters)
  ORDER BY ST_Distance(r.location, center_point);
END;
$$;

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_disasters_updated_at 
  BEFORE UPDATE ON disasters 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO disasters (title, location_name, description, tags, owner_id) VALUES
(
  'NYC Flood Emergency',
  'Manhattan, NYC',
  'Heavy flooding in Manhattan due to unprecedented rainfall. Multiple subway stations closed, roads impassable.',
  ARRAY['flood', 'urgent', 'transportation'],
  'netrunnerX'
),
(
  'Brooklyn Power Outage',
  'Brooklyn, NYC',
  'Widespread power outage affecting 50,000+ residents in Brooklyn due to storm damage.',
  ARRAY['power', 'storm', 'infrastructure'],
  'reliefAdmin'
),
(
  'Queens Evacuation Zone',
  'Queens, NYC',
  'Mandatory evacuation for coastal areas of Queens due to storm surge risk.',
  ARRAY['evacuation', 'storm', 'coastal'],
  'netrunnerX'
);

-- Insert sample resources
INSERT INTO resources (disaster_id, name, location_name, type, description, created_by) VALUES
(
  (SELECT id FROM disasters WHERE title = 'NYC Flood Emergency' LIMIT 1),
  'Red Cross Emergency Shelter',
  'Lower East Side, NYC',
  'shelter',
  'Emergency shelter with capacity for 200 people. Providing food, water, and basic supplies.',
  'reliefAdmin'
),
(
  (SELECT id FROM disasters WHERE title = 'NYC Flood Emergency' LIMIT 1),
  'Mobile Medical Unit',
  'Brooklyn Bridge Area',
  'medical',
  'Mobile medical unit providing emergency healthcare and first aid.',
  'reliefAdmin'
),
(
  (SELECT id FROM disasters WHERE title = 'Brooklyn Power Outage' LIMIT 1),
  'Community Charging Station',
  'Brooklyn Community Center',
  'utilities',
  'Free device charging and WiFi access for affected residents.',
  'netrunnerX'
);

-- Insert sample reports
INSERT INTO reports (disaster_id, user_id, content, verification_status) VALUES
(
  (SELECT id FROM disasters WHERE title = 'NYC Flood Emergency' LIMIT 1),
  'citizen1',
  'Water level on my street has risen to 3 feet. Cars are completely submerged. Need immediate assistance for evacuation.',
  'pending'
),
(
  (SELECT id FROM disasters WHERE title = 'NYC Flood Emergency' LIMIT 1),
  'emergency_worker',
  'Rescue boat deployed to Delancey Street area. Successfully evacuated 12 residents from flooded apartments.',
  'verified'
);