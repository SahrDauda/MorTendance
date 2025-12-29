-- Seed Bridge Learning Platform with Sample Data

-- 1. Insert Users
INSERT INTO users (email, first_name, last_name, headline, location, country, user_type, experience_level, bio, is_verified)
VALUES
  ('aisha.sesay@example.com', 'Aisha', 'Sesay', 'Full Stack Developer', 'Freetown', 'Sierra Leone', 'learner', 'intermediate', 'Passionate about building web applications and learning new technologies', true),
  ('david.kamara@example.com', 'David', 'Kamara', 'Data Scientist', 'Freetown', 'Sierra Leone', 'mentor', 'advanced', 'Helping aspiring data scientists build their careers', true),
  ('amara.conteh@example.com', 'Amara', 'Conteh', 'UI/UX Designer', 'Freetown', 'Sierra Leone', 'learner', 'beginner', 'Learning design principles and user experience', false),
  ('ibrahim.koroma@example.com', 'Ibrahim', 'Koroma', 'Frontend Developer', 'Freetown', 'Sierra Leone', 'recruiter', 'expert', 'Recruiting top tech talent for international companies', true),
  ('zainab.bangura@example.com', 'Zainab', 'Bangura', 'Project Manager', 'Freetown', 'Sierra Leone', 'learner', 'advanced', 'Transitioning from project management to tech', true),
  ('john.stevens@example.com', 'John', 'Stevens', 'AI Engineer', 'Freetown', 'Sierra Leone', 'mentor', 'expert', 'Expert in machine learning and AI solutions', true),
  ('marie.louise@example.com', 'Marie', 'Louise', 'Product Manager', 'Freetown', 'Sierra Leone', 'recruiter', 'advanced', 'Building great products with data-driven decisions', true),
  ('hassan.bah@example.com', 'Hassan', 'Bah', 'DevOps Engineer', 'Freetown', 'Sierra Leone', 'learner', 'intermediate', 'Learning cloud infrastructure and DevOps practices', false);

-- 2. Insert Skills
INSERT INTO skills (name, category, difficulty_level, demand_score, trending)
VALUES
  ('JavaScript', 'Programming', 'intermediate', 9.5, true),
  ('Python', 'Programming', 'intermediate', 9.2, true),
  ('React', 'Web Development', 'intermediate', 9.0, true),
  ('Data Analysis', 'Data Science', 'advanced', 8.8, true),
  ('Machine Learning', 'AI/ML', 'advanced', 9.1, true),
  ('UI/UX Design', 'Design', 'intermediate', 8.5, false),
  ('AWS', 'Cloud', 'advanced', 8.9, true),
  ('SQL', 'Database', 'beginner', 8.7, false),
  ('Node.js', 'Backend', 'intermediate', 8.6, true),
  ('TypeScript', 'Programming', 'intermediate', 8.8, true),
  ('Docker', 'DevOps', 'advanced', 8.4, true),
  ('Git', 'Tools', 'beginner', 9.0, false),
  ('MongoDB', 'Database', 'intermediate', 8.2, true),
  ('GraphQL', 'Backend', 'advanced', 7.9, true),
  ('Kubernetes', 'DevOps', 'advanced', 8.3, true);

