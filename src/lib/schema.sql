-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.analytics_snapshots (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  period_start date,
  period_end date,
  metric_type text,
  value jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_snapshots_pkey PRIMARY KEY (id)
);
CREATE TABLE public.cities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text,
  country text DEFAULT 'India'::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cities_pkey PRIMARY KEY (id)
);
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  manager_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT departments_pkey PRIMARY KEY (id),
  CONSTRAINT departments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.goals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  year integer NOT NULL,
  quarter integer CHECK (quarter >= 1 AND quarter <= 4),
  status text CHECK (status = ANY (ARRAY['on_track'::text, 'at_risk'::text, 'completed'::text])),
  department_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT goals_pkey PRIMARY KEY (id),
  CONSTRAINT goals_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id)
);
CREATE TABLE public.integration_tokens (
  user_id uuid NOT NULL,
  provider text NOT NULL,
  access_token text,
  refresh_token text,
  expires_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT integration_tokens_pkey PRIMARY KEY (user_id),
  CONSTRAINT integration_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.meeting_participants (
  meeting_id uuid NOT NULL,
  user_id uuid NOT NULL,
  CONSTRAINT meeting_participants_pkey PRIMARY KEY (meeting_id, user_id),
  CONSTRAINT meeting_participants_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id),
  CONSTRAINT meeting_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.meetings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  date timestamp with time zone NOT NULL,
  summary text,
  transcript_path text,
  host_id uuid,
  status text CHECK (status = ANY (ARRAY['processing'::text, 'completed'::text, 'failed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT meetings_pkey PRIMARY KEY (id),
  CONSTRAINT meetings_host_id_fkey FOREIGN KEY (host_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  role text CHECK (role = ANY (ARRAY['admin'::text, 'manager'::text, 'member'::text, 'host'::text])),
  department_id uuid,
  microsoft_id text UNIQUE,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  team_id uuid,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT fk_department FOREIGN KEY (department_id) REFERENCES public.departments(id),
  CONSTRAINT fk_profiles_team FOREIGN KEY (team_id) REFERENCES public.teams(id)
);
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  status text CHECK (status = ANY (ARRAY['todo'::text, 'in_progress'::text, 'completed'::text])),
  priority text CHECK (priority = ANY (ARRAY['urgent'::text, 'important'::text, 'medium'::text, 'low'::text])),
  due_date timestamp with time zone,
  meeting_id uuid,
  assignee_id uuid,
  department_id uuid,
  planner_task_id text UNIQUE,
  planner_plan_id text,
  goal_id uuid,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id),
  CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.profiles(id),
  CONSTRAINT tasks_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id),
  CONSTRAINT tasks_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id)
);
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department_id uuid,
  city_id uuid,
  lead_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT fk_teams_city FOREIGN KEY (city_id) REFERENCES public.cities(id),
  CONSTRAINT fk_teams_dept FOREIGN KEY (department_id) REFERENCES public.departments(id),
  CONSTRAINT fk_teams_lead FOREIGN KEY (lead_id) REFERENCES public.profiles(id)
);