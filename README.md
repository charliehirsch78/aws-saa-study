# AWS SAA-C03 Study App

Study tool for the AWS Solutions Architect Associate exam. 824 questions with explanations, per-topic tracking, and missed-question prioritization.

## Setup

### 1. Supabase

Create a project at [supabase.com](https://supabase.com), then run this SQL in the **SQL Editor**:

```sql
-- Question progress tracking
create table if not exists user_question_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  question_number int not null,
  times_seen int default 0,
  times_correct int default 0,
  last_seen_at timestamptz,
  last_correct_at timestamptz,
  unique(user_id, question_number)
);

alter table user_question_progress enable row level security;

create policy "Users manage own progress"
  on user_question_progress
  for all
  using (auth.uid() = user_id);

-- Study session history
create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  started_at timestamptz default now(),
  completed_at timestamptz,
  total_questions int,
  correct_count int,
  topic_filter text,
  missed_question_numbers int[]
);

alter table study_sessions enable row level security;

create policy "Users manage own sessions"
  on study_sessions
  for all
  using (auth.uid() = user_id);
```

### 2. Environment

```bash
cp .env.example .env
# Fill in your Supabase URL and anon key from Project Settings → API
```

### 3. Install & Run

```bash
npm install
npm run dev
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel project settings
```

Or connect GitHub repo to Vercel for auto-deploy.

## Features

- **824 questions** from SAA-C03 exam prep material
- **18 topic categories** (EC2, S3, VPC, IAM, Lambda, RDS, etc.)
- **Missed-first sessions** — questions you got wrong are prioritized next time
- **Per-topic breakdown** — see accuracy by topic on the dashboard
- **Deck completion tracking** — X of 824 questions seen
- **Cross-device sync** via Supabase auth
- **Configurable sessions** — 10, 20, 50, 100, or custom question count
- **Topic filtering** — focus on weak areas

## AWS Passing Score

The SAA-C03 exam requires **72%** to pass. The app highlights when you hit that threshold in session results.