-- 3. Insert User Skills
INSERT INTO user_skills (user_id, skill_id, proficiency_level, years_of_experience, is_verified, endorsement_count)
VALUES
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), (SELECT id FROM skills WHERE name = 'JavaScript'), 'advanced', 2.5, true, 12),
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), (SELECT id FROM skills WHERE name = 'React'), 'advanced', 2.0, true, 10),
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), (SELECT id FROM skills WHERE name = 'Node.js'), 'intermediate', 1.5, false, 6),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), (SELECT id FROM skills WHERE name = 'Python'), 'expert', 5.0, true, 25),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), (SELECT id FROM skills WHERE name = 'Data Analysis'), 'expert', 5.0, true, 22),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), (SELECT id FROM skills WHERE name = 'Machine Learning'), 'advanced', 4.0, true, 18),
  ((SELECT id FROM users WHERE email = 'amara.conteh@example.com'), (SELECT id FROM skills WHERE name = 'UI/UX Design'), 'beginner', 0.5, false, 2),
  ((SELECT id FROM users WHERE email = 'amara.conteh@example.com'), (SELECT id FROM skills WHERE name = 'JavaScript'), 'beginner', 0.3, false, 1),
  ((SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), (SELECT id FROM skills WHERE name = 'AWS'), 'advanced', 3.0, true, 14),
  ((SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), (SELECT id FROM skills WHERE name = 'Docker'), 'intermediate', 2.0, true, 8),
  ((SELECT id FROM users WHERE email = 'john.stevens@example.com'), (SELECT id FROM skills WHERE name = 'Machine Learning'), 'expert', 6.0, true, 28),
  ((SELECT id FROM users WHERE email = 'john.stevens@example.com'), (SELECT id FROM skills WHERE name = 'Python'), 'expert', 6.0, true, 26),
  ((SELECT id FROM users WHERE email = 'hassan.bah@example.com'), (SELECT id FROM skills WHERE name = 'Kubernetes'), 'intermediate', 1.5, false, 4),
  ((SELECT id FROM users WHERE email = 'hassan.bah@example.com'), (SELECT id FROM skills WHERE name = 'Docker'), 'intermediate', 1.5, false, 5);

-- 4. Insert Credentials
INSERT INTO credentials (user_id, title, issuer, issue_date, credential_type, description)
VALUES
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), 'AWS Certified Solutions Architect', 'Amazon Web Services', '2023-06-15', 'certification', 'Professional level certification for AWS cloud architecture'),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), 'Google Data Analytics Professional', 'Google', '2023-03-20', 'certification', 'Comprehensive data analytics certification from Google'),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), 'Machine Learning Specialization', 'Coursera', '2022-12-10', 'badge', 'Completed comprehensive ML specialization'),
  ((SELECT id FROM users WHERE email = 'john.stevens@example.com'), 'Deep Learning Specialization', 'Coursera', '2023-01-05', 'certification', 'Advanced deep learning and neural networks course'),
  ((SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), 'Kubernetes Administrator', 'Linux Foundation', '2023-09-30', 'certification', 'CKA certification for Kubernetes administration');

-- 5. Insert Projects
INSERT INTO projects (user_id, title, description, start_date, end_date, status, visibility)
VALUES
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), 'E-Commerce Platform', 'Full-stack e-commerce platform with React and Node.js', '2023-01-15', '2023-06-30', 'completed', 'public'),
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), 'Task Management App', 'Collaborative task management app with real-time updates', '2023-07-01', NULL, 'in_progress', 'public'),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), 'Predictive Analytics Dashboard', 'Dashboard for analyzing and predicting market trends', '2023-02-01', '2023-08-15', 'completed', 'public'),
  ((SELECT id FROM users WHERE email = 'amara.conteh@example.com'), 'Mobile App UI Design', 'UI designs for a social networking mobile application', '2023-09-01', NULL, 'in_progress', 'public'),
  ((SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), 'Cloud Infrastructure Migration', 'Migrating legacy systems to AWS cloud infrastructure', '2023-05-01', '2023-10-30', 'completed', 'private');

-- 6. Insert Opportunities
INSERT INTO opportunities (title, company_name, description, job_type, location, salary_min, salary_max, experience_required, application_deadline, status, posted_date)
VALUES
  ('Senior Full Stack Developer', 'Tech Innovation Labs', 'Looking for experienced full-stack developer to lead technical projects', 'full_time', 'Freetown', 4500000, 6000000, '3+ years', '2024-01-15', 'open', '2023-12-01'),
  ('Data Scientist', 'Analytics Pro', 'Join our data science team to build ML models and insights', 'full_time', 'Freetown', 4000000, 5500000, '2+ years', '2024-01-10', 'open', '2023-11-25'),
  ('Junior Frontend Developer', 'Web Solutions Inc', 'Great opportunity for junior developers to learn and grow', 'full_time', 'Freetown', 2000000, 2800000, '0-1 years', '2024-01-20', 'open', '2023-12-05'),
  ('UI/UX Designer', 'Creative Studios', 'Designing beautiful interfaces for mobile and web applications', 'full_time', 'Freetown', 3000000, 4200000, '1+ years', '2024-01-18', 'open', '2023-12-03'),
  ('DevOps Engineer', 'Cloud Systems', 'Managing cloud infrastructure and deployment pipelines', 'full_time', 'Freetown', 3500000, 5000000, '2+ years', '2024-02-01', 'open', '2023-12-10'),
  ('AI Engineer Intern', 'AI Research Center', 'Internship in artificial intelligence and machine learning', 'internship', 'Freetown', 600000, 800000, 'Student', '2024-02-15', 'open', '2023-12-08');

