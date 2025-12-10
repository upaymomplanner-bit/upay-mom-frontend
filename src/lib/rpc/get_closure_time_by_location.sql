-- RPC Function: get_closure_time_by_location
-- Returns average task closure time grouped by city and department
-- Uses BOTH paths: assignee→team→city AND department→team→city
-- Includes date filtering on created_at

CREATE OR REPLACE FUNCTION get_closure_time_by_location(
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  city_id UUID,
  city_name TEXT,
  department_id UUID,
  department_name TEXT,
  total_completed BIGINT,
  avg_closure_hours NUMERIC,
  min_closure_hours NUMERIC,
  max_closure_hours NUMERIC,
  median_closure_hours NUMERIC,
  -- Breakdown by priority
  urgent_avg_hours NUMERIC,
  important_avg_hours NUMERIC,
  medium_avg_hours NUMERIC,
  low_avg_hours NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH location_tasks AS (
    -- Path 1: Tasks via assignee → profiles → teams → cities
    SELECT DISTINCT
      t.id AS task_id,
      c.id AS city_id,
      c.name AS city_name,
      COALESCE(t.department_id, p.department_id) AS department_id,
      t.status,
      t.priority,
      t.created_at,
      t.updated_at,
      CASE
        WHEN t.status = 'completed' AND t.updated_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 3600.0
        ELSE NULL
      END AS closure_hours
    FROM tasks t
    INNER JOIN profiles p ON t.assignee_id = p.id
    INNER JOIN teams tm ON p.team_id = tm.id
    INNER JOIN cities c ON tm.city_id = c.id
    WHERE t.status = 'completed'
      AND t.updated_at IS NOT NULL
      AND (date_from IS NULL OR t.created_at >= date_from)
      AND (date_to IS NULL OR t.created_at <= date_to)

    UNION

    -- Path 2: Tasks via department → teams → cities
    SELECT DISTINCT
      t.id AS task_id,
      c.id AS city_id,
      c.name AS city_name,
      t.department_id,
      t.status,
      t.priority,
      t.created_at,
      t.updated_at,
      CASE
        WHEN t.status = 'completed' AND t.updated_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 3600.0
        ELSE NULL
      END AS closure_hours
    FROM tasks t
    INNER JOIN departments d ON t.department_id = d.id
    INNER JOIN teams tm ON tm.department_id = d.id
    INNER JOIN cities c ON tm.city_id = c.id
    WHERE t.status = 'completed'
      AND t.updated_at IS NOT NULL
      AND (date_from IS NULL OR t.created_at >= date_from)
      AND (date_to IS NULL OR t.created_at <= date_to)
  ),
  tasks_with_dept AS (
    SELECT
      lt.*,
      dep.name AS dept_name
    FROM location_tasks lt
    LEFT JOIN departments dep ON lt.department_id = dep.id
  )
  SELECT
    twd.city_id,
    twd.city_name,
    twd.department_id,
    COALESCE(twd.dept_name, 'Unassigned')::TEXT AS department_name,
    COUNT(DISTINCT twd.task_id)::BIGINT AS total_completed,
    ROUND(AVG(twd.closure_hours)::NUMERIC, 2) AS avg_closure_hours,
    ROUND(MIN(twd.closure_hours)::NUMERIC, 2) AS min_closure_hours,
    ROUND(MAX(twd.closure_hours)::NUMERIC, 2) AS max_closure_hours,
    ROUND(
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY twd.closure_hours)::NUMERIC,
      2
    ) AS median_closure_hours,
    -- Priority breakdowns
    ROUND(
      AVG(twd.closure_hours) FILTER (WHERE twd.priority = 'urgent')::NUMERIC,
      2
    ) AS urgent_avg_hours,
    ROUND(
      AVG(twd.closure_hours) FILTER (WHERE twd.priority = 'important')::NUMERIC,
      2
    ) AS important_avg_hours,
    ROUND(
      AVG(twd.closure_hours) FILTER (WHERE twd.priority = 'medium')::NUMERIC,
      2
    ) AS medium_avg_hours,
    ROUND(
      AVG(twd.closure_hours) FILTER (WHERE twd.priority = 'low')::NUMERIC,
      2
    ) AS low_avg_hours
  FROM tasks_with_dept twd
  GROUP BY twd.city_id, twd.city_name, twd.department_id, twd.dept_name
  ORDER BY twd.city_name, twd.dept_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_closure_time_by_location(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- Additional helper: Get city-level summary only (aggregated across departments)
CREATE OR REPLACE FUNCTION get_closure_time_by_city(
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  city_id UUID,
  city_name TEXT,
  total_completed BIGINT,
  avg_closure_hours NUMERIC,
  median_closure_hours NUMERIC,
  urgent_avg_hours NUMERIC,
  important_avg_hours NUMERIC,
  medium_avg_hours NUMERIC,
  low_avg_hours NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH location_tasks AS (
    -- Path 1: Tasks via assignee → profiles → teams → cities
    SELECT DISTINCT
      t.id AS task_id,
      c.id AS city_id,
      c.name AS city_name,
      t.priority,
      EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 3600.0 AS closure_hours
    FROM tasks t
    INNER JOIN profiles p ON t.assignee_id = p.id
    INNER JOIN teams tm ON p.team_id = tm.id
    INNER JOIN cities c ON tm.city_id = c.id
    WHERE t.status = 'completed'
      AND t.updated_at IS NOT NULL
      AND (date_from IS NULL OR t.created_at >= date_from)
      AND (date_to IS NULL OR t.created_at <= date_to)

    UNION

    -- Path 2: Tasks via department → teams → cities
    SELECT DISTINCT
      t.id AS task_id,
      c.id AS city_id,
      c.name AS city_name,
      t.priority,
      EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 3600.0 AS closure_hours
    FROM tasks t
    INNER JOIN departments d ON t.department_id = d.id
    INNER JOIN teams tm ON tm.department_id = d.id
    INNER JOIN cities c ON tm.city_id = c.id
    WHERE t.status = 'completed'
      AND t.updated_at IS NOT NULL
      AND (date_from IS NULL OR t.created_at >= date_from)
      AND (date_to IS NULL OR t.created_at <= date_to)
  )
  SELECT
    lt.city_id,
    lt.city_name,
    COUNT(DISTINCT lt.task_id)::BIGINT AS total_completed,
    ROUND(AVG(lt.closure_hours)::NUMERIC, 2) AS avg_closure_hours,
    ROUND(
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY lt.closure_hours)::NUMERIC,
      2
    ) AS median_closure_hours,
    ROUND(AVG(lt.closure_hours) FILTER (WHERE lt.priority = 'urgent')::NUMERIC, 2) AS urgent_avg_hours,
    ROUND(AVG(lt.closure_hours) FILTER (WHERE lt.priority = 'important')::NUMERIC, 2) AS important_avg_hours,
    ROUND(AVG(lt.closure_hours) FILTER (WHERE lt.priority = 'medium')::NUMERIC, 2) AS medium_avg_hours,
    ROUND(AVG(lt.closure_hours) FILTER (WHERE lt.priority = 'low')::NUMERIC, 2) AS low_avg_hours
  FROM location_tasks lt
  GROUP BY lt.city_id, lt.city_name
  ORDER BY lt.city_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_closure_time_by_city(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
