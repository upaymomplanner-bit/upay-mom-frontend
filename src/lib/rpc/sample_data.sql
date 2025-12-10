-- Sample Data for Testing Analytics
-- Run this in Supabase SQL Editor after creating the RPC functions
-- This creates sample cities, departments, teams, and tasks
-- IDs are auto-generated, relationships maintained via DO blocks

-- ============================================
-- CLEANUP (Optional - uncomment to clear test data first)
-- ============================================
-- DELETE FROM tasks WHERE title LIKE '[TEST]%';
-- DELETE FROM teams WHERE name LIKE 'Mumbai%' OR name LIKE 'Bangalore%' OR name LIKE 'Delhi%' OR name LIKE 'Pune%';
-- DELETE FROM departments WHERE name IN ('Engineering', 'Marketing', 'Sales', 'Operations', 'HR');
-- DELETE FROM cities WHERE name IN ('Mumbai', 'Bangalore', 'Delhi', 'Pune');

-- ============================================
-- INSERT DATA WITH AUTO-GENERATED IDs
-- ============================================
DO $$
DECLARE
  -- City IDs
  v_mumbai_id UUID;
  v_bangalore_id UUID;
  v_delhi_id UUID;
  v_pune_id UUID;

  -- Department IDs
  v_engineering_id UUID;
  v_marketing_id UUID;
  v_sales_id UUID;
  v_operations_id UUID;
  v_hr_id UUID;

  -- Team IDs (for reference)
  v_team_id UUID;