-- 7. Insert Opportunity Skills
INSERT INTO opportunity_skills (opportunity_id, skill_id, proficiency_level)
VALUES
  ((SELECT id FROM opportunities WHERE title = 'Senior Full Stack Developer'), (SELECT id FROM skills WHERE name = 'JavaScript'), 'advanced'),
  ((SELECT id FROM opportunities WHERE title = 'Senior Full Stack Developer'), (SELECT id FROM skills WHERE name = 'React'), 'advanced'),
  ((SELECT id FROM opportunities WHERE title = 'Senior Full Stack Developer'), (SELECT id FROM skills WHERE name = 'Node.js'), 'advanced'),
  ((SELECT id FROM opportunities WHERE title = 'Data Scientist'), (SELECT id FROM skills WHERE name = 'Python'), 'advanced'),
  ((SELECT id FROM opportunities WHERE title = 'Data Scientist'), (SELECT id FROM skills WHERE name = 'Machine Learning'), 'advanced'),
  ((SELECT id FROM opportunities WHERE title = 'Data Scientist'), (SELECT id FROM skills WHERE name = 'Data Analysis'), 'advanced'),
  ((SELECT id FROM opportunities WHERE title = 'Junior Frontend Developer'), (SELECT id FROM skills WHERE name = 'JavaScript'), 'intermediate'),
  ((SELECT id FROM opportunities WHERE title = 'Junior Frontend Developer'), (SELECT id FROM skills WHERE name = 'React'), 'intermediate'),
  ((SELECT id FROM opportunities WHERE title = 'UI/UX Designer'), (SELECT id FROM skills WHERE name = 'UI/UX Design'), 'advanced'),
  ((SELECT id FROM opportunities WHERE title = 'DevOps Engineer'), (SELECT id FROM skills WHERE name = 'Docker'), 'advanced'),
  ((SELECT id FROM opportunities WHERE title = 'DevOps Engineer'), (SELECT id FROM skills WHERE name = 'Kubernetes'), 'advanced'),
  ((SELECT id FROM opportunities WHERE title = 'DevOps Engineer'), (SELECT id FROM skills WHERE name = 'AWS'), 'advanced'),
  ((SELECT id FROM opportunities WHERE title = 'AI Engineer Intern'), (SELECT id FROM skills WHERE name = 'Python'), 'intermediate'),
  ((SELECT id FROM opportunities WHERE title = 'AI Engineer Intern'), (SELECT id FROM skills WHERE name = 'Machine Learning'), 'intermediate');

-- 8. Insert Connections
INSERT INTO connections (requester_id, receiver_id, status, connection_type)
VALUES
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), (SELECT id FROM users WHERE email = 'david.kamara@example.com'), 'accepted', 'mentor'),
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), (SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), 'accepted', 'peer'),
  ((SELECT id FROM users WHERE email = 'amara.conteh@example.com'), (SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), 'pending', 'peer'),
  ((SELECT id FROM users WHERE email = 'hassan.bah@example.com'), (SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), 'accepted', 'mentor'),
  ((SELECT id FROM users WHERE email = 'marie.louise@example.com'), (SELECT id FROM users WHERE email = 'david.kamara@example.com'), 'accepted', 'professional');

-- 9. Insert Connection Requests
INSERT INTO connection_requests (requester_id, receiver_id, message, mutual_connections_count, status)
VALUES
  ((SELECT id FROM users WHERE email = 'amara.conteh@example.com'), (SELECT id FROM users WHERE email = 'david.kamara@example.com'), 'I would love to learn from your data science experience', 1, 'pending'),
  ((SELECT id FROM users WHERE email = 'hassan.bah@example.com'), (SELECT id FROM users WHERE email = 'john.stevens@example.com'), 'Interested in discussing ML applications in DevOps', 0, 'pending'),
  ((SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), (SELECT id FROM users WHERE email = 'ibrahim.koroma@example.com'), 'Let''s discuss cloud architecture best practices', 2, 'pending');

