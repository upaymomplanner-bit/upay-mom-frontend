-- RPC Function: get_goal_completion_percentage
-- Returns completion percentage for each goal based on completed tasks
-- Calculates: (completed tasks / total tasks) * 100

CREATE OR REPLACE FUNCTION get_goal_completion_percentage()
RETURNS TABLE (
  goal_id UUID,
  total_tasks BIGINT,
  completed_tasks BIGINT,
  completion_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH goal_task_stats AS (
    SELECT
      t.goal_id,
      COUNT(*)::BIGINT AS total_tasks,
      COUNT(*) FILTER (WHERE t.status = 'completed')::BIGINT AS completed_tasks
    FROM tasks t
    WHERE t.goal_id IS NOT NULL
    GROUP BY t.goal_id
  )
  SELECT
    gts.goal_id,
    gts.total_tasks,
    gts.completed_tasks,
    CASE
      WHEN gts.total_tasks = 0 THEN 0
      ELSE ROUND((gts.completed_tasks::NUMERIC / gts.total_tasks::NUMERIC) * 100, 1)
    END AS completion_percentage
  FROM goal_task_stats gts;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_goal_completion_percentage() TO authenticated;
