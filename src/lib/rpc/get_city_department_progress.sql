-- RPC Function: get_city_department_progress
-- Returns task progress per department, optionally filtered by city
-- Uses BOTH paths: assignee→team→city AND department→team→city
-- Includes date filtering on created_at

CREATE OR REPLACE FUNCTION get_city_department_progress(
  filter_city_id UUID DEFAULT NULL,
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  city_id UUID,
  city_name TEXT,
  department_id UUID,
  department_name TEXT,
  total_tasks BIGINT,
  todo_tasks BIGINT,
  in_progress_tasks BIGINT,
  completed_tasks BIGINT,
  overdue_tasks BIGINT,
  completion_rate NUMERIC,
  avg_completion_time_hours NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH dept_city_tasks AS (
    -- Path 1: Tasks via assignee → profiles → teams → cities
    SELECT DISTINCT
      t.id AS task_id,
      c.id AS city_id,
      c.name AS city_name,
      COALESCE(t.department_id, p.department_id) AS department_id,
      t.status,
      t.due_date,
      t.created_at,
      t.updated_at
    FROM tasks t
    INNER JOIN profiles p ON t.assignee_id = p.id
    INNER JOIN teams tm ON p.team_id = tm.id
    INNER JOIN cities c ON tm.city_id = c.id
    WHERE (filter_city_id IS NULL OR c.id = filter_city_id)
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
      t.due_date,
      t.created_at,
      t.updated_at
    FROM tasks t
    INNER JOIN departments d ON t.department_id = d.id
    INNER JOIN teams tm ON tm.department_id = d.id
    INNER JOIN cities c ON tm.city_id = c.id
    WHERE (filter_city_id IS NULL OR c.id = filter_city_id)
      AND (date_from IS NULL OR t.created_at >= date_from)
      AND (date_to IS NULL OR t.created_at <= date_to)
  ),
  tasks_with_dept AS (
    SELECT
      dct.*,
      dep.name AS dept_name
    FROM dept_city_tasks dct
    LEFT JOIN departments dep ON dct.department_id = dep.id
    WHERE dct.department_id IS NOT NULL
  )
  SELECT
    twd.city_id,
    twd.city_name,
    twd.department_id,
    COALESCE(twd.dept_name, 'Unassigned')::TEXT AS department_name,
    COUNT(DISTINCT twd.task_id)::BIGINT AS total_tasks,
    COUNT(DISTINCT twd.task_id) FILTER (WHERE twd.status = 'todo')::BIGINT AS todo_tasks,
    COUNT(DISTINCT twd.task_id) FILTER (WHERE twd.status = 'in_progress')::BIGINT AS in_progress_tasks,
    COUNT(DISTINCT twd.task_id) FILTER (WHERE twd.status = 'completed')::BIGINT AS completed_tasks,
    COUNT(DISTINCT twd.task_id) FILTER (
      WHERE twd.status != 'completed'
      AND twd.due_date IS NOT NULL
      AND twd.due_date < NOW()
    )::BIGINT AS overdue_tasks,
    CASE
      WHEN COUNT(DISTINCT twd.task_id) > 0
      THEN ROUND(
        (COUNT(DISTINCT twd.task_id) FILTER (WHERE twd.status = 'completed')::NUMERIC /
         COUNT(DISTINCT twd.task_id)::NUMERIC) * 100,
        2
      )
      ELSE 0
    END AS completion_rate,
    COALESCE(
      ROUND(
        AVG(
          CASE
            WHEN twd.status = 'completed' AND twd.updated_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (twd.updated_at - twd.created_at)) / 3600.0
            ELSE NULL
          END
        )::NUMERIC,
        2
      ),
      0
    ) AS avg_completion_time_hours
  FROM tasks_with_dept twd
  GROUP BY twd.city_id, twd.city_name, twd.department_id, twd.dept_name
  ORDER BY twd.city_name, twd.dept_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_city_department_progress(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