-- 10. Insert Learning Paths
INSERT INTO learning_paths (title, description, difficulty_level, duration_weeks)
VALUES
  ('Full Stack Web Development', 'Complete path to become a full-stack web developer', 'intermediate', 24),
  ('Data Science Fundamentals', 'Learn data analysis, visualization, and basic ML', 'intermediate', 20),
  ('Cloud Infrastructure Mastery', 'Master AWS, Docker, and Kubernetes', 'advanced', 16),
  ('UI/UX Design Essentials', 'Learn design principles and tools for web/mobile', 'beginner', 12),
  ('AI and Machine Learning', 'Deep dive into AI and advanced ML techniques', 'advanced', 28);

-- 11. Insert Learning Path Skills
INSERT INTO learning_path_skills (learning_path_id, skill_id, order_in_path)
VALUES
  ((SELECT id FROM learning_paths WHERE title = 'Full Stack Web Development'), (SELECT id FROM skills WHERE name = 'JavaScript'), 1),
  ((SELECT id FROM learning_paths WHERE title = 'Full Stack Web Development'), (SELECT id FROM skills WHERE name = 'React'), 2),
  ((SELECT id FROM learning_paths WHERE title = 'Full Stack Web Development'), (SELECT id FROM skills WHERE name = 'Node.js'), 3),
  ((SELECT id FROM learning_paths WHERE title = 'Full Stack Web Development'), (SELECT id FROM skills WHERE name = 'MongoDB'), 4),
  ((SELECT id FROM learning_paths WHERE title = 'Data Science Fundamentals'), (SELECT id FROM skills WHERE name = 'Python'), 1),
  ((SELECT id FROM learning_paths WHERE title = 'Data Science Fundamentals'), (SELECT id FROM skills WHERE name = 'Data Analysis'), 2),
  ((SELECT id FROM learning_paths WHERE title = 'Data Science Fundamentals'), (SELECT id FROM skills WHERE name = 'SQL'), 3),
  ((SELECT id FROM learning_paths WHERE title = 'Cloud Infrastructure Mastery'), (SELECT id FROM skills WHERE name = 'AWS'), 1),
  ((SELECT id FROM learning_paths WHERE title = 'Cloud Infrastructure Mastery'), (SELECT id FROM skills WHERE name = 'Docker'), 2),
  ((SELECT id FROM learning_paths WHERE title = 'Cloud Infrastructure Mastery'), (SELECT id FROM skills WHERE name = 'Kubernetes'), 3),
  ((SELECT id FROM learning_paths WHERE title = 'UI/UX Design Essentials'), (SELECT id FROM skills WHERE name = 'UI/UX Design'), 1);

-- 12. Insert Courses
INSERT INTO courses (title, description, provider, duration_hours, difficulty_level, course_url)
VALUES
  ('React Complete Guide', 'Comprehensive React course covering hooks, state management, and best practices', 'Udemy', 40.0, 'intermediate', 'https://udemy.com/react-guide'),
  ('Python for Data Science', 'Master Python for data analysis and visualization', 'Coursera', 35.0, 'intermediate', 'https://coursera.org/python-data-science'),
  ('AWS Solutions Architect', 'Prepare for AWS certification exam', 'A Cloud Guru', 45.0, 'advanced', 'https://acloudguru.com/aws-architect'),
  ('Machine Learning Fundamentals', 'Introduction to ML algorithms and applications', 'Coursera', 50.0, 'advanced', 'https://coursera.org/ml-fundamentals'),
  ('Docker & Kubernetes Masterclass', 'Learn containerization and orchestration', 'Udemy', 32.0, 'intermediate', 'https://udemy.com/docker-k8s'),
  ('UI Design Principles', 'Master user interface design fundamentals', 'Skillshare', 12.0, 'beginner', 'https://skillshare.com/ui-design');