BEGIN
  -- ============================================
  -- 1. CITIES
  -- ============================================
  INSERT INTO cities (name, state, country) VALUES ('Mumbai', 'Maharashtra', 'India')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_mumbai_id;
  IF v_mumbai_id IS NULL THEN SELECT id INTO v_mumbai_id FROM cities WHERE name = 'Mumbai'; END IF;

  INSERT INTO cities (name, state, country) VALUES ('Bangalore', 'Karnataka', 'India')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_bangalore_id;
  IF v_bangalore_id IS NULL THEN SELECT id INTO v_bangalore_id FROM cities WHERE name = 'Bangalore'; END IF;

  INSERT INTO cities (name, state, country) VALUES ('Delhi', 'Delhi', 'India')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_delhi_id;
  IF v_delhi_id IS NULL THEN SELECT id INTO v_delhi_id FROM cities WHERE name = 'Delhi'; END IF;

  INSERT INTO cities (name, state, country) VALUES ('Pune', 'Maharashtra', 'India')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_pune_id;
  IF v_pune_id IS NULL THEN SELECT id INTO v_pune_id FROM cities WHERE name = 'Pune'; END IF;

  RAISE NOTICE 'Cities created: Mumbai=%, Bangalore=%, Delhi=%, Pune=%', v_mumbai_id, v_bangalore_id, v_delhi_id, v_pune_id;

  -- ============================================
  -- 2. DEPARTMENTS
  -- ============================================
  INSERT INTO departments (name, description) VALUES ('Engineering', 'Software development and technical operations')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_engineering_id;
  IF v_engineering_id IS NULL THEN SELECT id INTO v_engineering_id FROM departments WHERE name = 'Engineering'; END IF;

  INSERT INTO departments (name, description) VALUES ('Marketing', 'Brand management and customer acquisition')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_marketing_id;
  IF v_marketing_id IS NULL THEN SELECT id INTO v_marketing_id FROM departments WHERE name = 'Marketing'; END IF;

  INSERT INTO departments (name, description) VALUES ('Sales', 'Revenue generation and client relationships')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_sales_id;
  IF v_sales_id IS NULL THEN SELECT id INTO v_sales_id FROM departments WHERE name = 'Sales'; END IF;

  INSERT INTO departments (name, description) VALUES ('Operations', 'Day-to-day business operations')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_operations_id;
  IF v_operations_id IS NULL THEN SELECT id INTO v_operations_id FROM departments WHERE name = 'Operations'; END IF;

  INSERT INTO departments (name, description) VALUES ('HR', 'Human resources and talent management')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_hr_id;
  IF v_hr_id IS NULL THEN SELECT id INTO v_hr_id FROM departments WHERE name = 'HR'; END IF;

  RAISE NOTICE 'Departments created: Engineering=%, Marketing=%, Sales=%, Operations=%, HR=%', v_engineering_id, v_marketing_id, v_sales_id, v_operations_id, v_hr_id;

  -- ============================================
  -- 3. TEAMS (linking departments to cities)
  -- ============================================
  -- Mumbai teams
  INSERT INTO teams (name, department_id, city_id) VALUES ('Mumbai Engineering', v_engineering_id, v_mumbai_id) ON CONFLICT DO NOTHING;
  INSERT INTO teams (name, department_id, city_id) VALUES ('Mumbai Marketing', v_marketing_id, v_mumbai_id) ON CONFLICT DO NOTHING;
  INSERT INTO teams (name, department_id, city_id) VALUES ('Mumbai Sales', v_sales_id, v_mumbai_id) ON CONFLICT DO NOTHING;

  -- Bangalore teams
  INSERT INTO teams (name, department_id, city_id) VALUES ('Bangalore Engineering', v_engineering_id, v_bangalore_id) ON CONFLICT DO NOTHING;
  INSERT INTO teams (name, department_id, city_id) VALUES ('Bangalore Operations', v_operations_id, v_bangalore_id) ON CONFLICT DO NOTHING;

  -- Delhi teams
  INSERT INTO teams (name, department_id, city_id) VALUES ('Delhi Sales', v_sales_id, v_delhi_id) ON CONFLICT DO NOTHING;
  INSERT INTO teams (name, department_id, city_id) VALUES ('Delhi HR', v_hr_id, v_delhi_id) ON CONFLICT DO NOTHING;

  -- Pune teams
  INSERT INTO teams (name, department_id, city_id) VALUES ('Pune Engineering', v_engineering_id, v_pune_id) ON CONFLICT DO NOTHING;
  INSERT INTO teams (name, department_id, city_id) VALUES ('Pune Marketing', v_marketing_id, v_pune_id) ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Teams created for all cities';

  -- ============================================
  -- 4. SAMPLE TASKS (Various statuses, priorities, closure times)
  -- ============================================

  -- MUMBAI ENGINEERING - Completed tasks (various closure times)
  INSERT INTO tasks (title, description, status, priority, department_id, due_date, created_at, updated_at) VALUES
    ('[TEST] Build user authentication', 'Implement OAuth2 login flow', 'completed', 'urgent', v_engineering_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days'),
    ('[TEST] Database optimization', 'Improve query performance', 'completed', 'important', v_engineering_id, NOW() - INTERVAL '3 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '8 days'),
    ('[TEST] API documentation', 'Document REST endpoints', 'completed', 'medium', v_engineering_id, NOW() - INTERVAL '7 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '12 days'),
    ('[TEST] Code review guidelines', 'Create PR review checklist', 'completed', 'low', v_engineering_id, NOW() + INTERVAL '5 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days');

  -- MUMBAI ENGINEERING - In progress tasks
  INSERT INTO tasks (title, description, status, priority, department_id, due_date, created_at, updated_at) VALUES
    ('[TEST] Implement caching layer', 'Add Redis caching', 'in_progress', 'urgent', v_engineering_id, NOW() + INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
    ('[TEST] Mobile app integration', 'Connect mobile app to API', 'in_progress', 'important', v_engineering_id, NOW() + INTERVAL '7 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days');

  -- MUMBAI ENGINEERING - Todo tasks
  INSERT INTO tasks (title, description, status, priority, department_id, due_date, created_at, updated_at) VALUES
    ('[TEST] Security audit', 'Perform penetration testing', 'todo', 'urgent', v_engineering_id, NOW() + INTERVAL '10 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('[TEST] Performance monitoring', 'Set up APM tools', 'todo', 'medium', v_engineering_id, NOW() + INTERVAL '14 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

  -- MUMBAI ENGINEERING - Overdue tasks
  INSERT INTO tasks (title, description, status, priority, department_id, due_date, created_at, updated_at) VALUES
    ('[TEST] Fix critical bug', 'Memory leak in production', 'in_progress', 'urgent', v_engineering_id, NOW() - INTERVAL '2 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day');

  -- MUMBAI MARKETING - Mixed statuses
  INSERT INTO tasks (title, description, status, priority, department_id, due_date, created_at, updated_at) VALUES
    ('[TEST] Q4 campaign launch', 'Launch holiday marketing', 'completed', 'urgent', v_marketing_id, NOW() - INTERVAL '1 day', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
    ('[TEST] Social media strategy', 'Plan Instagram content', 'completed', 'important', v_marketing_id, NOW() - INTERVAL '3 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '5 days'),
    ('[TEST] Brand guidelines update', 'Refresh brand colors', 'in_progress', 'medium', v_marketing_id, NOW() + INTERVAL '5 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day'),
    ('[TEST] Website redesign', 'New landing page', 'todo', 'important', v_marketing_id, NOW() + INTERVAL '20 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

  -- MUMBAI SALES - Mixed statuses
  INSERT INTO tasks (title, description, status, priority, department_id, due_date, created_at, updated_at) VALUES
    ('[TEST] Enterprise deal closure', 'Close ABC Corp deal', 'completed', 'urgent', v_sales_id, NOW() - INTERVAL '10 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '11 days'),
    ('[TEST] Lead qualification', 'Review 50 new leads', 'completed', 'medium', v_sales_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days'),
    ('[TEST] Sales presentation', 'Prepare pitch deck', 'in_progress', 'important', v_sales_id, NOW() + INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');

  -- BANGALORE ENGINEERING - Completed tasks (fast closure)
  INSERT INTO tasks (title, description, status, priority, department_id, due_date, created_at, updated_at) VALUES
    ('[TEST] Deploy microservices', 'Kubernetes deployment', 'completed', 'urgent', v_engineering_id, NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
    ('[TEST] CI/CD pipeline', 'Set up GitHub Actions', 'completed', 'important', v_engineering_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '6 days'),
    ('[TEST] Unit test coverage', 'Increase coverage to 80%', 'completed', 'medium', v_engineering_id, NOW() - INTERVAL '7 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '8 days'),
    ('[TEST] Technical debt cleanup', 'Refactor legacy code', 'in_progress', 'low', v_engineering_id, NOW() + INTERVAL '30 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days'),
    ('[TEST] Load testing', 'Test API under load', 'todo', 'important', v_engineering_id, NOW() + INTERVAL '14 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

  -- BANGALORE OPERATIONS - Mixed statuses
  INSERT INTO tasks (title, description, status, priority, department_id, due_date, created_at, updated_at) VALUES
    ('[TEST] Vendor onboarding', 'Onboard 3 new vendors', 'completed', 'important', v_operations_id, NOW() - INTERVAL '3 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '4 days'),
    ('[TEST] Process automation', 'Automate invoicing', 'completed', 'medium', v_operations_id, NOW() - INTERVAL '10 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '18 days'),
    ('[TEST] Inventory audit', 'Q4 inventory check', 'in_progress', 'urgent', v_operations_id, NOW() + INTERVAL '5 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
    ('[TEST] SOP documentation', 'Update process docs', 'todo', 'low', v_operations_id, NOW() + INTERVAL '30 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

  -- DELHI SALES - Completed and overdue
  INSERT INTO tasks (title, description, status, priority, department_id, due_date, created_at, updated_at) VALUES
    ('[TEST] North region expansion', 'Open 5 new accounts', 'completed', 'urgent', v_sales_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '10 days'),
    ('[TEST] Partner program', 'Launch reseller network', 'completed', 'important', v_sales_id, NOW() - INTERVAL '15 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '20 days'),
    ('[TEST] Government tender', 'Submit RFP response', 'in_progress', 'urgent', v_sales_id, NOW() - INTERVAL '1 day', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
    ('[TEST] Sales training', 'Train new hires', 'todo', 'medium', v_sales_id, NOW() + INTERVAL '10 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

  -- DELHI HR - Mixed statuses
  INSERT INTO tasks (title, description, status, priority, department_id, due_date, created_at, updated_at) VALUES
    ('[TEST] Recruitment drive', 'Hire 10 engineers', 'completed', 'urgent', v_hr_id, NOW() - INTERVAL '20 days', NOW() - INTERVAL '45 days', NOW() - INTERVAL '30 days'),
    ('[TEST] Employee handbook', 'Update policies', 'completed', 'low', v_hr_id, NOW() - INTERVAL '30 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '40 days'),
    ('[TEST] Performance reviews', 'Q4 reviews', 'in_progress', 'important', v_hr_id, NOW() + INTERVAL '7 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
    ('[TEST] Benefits enrollment', 'Open enrollment period', 'todo', 'medium', v_hr_id, NOW() + INTERVAL '30 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

  -- PUNE ENGINEERING - Fast closures
  INSERT INTO tasks (title, description, status, priority, department_id, due_date, created_at, updated_at) VALUES
    ('[TEST] Bug fix sprint', 'Fix 20 critical bugs', 'completed', 'urgent', v_engineering_id, NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
    ('[TEST] Feature release', 'Deploy v2.0', 'completed', 'urgent', v_engineering_id, NOW() - INTERVAL '7 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days'),
    ('[TEST] Code migration', 'Migrate to TypeScript', 'completed', 'important', v_engineering_id, NOW() - INTERVAL '14 days', NOW() - INTERVAL '21 days', NOW() - INTERVAL '16 days'),
    ('[TEST] Testing framework', 'Set up Playwright', 'in_progress', 'medium', v_engineering_id, NOW() + INTERVAL '10 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
    ('[TEST] Documentation site', 'Build docs with Docusaurus', 'todo', 'low', v_engineering_id, NOW() + INTERVAL '21 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

  -- PUNE MARKETING - Slow closures
  INSERT INTO tasks (title, description, status, priority, department_id, due_date, created_at, updated_at) VALUES
    ('[TEST] Brand awareness campaign', 'Launch billboard ads', 'completed', 'important', v_marketing_id, NOW() - INTERVAL '30 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '35 days'),
    ('[TEST] Customer survey', 'Annual satisfaction survey', 'completed', 'medium', v_marketing_id, NOW() - INTERVAL '20 days', NOW() - INTERVAL '50 days', NOW() - INTERVAL '30 days'),
    ('[TEST] Event planning', 'Annual conference', 'in_progress', 'urgent', v_marketing_id, NOW() + INTERVAL '30 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days'),
    ('[TEST] Newsletter redesign', 'Update email templates', 'todo', 'low', v_marketing_id, NOW() + INTERVAL '45 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

  RAISE NOTICE 'All test tasks created successfully!';

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check inserted data counts
SELECT 'Cities' as table_name, COUNT(*) as count FROM cities WHERE name IN ('Mumbai', 'Bangalore', 'Delhi', 'Pune')
UNION ALL
SELECT 'Departments', COUNT(*) FROM departments WHERE name IN ('Engineering', 'Marketing', 'Sales', 'Operations', 'HR')
UNION ALL
SELECT 'Teams', COUNT(*) FROM teams WHERE name LIKE 'Mumbai%' OR name LIKE 'Bangalore%' OR name LIKE 'Delhi%' OR name LIKE 'Pune%'
UNION ALL
SELECT 'Tasks', COUNT(*) FROM tasks WHERE title LIKE '[TEST]%';

-- Summary by status
SELECT status, COUNT(*) as count
FROM tasks
WHERE title LIKE '[TEST]%'
GROUP BY status
ORDER BY status;

-- Summary by priority
SELECT priority, COUNT(*) as count
FROM tasks
WHERE title LIKE '[TEST]%'
GROUP BY priority
ORDER BY
  CASE priority
    WHEN 'urgent' THEN 1
    WHEN 'important' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- ============================================
-- TEST RPC FUNCTIONS
-- ============================================

-- Test tasks by city
SELECT '=== Tasks by City ===' as test;
SELECT * FROM get_tasks_by_city();

-- Test department progress
SELECT '=== Department Progress (All Cities) ===' as test;
SELECT * FROM get_city_department_progress() LIMIT 15;

-- Test closure time by priority
SELECT '=== Closure Time by Priority ===' as test;
SELECT * FROM get_task_closure_time_by_priority();

-- Test weighted average
SELECT '=== Weighted Average Closure Time ===' as test;
SELECT * FROM get_weighted_avg_closure_time();

-- Test closure time by city
SELECT '=== Closure Time by City ===' as test;
SELECT * FROM get_closure_time_by_city();

-- Test closure time by location (city + department)
SELECT '=== Closure Time by Location ===' as test;
SELECT * FROM get_closure_time_by_location() LIMIT 15;
