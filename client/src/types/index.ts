export type UserRole = 'student' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  studentProfileId?: number | null;
  profile?: StudentProfile | null;
}

export interface Career {
  id: number;
  title: string;
  description: string;
  industry: string;
  average_salary?: string;
  outlook?: string;
  requiredSkills?: CareerSkillRequirement[];
}

export interface StudentProfile {
  id: number;
  user_id: number;
  university: string;
  program: string;
  degree: string;
  graduation_year: number;
  gpa: number;
  academic_progress: number;
  target_career_id?: number | null;
  target_career_title?: string;
  target_career_industry?: string;
  courses?: StudentCourse[];
  skills?: StudentSkill[];
}

export interface Course {
  id: number;
  code: string;
  title: string;
  description?: string;
  credits: number;
  department: string;
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced';
  semester_offered?: string;
}

export interface StudentCourse {
  id: number;
  course_id: number;
  code: string;
  title: string;
  credits: number;
  department: string;
  difficulty_level: string;
  grade?: string | null;
  status: 'completed' | 'in_progress' | 'planned';
  semester_taken?: string;
}

export interface Skill {
  id: number;
  name: string;
  category: 'Technical' | 'Analytical' | 'Tool' | 'Soft Skill';
  description?: string;
}

export interface StudentSkill {
  id: number;
  skill_id: number;
  name: string;
  category: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  verified: number;
  description?: string;
}

export interface CareerSkillRequirement {
  career_skill_id: number;
  skill_id: number;
  name: string;
  category: string;
  required_proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  importance: 'critical' | 'recommended' | 'optional';
}

export interface SkillGapItem {
  skill_id: number;
  skill_name: string;
  category: string;
  description?: string;
  importance: 'critical' | 'recommended' | 'optional';
  required_proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  current_proficiency: string;
  status: 'MATCH' | 'GAP' | 'MISSING';
  gapLevel: number;
  recommendation: string;
}

export interface SkillGapAnalysisResponse {
  career: Career;
  matchPercentage: number;
  summary: {
    totalRequired: number;
    matches: number;
    gaps: number;
    missing: number;
  };
  skills: SkillGapItem[];
}

export interface RoadmapMilestone {
  id: number;
  roadmap_id: number;
  step_number: number;
  skill_or_topic: string;
  description: string;
  resources?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  completed: number;
}

export interface CareerRoadmap {
  id: number;
  student_id: number;
  career_id: number;
  title: string;
  summary?: string;
  career_title?: string;
  career_industry?: string;
}

export interface LearningPlanItem {
  id: number;
  plan_id: number;
  week_number: number;
  topic: string;
  objective: string;
  tasks: string[];
  resources?: string;
  completed: number;
}

export interface LearningPlan {
  id: number;
  student_id: number;
  title: string;
  target_career: string;
  timeframe_weeks: number;
  hours_per_week: number;
  created_at: string;
}

export interface AiChatMessage {
  id: number;
  conversation_id: number;
  sender: 'user' | 'ai';
  content: string;
  disclaimer_shown: number;
  created_at: string;
}

export interface ResumeAnalysis {
  id: number;
  student_id: number;
  filename: string;
  file_size: number;
  overall_score: number;
  career_alignment_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  recommendations: string[];
  recommended_projects: Array<{
    title: string;
    description: string;
    tech_stack: string;
  }>;
  suggested_next_steps?: string[];
  is_valid_resume?: boolean;
  status?: string;
  created_at: string;
}

export interface DashboardSummary {
  studentName: string;
  email: string;
  program: string;
  degree: string;
  university: string;
  gpa: number;
  academicProgress: number;
  targetCareer: string;
  courses: {
    total_courses: number;
    completed_courses: number;
    in_progress_courses: number;
    completed_credits: number;
  };
  skills: Array<{ name: string; proficiency: string; category: string }>;
  roadmap?: {
    id: number;
    title: string;
    total_steps: number;
    completed_steps: number;
  } | null;
  skillGaps: {
    matches: number;
    gaps: number;
    missing: number;
  };
  recentResume?: {
    overall_score: number;
    career_alignment_score: number;
    created_at: string;
  } | null;
}

export interface AdminStats {
  totalStudents: number;
  avgProgress: number;
  avgGpa: number;
  totalCourses: number;
  totalCareers: number;
  careerDistribution: Array<{ title: string; student_count: number }>;
  commonSkillGaps: Array<{
    skill_name: string;
    category: string;
    total_students_requiring: number;
    students_needing_improvement: number;
  }>;
}