-- 13. Insert User Courses
INSERT INTO user_courses (user_id, course_id, status, progress_percentage, enrolled_at)
VALUES
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), (SELECT id FROM courses WHERE title = 'React Complete Guide'), 'completed', 100.0, '2023-08-01'),
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), (SELECT id FROM courses WHERE title = 'Docker & Kubernetes Masterclass'), 'in_progress', 60.0, '2023-11-01'),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), (SELECT id FROM courses WHERE title = 'Python for Data Science'), 'completed', 100.0, '2023-06-01'),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), (SELECT id FROM courses WHERE title = 'Machine Learning Fundamentals'), 'completed', 100.0, '2023-09-15'),
  ((SELECT id FROM users WHERE email = 'amara.conteh@example.com'), (SELECT id FROM courses WHERE title = 'UI Design Principles'), 'in_progress', 45.0, '2023-10-01'),
  ((SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), (SELECT id FROM courses WHERE title = 'AWS Solutions Architect'), 'in_progress', 75.0, '2023-09-01'),
  ((SELECT id FROM users WHERE email = 'hassan.bah@example.com'), (SELECT id FROM courses WHERE title = 'Docker & Kubernetes Masterclass'), 'in_progress', 40.0, '2023-11-15');

-- 14. Insert Applications
INSERT INTO applications (user_id, opportunity_id, status, application_message, applied_at)
VALUES
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), (SELECT id FROM opportunities WHERE title = 'Senior Full Stack Developer'), 'applied', 'Excited to apply for this role with 2+ years of full-stack experience', '2023-12-11'),
  ((SELECT id FROM users WHERE email = 'amara.conteh@example.com'), (SELECT id FROM opportunities WHERE title = 'UI/UX Designer'), 'interview', 'I have a strong portfolio in UI/UX design', '2023-12-09'),
  ((SELECT id FROM users WHERE email = 'hassan.bah@example.com'), (SELECT id FROM opportunities WHERE title = 'DevOps Engineer'), 'applied', 'Looking forward to discussing this opportunity', '2023-12-12'),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), (SELECT id FROM opportunities WHERE title = 'Data Scientist'), 'accepted', 'Grateful for this opportunity to contribute', '2023-12-08');

-- 15. Insert Saved Opportunities
INSERT INTO saved_opportunities (user_id, opportunity_id, saved_at)
VALUES
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), (SELECT id FROM opportunities WHERE title = 'Senior Full Stack Developer'), '2023-12-10'),
  ((SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), (SELECT id FROM opportunities WHERE title = 'DevOps Engineer'), '2023-12-11'),
  ((SELECT id FROM users WHERE email = 'hassan.bah@example.com'), (SELECT id FROM opportunities WHERE title = 'Data Scientist'), '2023-12-12');

-- 16. Insert Notifications
INSERT INTO notifications (user_id, notification_type, title, message, related_user_id, is_read)
VALUES
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), 'connection_request', 'New Connection Request', 'Amara Conteh wants to connect with you', (SELECT id FROM users WHERE email = 'amara.conteh@example.com'), false),
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), 'skill_endorsed', 'Skill Endorsed', 'David Kamara endorsed your JavaScript skill', (SELECT id FROM users WHERE email = 'david.kamara@example.com'), false),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), 'job_recommendation', 'Job Recommendation', 'New job matching your skills: Senior Data Scientist', NULL, false),
  ((SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), 'application_status', 'Application Update', 'Your application for Cloud Engineer was viewed', NULL, true),
  ((SELECT id FROM users WHERE email = 'hassan.bah@example.com'), 'course_milestone', 'Learning Progress', 'You completed 50% of Docker & Kubernetes course', NULL, false);

-- 17. Insert User Preferences
INSERT INTO user_preferences (user_id, preferred_job_types, min_salary, career_goals)
VALUES
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), ARRAY['full_time', 'contract'], 3500000, 'Become a tech lead in 3 years'),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), ARRAY['full_time'], 4500000, 'Lead a data science team'),
  ((SELECT id FROM users WHERE email = 'amara.conteh@example.com'), ARRAY['full_time', 'freelance'], 2500000, 'Become a UX research specialist'),
  ((SELECT id FROM users WHERE email = 'hassan.bah@example.com'), ARRAY['full_time'], 3000000, 'Master cloud infrastructure'),
  ((SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), ARRAY['full_time'], 4000000, 'Transition fully into tech leadership');

