import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Plus, Clock, CheckCircle2, FileText, BookOpen, 
  GraduationCap, Filter, Trash2 
} from 'lucide-react';
import { toast } from 'sonner';

interface Todo {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  university_id: string | null;
  universities?: {
    name: string;
  } | null;
}

const CATEGORIES = [
  { value: 'sop', label: 'SOP', icon: FileText },
  { value: 'exam', label: 'Exams', icon: BookOpen },
  { value: 'document', label: 'Documents', icon: FileText },
  { value: 'application', label: 'Application', icon: GraduationCap },
];

export default function Todos() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // New todo form
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    due_date: ''
  });

  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      navigate('/onboarding');
    }
  }, [profile, navigate]);

  useEffect(() => {
    fetchTodos();
  }, [user]);

  const fetchTodos = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('todos')
      .select(`
        *,
        universities (name)
      `)
      .eq('user_id', user.id)
      .order('completed', { ascending: true })
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true });
    
    if (data) setTodos(data);
    setLoading(false);
  };

  const handleToggle = async (todo: Todo) => {
    await supabase
      .from('todos')
      .update({ 
        completed: !todo.completed, 
        completed_at: !todo.completed ? new Date().toISOString() : null 
      })
      .eq('id', todo.id);
    
    fetchTodos();
    toast.success(todo.completed ? 'Task marked as pending' : 'Task completed!');
  };

  const handleDelete = async (id: string) => {
    await supabase
      .from('todos')
      .delete()
      .eq('id', id);
    
    fetchTodos();
    toast.success('Task deleted');
  };

  const handleCreate = async () => {
    if (!user || !newTodo.title.trim()) return;

    await supabase.from('todos').insert({
      user_id: user.id,
      title: newTodo.title,
      description: newTodo.description || null,
      category: newTodo.category || null,
      priority: newTodo.priority,
      due_date: newTodo.due_date || null
    });

    setDialogOpen(false);
    setNewTodo({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      due_date: ''
    });
    fetchTodos();
    toast.success('Task created!');
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'pending' && todo.completed) return false;
    if (filter === 'completed' && !todo.completed) return false;
    if (categoryFilter !== 'all' && todo.category !== categoryFilter) return false;
    return true;
  });

  const pendingCount = todos.filter(t => !t.completed).length;
  const completedCount = todos.filter(t => t.completed).length;

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string | null) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.icon || FileText;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse">Loading tasks...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">To-Do List</h1>
            <p className="text-muted-foreground mt-1">
              Track your application tasks and deadlines.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card 
            className={`cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('all')}
          >
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold">{todos.length}</p>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${filter === 'pending' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('pending')}
          >
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-accent">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${filter === 'completed' ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setFilter('completed')}
          >
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-success">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Task List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {filter === 'all' ? 'All Tasks' : filter === 'pending' ? 'Pending Tasks' : 'Completed Tasks'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTodos.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">
                  {filter === 'completed' ? 'No completed tasks yet' : 'No tasks found'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {filter === 'pending' 
                    ? 'All tasks are completed!' 
                    : 'Create your first task or talk to AI Counsellor to generate recommendations.'}
                </p>
                {filter !== 'completed' && (
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTodos.map((todo, index) => {
                  const CategoryIcon = getCategoryIcon(todo.category);
                  
                  return (
                    <motion.div
                      key={todo.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                        todo.completed ? 'bg-muted/30 opacity-60' : 'bg-card hover:bg-muted/30'
                      }`}
                    >
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => handleToggle(todo)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {todo.title}
                          </p>
                          <div className="flex items-center gap-2">
                            {todo.priority && (
                              <Badge variant={getPriorityColor(todo.priority) as any} className="text-xs">
                                {todo.priority}
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(todo.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {todo.description && (
                          <p className="text-sm text-muted-foreground mt-1">{todo.description}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {todo.category && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <CategoryIcon className="w-3 h-3" />
                              {CATEGORIES.find(c => c.value === todo.category)?.label}
                            </div>
                          )}
                          {todo.due_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(todo.due_date).toLocaleDateString()}
                            </div>
                          )}
                          {todo.universities?.name && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <GraduationCap className="w-3 h-3" />
                              {todo.universities.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newTodo.title}
                onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Complete SOP draft"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTodo.description}
                onChange={(e) => setNewTodo(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add more details..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={newTodo.category} 
                  onValueChange={(v) => setNewTodo(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={newTodo.priority} 
                  onValueChange={(v) => setNewTodo(prev => ({ ...prev, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={newTodo.due_date}
                onChange={(e) => setNewTodo(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newTodo.title.trim()}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
