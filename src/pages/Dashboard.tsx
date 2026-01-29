import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AICounsellor from '@/components/AICounsellor';
import { 
  GraduationCap, Target, CheckCircle2, FileText, 
  Sparkles, ArrowRight, Clock, Star, AlertTriangle 
} from 'lucide-react';

interface Todo {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: string | null;
  completed: boolean;
  due_date: string | null;
}

interface ShortlistedUniversity {
  id: string;
  university_id: string;
  status: string;
  risk_level: string | null;
  fit_score: number | null;
  universities: {
    name: string;
    country: string;
    category: string | null;
  };
}

const STAGES = [
  { id: 1, title: 'Building Profile', icon: GraduationCap, description: 'Complete your profile' },
  { id: 2, title: 'Discovering', icon: Target, description: 'Find universities' },
  { id: 3, title: 'Finalizing', icon: Star, description: 'Lock your choices' },
  { id: 4, title: 'Applying', icon: FileText, description: 'Submit applications' },
];

export default function Dashboard() {
  const { profile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [shortlisted, setShortlisted] = useState<ShortlistedUniversity[]>([]);
  const [showCounsellor, setShowCounsellor] = useState(false);

  useEffect(() => {
    if (!loading && !profile) {
      navigate('/login');
    } else if (profile && !profile.onboarding_completed) {
      navigate('/onboarding');
    }
  }, [loading, profile, navigate]);

  useEffect(() => {
    if (profile) {
      fetchTodos();
      fetchShortlisted();
    }
  }, [profile]);

  const fetchTodos = async () => {
    const { data } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (data) setTodos(data);
  };

  const fetchShortlisted = async () => {
    const { data } = await supabase
      .from('shortlisted_universities')
      .select(`
        *,
        universities (name, country, category)
      `)
      .order('created_at', { ascending: false });
    
    if (data) setShortlisted(data as ShortlistedUniversity[]);
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    await supabase
      .from('todos')
      .update({ completed: !completed, completed_at: !completed ? new Date().toISOString() : null })
      .eq('id', id);
    
    fetchTodos();
  };

  const getProfileStrength = () => {
    if (!profile) return { academics: 'weak', exams: 'not_started', sop: 'not_started' };
    
    const academicScore = profile.gpa ? 'strong' : profile.degree_major ? 'average' : 'weak';
    const examScore = profile.ielts_toefl_status?.includes('completed') ? 'completed' 
      : profile.ielts_toefl_status === 'preparing' ? 'in_progress' : 'not_started';
    const sopScore = profile.sop_status || 'not_started';
    
    return { academics: academicScore, exams: examScore, sop: sopScore };
  };

  const strength = getProfileStrength();
  const lockedCount = shortlisted.filter(s => s.status === 'locked').length;

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">
              Welcome back, {profile.full_name.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's an overview of your study abroad journey.
            </p>
          </div>
          <Button onClick={() => setShowCounsellor(true)} className="gap-2 shadow-glow">
            <Sparkles className="w-4 h-4" />
            Talk to AI Counsellor
          </Button>
        </div>

        {/* Stage Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Journey Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {STAGES.map((stage, index) => (
                <div key={stage.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        profile.current_stage > stage.id 
                          ? 'bg-success text-success-foreground' 
                          : profile.current_stage === stage.id 
                            ? `bg-stage-${stage.id} text-white` 
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {profile.current_stage > stage.id ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <stage.icon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={`text-sm mt-2 font-medium ${
                      profile.current_stage >= stage.id ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {stage.title}
                    </span>
                  </div>
                  {index < STAGES.length - 1 && (
                    <div 
                      className={`w-16 md:w-24 h-1 mx-2 rounded ${
                        profile.current_stage > stage.id ? 'bg-success' : 'bg-muted'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Education</span>
                  <span className="font-medium capitalize">{profile.education_level?.replace('_', ' ') || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Major</span>
                  <span className="font-medium">{profile.degree_major || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Target Intake</span>
                  <span className="font-medium">Fall {profile.target_intake_year || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Countries</span>
                  <span className="font-medium">{profile.preferred_countries?.slice(0, 2).join(', ') || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="font-medium capitalize">{profile.budget_range?.replace(/_/g, ' ') || '-'}</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/profile')}>
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Profile Strength */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Strength</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Academics</span>
                  <Badge variant={strength.academics === 'strong' ? 'default' : strength.academics === 'average' ? 'secondary' : 'destructive'}>
                    {strength.academics}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Exams</span>
                  <Badge variant={strength.exams === 'completed' ? 'default' : strength.exams === 'in_progress' ? 'secondary' : 'outline'}>
                    {strength.exams.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">SOP</span>
                  <Badge variant={strength.sop === 'ready' ? 'default' : strength.sop === 'draft' ? 'secondary' : 'outline'}>
                    {strength.sop.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {strength.academics !== 'strong' || strength.exams !== 'completed' ? (
                <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                    <p className="text-sm text-warning">
                      Complete your profile to get better recommendations.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                    <p className="text-sm text-success">
                      Your profile looks strong!
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shortlisted Universities */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Shortlisted</CardTitle>
              <Badge variant="outline">{shortlisted.length} universities</Badge>
            </CardHeader>
            <CardContent>
              {shortlisted.length === 0 ? (
                <div className="text-center py-6">
                  <Target className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No universities shortlisted yet</p>
                  <Button variant="outline" size="sm" onClick={() => navigate('/universities')}>
                    Discover Universities
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {shortlisted.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{item.universities.name}</p>
                        <p className="text-xs text-muted-foreground">{item.universities.country}</p>
                      </div>
                      <Badge variant={item.status === 'locked' ? 'default' : 'outline'} className="text-xs">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                  {shortlisted.length > 3 && (
                    <Button variant="ghost" className="w-full text-sm" onClick={() => navigate('/universities')}>
                      View all {shortlisted.length} universities
                    </Button>
                  )}
                </div>
              )}

              {shortlisted.length > 0 && lockedCount === 0 && (
                <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/30">
                  <p className="text-sm text-accent">
                    Lock at least one university to proceed to applications.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* To-Do List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Your To-Do List</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/todos')}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {todos.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No tasks yet. Talk to your AI Counsellor to generate personalized tasks.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todos.map((todo) => (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      todo.completed ? 'bg-muted/50 opacity-60' : 'bg-card hover:bg-muted/30'
                    }`}
                  >
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${todo.completed ? 'line-through' : ''}`}>
                        {todo.title}
                      </p>
                      {todo.description && (
                        <p className="text-xs text-muted-foreground mt-1">{todo.description}</p>
                      )}
                      {todo.due_date && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(todo.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {todo.priority && (
                      <Badge 
                        variant={todo.priority === 'high' ? 'destructive' : todo.priority === 'medium' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {todo.priority}
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Counsellor Modal */}
      <AICounsellor 
        open={showCounsellor} 
        onClose={() => setShowCounsellor(false)}
        onAction={() => {
          fetchTodos();
          fetchShortlisted();
          refreshProfile();
        }}
      />
    </DashboardLayout>
  );
}