-- 18. Insert Recommendations
INSERT INTO recommendations (from_user_id, to_user_id, recommendation_text, skill_id, rating)
VALUES
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), (SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), 'Aisha is an exceptional developer with strong attention to detail', (SELECT id FROM skills WHERE name = 'JavaScript'), 5.0),
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), (SELECT id FROM users WHERE email = 'david.kamara@example.com'), 'David''s mentorship has been invaluable in my learning journey', (SELECT id FROM skills WHERE name = 'Python'), 5.0),
  ((SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), (SELECT id FROM users WHERE email = 'hassan.bah@example.com'), 'Hassan demonstrates great potential in cloud technologies', (SELECT id FROM skills WHERE name = 'AWS'), 4.5),
  ((SELECT id FROM users WHERE email = 'john.stevens@example.com'), (SELECT id FROM users WHERE email = 'david.kamara@example.com'), 'David''s AI insights have helped shape our ML strategy', (SELECT id FROM skills WHERE name = 'Machine Learning'), 5.0);

-- 19. Insert Career Paths
INSERT INTO career_paths (title, description, industry, average_salary_min, average_salary_max)
VALUES
  ('Full Stack Developer', 'From frontend basics to full-stack mastery', 'Technology', 2500000, 6000000),
  ('Data Scientist', 'Master data analysis and machine learning', 'Data Science', 3500000, 7000000),
  ('Cloud Architect', 'Design and manage cloud infrastructure', 'Cloud Computing', 4000000, 7500000),
  ('AI Engineer', 'Build intelligent systems with AI/ML', 'Artificial Intelligence', 4500000, 8000000),
  ('DevOps Engineer', 'Manage infrastructure and deployment', 'DevOps', 3500000, 6500000);

-- 20. Insert Career Path Skills
INSERT INTO career_path_skills (career_path_id, skill_id, required_proficiency, priority_order)
VALUES
  ((SELECT id FROM career_paths WHERE title = 'Full Stack Developer'), (SELECT id FROM skills WHERE name = 'JavaScript'), 'advanced', 1),
  ((SELECT id FROM career_paths WHERE title = 'Full Stack Developer'), (SELECT id FROM skills WHERE name = 'React'), 'advanced', 2),
  ((SELECT id FROM career_paths WHERE title = 'Full Stack Developer'), (SELECT id FROM skills WHERE name = 'Node.js'), 'advanced', 3),
  ((SELECT id FROM career_paths WHERE title = 'Data Scientist'), (SELECT id FROM skills WHERE name = 'Python'), 'expert', 1),
  ((SELECT id FROM career_paths WHERE title = 'Data Scientist'), (SELECT id FROM skills WHERE name = 'Machine Learning'), 'advanced', 2),
  ((SELECT id FROM career_paths WHERE title = 'Data Scientist'), (SELECT id FROM skills WHERE name = 'SQL'), 'advanced', 3),
  ((SELECT id FROM career_paths WHERE title = 'Cloud Architect'), (SELECT id FROM skills WHERE name = 'AWS'), 'expert', 1),
  ((SELECT id FROM career_paths WHERE title = 'Cloud Architect'), (SELECT id FROM skills WHERE name = 'Kubernetes'), 'advanced', 2),
  ((SELECT id FROM career_paths WHERE title = 'AI Engineer'), (SELECT id FROM skills WHERE name = 'Python'), 'expert', 1),
  ((SELECT id FROM career_paths WHERE title = 'AI Engineer'), (SELECT id FROM skills WHERE name = 'Machine Learning'), 'expert', 2),
  ((SELECT id FROM career_paths WHERE title = 'DevOps Engineer'), (SELECT id FROM skills WHERE name = 'Docker'), 'advanced', 1),
  ((SELECT id FROM career_paths WHERE title = 'DevOps Engineer'), (SELECT id FROM skills WHERE name = 'Kubernetes'), 'advanced', 2),
  ((SELECT id FROM career_paths WHERE title = 'DevOps Engineer'), (SELECT id FROM skills WHERE name = 'AWS'), 'advanced', 3);

