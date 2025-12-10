-- RPC Function: get_task_closure_time_by_priority
-- Returns average closure time in hours grouped by priority level
-- Also returns weighted average considering urgency (urgent tasks weighted higher)
-- Includes date filtering on created_at

CREATE OR REPLACE FUNCTION get_task_closure_time_by_priority(
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  priority TEXT,
  priority_weight INTEGER,
  total_completed BIGINT,
  avg_closure_hours NUMERIC,
  min_closure_hours NUMERIC,
  max_closure_hours NUMERIC,
  median_closure_hours NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH completed_tasks AS (
    SELECT
      t.id,
      COALESCE(t.priority, 'medium') AS priority,
      EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 3600.0 AS closure_hours
    FROM tasks t
    WHERE t.status = 'completed'
      AND t.updated_at IS NOT NULL
      AND t.created_at IS NOT NULL
      AND (date_from IS NULL OR t.created_at >= date_from)
      AND (date_to IS NULL OR t.created_at <= date_to)
  ),
  priority_stats AS (
    SELECT
      ct.priority,
      CASE ct.priority
        WHEN 'urgent' THEN 4
        WHEN 'important' THEN 3
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 1
        ELSE 2
      END AS priority_weight,
      COUNT(*)::BIGINT AS total_completed,
      ROUND(AVG(ct.closure_hours)::NUMERIC, 2) AS avg_closure_hours,
      ROUND(MIN(ct.closure_hours)::NUMERIC, 2) AS min_closure_hours,
      ROUND(MAX(ct.closure_hours)::NUMERIC, 2) AS max_closure_hours,
      ROUND(
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ct.closure_hours)::NUMERIC,
        2
      ) AS median_closure_hours
    FROM completed_tasks ct
    GROUP BY ct.priority
  )
  SELECT
    ps.priority,
    ps.priority_weight,
    ps.total_completed,
    ps.avg_closure_hours,
    ps.min_closure_hours,
    ps.max_closure_hours,
    ps.median_closure_hours
  FROM priority_stats ps
  ORDER BY ps.priority_weight DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_task_closure_time_by_priority(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- Additional helper function: Get overall weighted average closure time
CREATE OR REPLACE FUNCTION get_weighted_avg_closure_time(
  date_from TIMESTAMPTZ DEFAULT NULL,
  date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  weighted_avg_hours NUMERIC,
  total_tasks BIGINT,
  urgent_contribution NUMERIC,
  important_contribution NUMERIC,
  medium_contribution NUMERIC,
  low_contribution NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH completed_tasks AS (
    SELECT
      t.id,
      COALESCE(t.priority, 'medium') AS priority,
      EXTRACT(EPOCH FROM (t.updated_at - t.created_at)) / 3600.0 AS closure_hours,
      CASE COALESCE(t.priority, 'medium')
        WHEN 'urgent' THEN 4
        WHEN 'important' THEN 3
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 1
        ELSE 2
      END AS weight
    FROM tasks t
    WHERE t.status = 'completed'
      AND t.updated_at IS NOT NULL
      AND t.created_at IS NOT NULL
      AND (date_from IS NULL OR t.created_at >= date_from)
      AND (date_to IS NULL OR t.created_at <= date_to)
  )
  SELECT
    ROUND(
      SUM(ct.closure_hours * ct.weight) / NULLIF(SUM(ct.weight), 0)::NUMERIC,
      2
    ) AS weighted_avg_hours,
    COUNT(*)::BIGINT AS total_tasks,
    ROUND(
      SUM(CASE WHEN ct.priority = 'urgent' THEN ct.closure_hours * ct.weight ELSE 0 END) /
      NULLIF(SUM(ct.weight), 0)::NUMERIC,
      2
    ) AS urgent_contribution,
    ROUND(
      SUM(CASE WHEN ct.priority = 'important' THEN ct.closure_hours * ct.weight ELSE 0 END) /
      NULLIF(SUM(ct.weight), 0)::NUMERIC,
      2
    ) AS important_contribution,
    ROUND(
      SUM(CASE WHEN ct.priority = 'medium' THEN ct.closure_hours * ct.weight ELSE 0 END) /
      NULLIF(SUM(ct.weight), 0)::NUMERIC,
      2
    ) AS medium_contribution,
    ROUND(
      SUM(CASE WHEN ct.priority = 'low' THEN ct.closure_hours * ct.weight ELSE 0 END) /
      NULLIF(SUM(ct.weight), 0)::NUMERIC,
      2
    ) AS low_contribution
  FROM completed_tasks ct;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_weighted_avg_closure_time(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
