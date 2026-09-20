CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('ADMIN', 'COACH', 'PARTICIPANT');
CREATE TYPE update_type AS ENUM ('TEAM_MILESTONE', 'INDIVIDUAL_TASK');
CREATE TYPE visibility_type AS ENUM ('PUBLIC', 'PRIVATE');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    system_role user_role NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    team_id UUID,
    team_role VARCHAR(100)
);

CREATE TABLE ideas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    tech_requirements TEXT,
    created_by UUID REFERENCES users(id)
);

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    coach_id UUID REFERENCES users(id),
    idea_id UUID UNIQUE REFERENCES ideas(id)
);

-- Add foreign key constraint for team_id on users now that teams table exists
ALTER TABLE users ADD CONSTRAINT fk_user_team FOREIGN KEY (team_id) REFERENCES teams(id);

CREATE TABLE progress_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id),
    user_id UUID REFERENCES users(id), -- Nullable for team updates
    type update_type NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    progress_update_id UUID REFERENCES progress_updates(id),
    content TEXT NOT NULL,
    visibility visibility_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Ensure note is tied to either a team or a progress update
    CHECK (team_id IS NOT NULL OR progress_update_id IS NOT NULL)
);