-- 21. Insert Endorsements
INSERT INTO endorsements (user_id, skill_id, endorsed_by_user_id)
VALUES
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), (SELECT id FROM skills WHERE name = 'JavaScript'), (SELECT id FROM users WHERE email = 'david.kamara@example.com')),
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), (SELECT id FROM skills WHERE name = 'React'), (SELECT id FROM users WHERE email = 'david.kamara@example.com')),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), (SELECT id FROM skills WHERE name = 'Python'), (SELECT id FROM users WHERE email = 'john.stevens@example.com')),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), (SELECT id FROM skills WHERE name = 'Machine Learning'), (SELECT id FROM users WHERE email = 'john.stevens@example.com')),
  ((SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), (SELECT id FROM skills WHERE name = 'AWS'), (SELECT id FROM users WHERE email = 'hassan.bah@example.com')),
  ((SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), (SELECT id FROM skills WHERE name = 'Docker'), (SELECT id FROM users WHERE email = 'hassan.bah@example.com'));

-- 22. Insert Feed Items
INSERT INTO feed_items (user_id, feed_type, title, description, created_at)
VALUES
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), 'project_completed', 'Completed E-Commerce Platform', 'Successfully launched full-stack e-commerce application with React and Node.js', '2023-06-30'),
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), 'skill_endorsed', 'JavaScript skill endorsed', 'David Kamara endorsed your JavaScript skill', '2023-12-10'),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), 'course_completed', 'Completed Machine Learning Course', 'Finished advanced ML specialization on Coursera', '2023-09-15'),
  ((SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), 'certification_earned', 'Earned CKA Certification', 'Successfully obtained Kubernetes Administrator certification', '2023-09-30'),
  ((SELECT id FROM users WHERE email = 'amara.conteh@example.com'), 'course_started', 'Started UI Design Course', 'Enrolled in UI Design Principles on Skillshare', '2023-10-01');

-- 23. Insert User Learning Paths
INSERT INTO user_learning_paths (user_id, learning_path_id, status, progress_percentage, enrolled_at)
VALUES
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), (SELECT id FROM learning_paths WHERE title = 'Full Stack Web Development'), 'completed', 100.0, '2023-01-15'),
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), (SELECT id FROM learning_paths WHERE title = 'Cloud Infrastructure Mastery'), 'in_progress', 50.0, '2023-11-01'),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), (SELECT id FROM learning_paths WHERE title = 'Data Science Fundamentals'), 'completed', 100.0, '2023-06-01'),
  ((SELECT id FROM users WHERE email = 'amara.conteh@example.com'), (SELECT id FROM learning_paths WHERE title = 'UI/UX Design Essentials'), 'in_progress', 45.0, '2023-09-01'),
  ((SELECT id FROM users WHERE email = 'hassan.bah@example.com'), (SELECT id FROM learning_paths WHERE title = 'Cloud Infrastructure Mastery'), 'in_progress', 35.0, '2023-10-15');

-- 24. Insert Activity Log
INSERT INTO activity_log (user_id, activity_type, description, metadata)
VALUES
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), 'job_application', 'Applied for Senior Full Stack Developer position', '{"opportunity_id": "...", "company": "Tech Innovation Labs"}'),
  ((SELECT id FROM users WHERE email = 'aisha.sesay@example.com'), 'profile_update', 'Updated profile information', '{"fields_updated": ["headline", "bio"]}'),
  ((SELECT id FROM users WHERE email = 'david.kamara@example.com'), 'connection_accepted', 'Accepted connection request from Aisha', '{"user_id": "..."}'),
  ((SELECT id FROM users WHERE email = 'zainab.bangura@example.com'), 'skill_added', 'Added AWS skill to profile', '{"skill": "AWS", "proficiency": "advanced"}'),
  ((SELECT id FROM users WHERE email = 'hassan.bah@example.com'), 'course_progress', 'Completed Docker & Kubernetes module', '{"course": "Docker & Kubernetes Masterclass", "progress": 40}');
