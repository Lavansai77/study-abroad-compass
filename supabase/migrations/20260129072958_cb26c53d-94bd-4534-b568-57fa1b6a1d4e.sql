-- Create profiles table for user onboarding data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Academic Background
  education_level TEXT,
  degree_major TEXT,
  graduation_year INTEGER,
  gpa TEXT,
  
  -- Study Goals
  intended_degree TEXT,
  field_of_study TEXT,
  target_intake_year INTEGER,
  preferred_countries TEXT[],
  
  -- Budget
  budget_range TEXT,
  funding_plan TEXT,
  
  -- Exams & Readiness
  ielts_toefl_status TEXT,
  gre_gmat_status TEXT,
  sop_status TEXT,
  
  -- Onboarding Status
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  current_stage INTEGER NOT NULL DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Create universities table (dummy data for demo)
CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  ranking INTEGER,
  tuition_min INTEGER,
  tuition_max INTEGER,
  acceptance_rate TEXT,
  programs TEXT[],
  description TEXT,
  requirements TEXT,
  deadline_fall TEXT,
  deadline_spring TEXT,
  category TEXT, -- dream, target, safe
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Universities table is public for reading
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view universities"
ON public.universities FOR SELECT
USING (true);

-- Create shortlisted_universities table
CREATE TABLE public.shortlisted_universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'shortlisted', -- shortlisted, locked, applied
  risk_level TEXT,
  fit_score INTEGER,
  notes TEXT,
  locked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, university_id)
);

-- Enable RLS
ALTER TABLE public.shortlisted_universities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shortlisted_universities
CREATE POLICY "Users can view their own shortlisted universities"
ON public.shortlisted_universities FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can shortlist universities"
ON public.shortlisted_universities FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their shortlisted universities"
ON public.shortlisted_universities FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove shortlisted universities"
ON public.shortlisted_universities FOR DELETE
USING (auth.uid() = user_id);

-- Create todos table
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- sop, exam, document, application
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for todos
CREATE POLICY "Users can view their own todos"
ON public.todos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own todos"
ON public.todos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos"
ON public.todos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos"
ON public.todos FOR DELETE
USING (auth.uid() = user_id);

-- Create chat_messages table for AI conversations
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_messages
CREATE POLICY "Users can view their own messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shortlisted_updated_at
BEFORE UPDATE ON public.shortlisted_universities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_todos_updated_at
BEFORE UPDATE ON public.todos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample university data
INSERT INTO public.universities (name, country, ranking, tuition_min, tuition_max, acceptance_rate, programs, description, requirements, deadline_fall, deadline_spring, category) VALUES
('MIT', 'USA', 1, 55000, 60000, '4%', ARRAY['Computer Science', 'Engineering', 'Business'], 'Massachusetts Institute of Technology - World-leading research university', 'GRE 320+, TOEFL 100+, GPA 3.8+', 'December 15', 'N/A', 'dream'),
('Stanford University', 'USA', 3, 56000, 62000, '4%', ARRAY['Computer Science', 'Engineering', 'MBA', 'Data Science'], 'Stanford University - Innovation hub in Silicon Valley', 'GRE 325+, TOEFL 100+, GPA 3.8+', 'December 1', 'N/A', 'dream'),
('University of Oxford', 'UK', 4, 35000, 45000, '17%', ARRAY['Business', 'Engineering', 'Sciences', 'Arts'], 'University of Oxford - Oldest English-speaking university', 'IELTS 7.5+, Strong academics', 'January 15', 'N/A', 'dream'),
('University of Cambridge', 'UK', 5, 33000, 42000, '21%', ARRAY['Engineering', 'Sciences', 'Mathematics', 'Business'], 'University of Cambridge - World-class research institution', 'IELTS 7.5+, Strong academics', 'December 1', 'N/A', 'dream'),
('ETH Zurich', 'Switzerland', 8, 1500, 3000, '27%', ARRAY['Engineering', 'Computer Science', 'Sciences'], 'ETH Zurich - Top European tech university with low tuition', 'GRE recommended, Strong STEM background', 'December 15', 'N/A', 'target'),
('University of Toronto', 'Canada', 18, 45000, 55000, '43%', ARRAY['Computer Science', 'Engineering', 'Business', 'Sciences'], 'University of Toronto - Canada''s leading research university', 'IELTS 6.5+, GPA 3.5+', 'January 15', 'March 1', 'target'),
('University of Melbourne', 'Australia', 33, 35000, 45000, '55%', ARRAY['Business', 'Engineering', 'Sciences', 'Arts'], 'University of Melbourne - Australia''s top university', 'IELTS 6.5+, Bachelor''s degree', 'October 31', 'April 30', 'target'),
('Technical University of Munich', 'Germany', 50, 500, 2000, '40%', ARRAY['Engineering', 'Computer Science', 'Sciences'], 'TU Munich - Leading German tech university with minimal tuition', 'German/English proficiency, Strong academics', 'May 31', 'November 30', 'target'),
('University of British Columbia', 'Canada', 35, 40000, 50000, '52%', ARRAY['Computer Science', 'Engineering', 'Business'], 'UBC - Beautiful campus with strong programs', 'IELTS 6.5+, GPA 3.3+', 'January 15', 'March 1', 'target'),
('Arizona State University', 'USA', 121, 30000, 40000, '88%', ARRAY['Business', 'Engineering', 'Computer Science'], 'ASU - Innovation university with high acceptance', 'TOEFL 80+, GPA 3.0+', 'Rolling', 'Rolling', 'safe'),
('University of Arizona', 'USA', 150, 28000, 38000, '85%', ARRAY['Engineering', 'Sciences', 'Business'], 'University of Arizona - Strong STEM programs', 'TOEFL 79+, GPA 2.75+', 'May 1', 'October 1', 'safe'),
('RMIT University', 'Australia', 190, 28000, 38000, '75%', ARRAY['Business', 'IT', 'Engineering', 'Design'], 'RMIT - Practical, industry-focused education', 'IELTS 6.0+, Bachelor''s degree', 'Rolling', 'Rolling', 'safe'),
('University of Ottawa', 'Canada', 145, 30000, 40000, '65%', ARRAY['Business', 'Engineering', 'Sciences', 'Law'], 'University of Ottawa - Bilingual research university', 'IELTS 6.5+, GPA 3.0+', 'April 1', 'November 1', 'safe'),
('University of Wollongong', 'Australia', 196, 25000, 35000, '70%', ARRAY['IT', 'Engineering', 'Business', 'Sciences'], 'University of Wollongong - Strong industry connections', 'IELTS 6.0+, Bachelor''s degree', 'Rolling', 'Rolling', 'safe');