-- Bridge Learning Platform Database Schema
-- This script creates all necessary tables for the platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  bio TEXT,
  profile_image_url VARCHAR(500),
  headline VARCHAR(200),
  location VARCHAR(100),
  country VARCHAR(100),
  phone VARCHAR(20),
  website_url VARCHAR(500),
  user_type VARCHAR(50) CHECK (user_type IN ('learner', 'mentor', 'recruiter', 'admin')),
  experience_level VARCHAR(50) CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Skills Table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  demand_score DECIMAL(5,2),
  trending BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Skills (Many-to-Many)
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level VARCHAR(50) CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_of_experience DECIMAL(5,2),
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP,
  verified_by_user_id UUID REFERENCES users(id),
  endorsement_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, skill_id)
);

-- 4. Credentials Table
CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  issuer VARCHAR(200) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  credential_url VARCHAR(500),
  credential_image_url VARCHAR(500),
  description TEXT,
  credential_type VARCHAR(50) CHECK (credential_type IN ('certification', 'badge', 'license', 'award')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  project_url VARCHAR(500),
  github_url VARCHAR(500),
  image_url VARCHAR(500),
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold')),
  visibility VARCHAR(50) CHECK (visibility IN ('public', 'private')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Project Skills (Many-to-Many)
CREATE TABLE IF NOT EXISTS project_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE(project_id, skill_id)
);

-- 7. Opportunities Table
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  company_image_url VARCHAR(500),
  description TEXT NOT NULL,
  job_type VARCHAR(50) CHECK (job_type IN ('full_time', 'part_time', 'contract', 'internship', 'freelance')),
  location VARCHAR(100),
  salary_min DECIMAL(15,2),
  salary_max DECIMAL(15,2),
  salary_currency VARCHAR(10) DEFAULT 'SLL',
  experience_required VARCHAR(50),
  posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  application_deadline DATE,
  status VARCHAR(50) CHECK (status IN ('open', 'closed', 'filled')) DEFAULT 'open',
  posted_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Opportunity Skills (Many-to-Many)
CREATE TABLE IF NOT EXISTS opportunity_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  proficiency_level VARCHAR(50),
  UNIQUE(opportunity_id, skill_id)
);

-- 9. Applications Table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  status VARCHAR(50) CHECK (status IN ('applied', 'rejected', 'accepted', 'interview', 'offered')) DEFAULT 'applied',
  application_message TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  response_at TIMESTAMP,
  UNIQUE(user_id, opportunity_id)
);

-- 10. Connections Table
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) CHECK (status IN ('pending', 'accepted', 'blocked', 'rejected')) DEFAULT 'pending',
  connection_type VARCHAR(50) CHECK (connection_type IN ('peer', 'mentor', 'mentee', 'professional')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  CHECK (requester_id != receiver_id)
);

-- 11. Connection Requests (for pending requests)
CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  mutual_connections_count INTEGER DEFAULT 0,
  status VARCHAR(50) CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  CHECK (requester_id != receiver_id),
  UNIQUE(requester_id, receiver_id)
);

-- 12. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  related_user_id UUID REFERENCES users(id),
  related_opportunity_id UUID REFERENCES opportunities(id),
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Learning Paths Table
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  difficulty_level VARCHAR(50),
  duration_weeks INTEGER,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Learning Path Skills (Many-to-Many)
CREATE TABLE IF NOT EXISTS learning_path_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  order_in_path INTEGER,
  UNIQUE(learning_path_id, skill_id)
);

-- 16. User Learning Paths
CREATE TABLE IF NOT EXISTS user_learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  status VARCHAR(50) CHECK (status IN ('enrolled', 'in_progress', 'completed')) DEFAULT 'enrolled',
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  UNIQUE(user_id, learning_path_id)
);

-- 17. Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  provider VARCHAR(200),
  duration_hours DECIMAL(5,2),
  difficulty_level VARCHAR(50),
  course_url VARCHAR(500),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Course Skills (Many-to-Many)
CREATE TABLE IF NOT EXISTS course_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  UNIQUE(course_id, skill_id)
);

-- 19. User Courses
CREATE TABLE IF NOT EXISTS user_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status VARCHAR(50) CHECK (status IN ('enrolled', 'in_progress', 'completed')) DEFAULT 'enrolled',
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  UNIQUE(user_id, course_id)
);

-- 20. Career Paths Table
CREATE TABLE IF NOT EXISTS career_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  industry VARCHAR(100),
  entry_level_job_id UUID REFERENCES opportunities(id),
  mid_level_job_id UUID REFERENCES opportunities(id),
  senior_level_job_id UUID REFERENCES opportunities(id),
  average_salary_min DECIMAL(15,2),
  average_salary_max DECIMAL(15,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 21. Career Path Skills (Many-to-Many)
CREATE TABLE IF NOT EXISTS career_path_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  career_path_id UUID NOT NULL REFERENCES career_paths(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  required_proficiency VARCHAR(50),
  priority_order INTEGER,
  UNIQUE(career_path_id, skill_id)
);

-- 22. Endorsements Table
CREATE TABLE IF NOT EXISTS endorsements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  endorsed_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, skill_id, endorsed_by_user_id)
);

-- 23. Feed Items Table
CREATE TABLE IF NOT EXISTS feed_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feed_type VARCHAR(50) NOT NULL,
  title VARCHAR(200),
  description TEXT,
  image_url VARCHAR(500),
  action_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 24. User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  preferred_job_types TEXT[],
  preferred_locations TEXT[],
  min_salary DECIMAL(15,2),
  career_goals TEXT,
  notification_preferences JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 25. Activity Log Table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(100) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 26. Recommendations Table
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommendation_text TEXT NOT NULL,
  skill_id UUID REFERENCES skills(id),
  rating DECIMAL(3,1) CHECK (rating >= 1 AND rating <= 5),
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 27. Saved Opportunities Table
CREATE TABLE IF NOT EXISTS saved_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, opportunity_id)
);

-- Create Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_location ON users(location);
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_posted_date ON opportunities(posted_date);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX idx_connections_requester_id ON connections(requester_id);
CREATE INDEX idx_connections_receiver_id ON connections(receiver_id);
CREATE INDEX idx_connection_requests_receiver_id ON connection_requests(receiver_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_endorsements_user_id ON endorsements(user_id);
CREATE INDEX idx_endorsements_skill_id ON endorsements(skill_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
