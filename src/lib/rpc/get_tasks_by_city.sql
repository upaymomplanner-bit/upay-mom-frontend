-- RPC Function: get_tasks_by_city
-- Returns task counts grouped by city with status breakdown
-- Uses BOTH paths: assignee→team→city AND department→team→city
-- Includes date filtering on created_at

CREATE OR REPLACE FUNCTION get_tasks_by_city(
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  city_id UUID,
  city_name TEXT,
  total_tasks BIGINT,
  todo_tasks BIGINT,
  in_progress_tasks BIGINT,
  completed_tasks BIGINT,
  overdue_tasks BIGINT,
  completion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH city_tasks AS (
    -- Path 1: Tasks via assignee → profiles → teams → cities
    SELECT DISTINCT
      t.id AS task_id,
      c.id AS city_id,
      c.name AS city_name,
      t.status,
      t.due_date,
      t.created_at
    FROM tasks t
    INNER JOIN profiles p ON t.assignee_id = p.id
    INNER JOIN teams tm ON p.team_id = tm.id
    INNER JOIN cities c ON tm.city_id = c.id
    WHERE (date_from IS NULL OR t.created_at >= date_from)
      AND (date_to IS NULL OR t.created_at <= date_to)

    UNION

    -- Path 2: Tasks via department → teams → cities
    SELECT DISTINCT
      t.id AS task_id,
      c.id AS city_id,
      c.name AS city_name,
      t.status,
      t.due_date,
      t.created_at
    FROM tasks t
    INNER JOIN departments d ON t.department_id = d.id
    INNER JOIN teams tm ON tm.department_id = d.id
    INNER JOIN cities c ON tm.city_id = c.id
    WHERE (date_from IS NULL OR t.created_at >= date_from)
      AND (date_to IS NULL OR t.created_at <= date_to)
  )
  SELECT
    ct.city_id,
    ct.city_name,
    COUNT(DISTINCT ct.task_id)::BIGINT AS total_tasks,
    COUNT(DISTINCT ct.task_id) FILTER (WHERE ct.status = 'todo')::BIGINT AS todo_tasks,
    COUNT(DISTINCT ct.task_id) FILTER (WHERE ct.status = 'in_progress')::BIGINT AS in_progress_tasks,
    COUNT(DISTINCT ct.task_id) FILTER (WHERE ct.status = 'completed')::BIGINT AS completed_tasks,
    COUNT(DISTINCT ct.task_id) FILTER (
      WHERE ct.status != 'completed'
      AND ct.due_date IS NOT NULL
      AND ct.due_date < NOW()
    )::BIGINT AS overdue_tasks,
    CASE
      WHEN COUNT(DISTINCT ct.task_id) > 0
      THEN ROUND(
        (COUNT(DISTINCT ct.task_id) FILTER (WHERE ct.status = 'completed')::NUMERIC /
         COUNT(DISTINCT ct.task_id)::NUMERIC) * 100,
        2
      )
      ELSE 0
    END AS completion_rate
  FROM city_tasks ct
  GROUP BY ct.city_id, ct.city_name
  ORDER BY ct.city_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_tasks_by_city(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
