import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { 
  Search, MapPin, DollarSign, Star, Target, Shield, 
  Lock, Unlock, Plus, Check, AlertTriangle, GraduationCap 
} from 'lucide-react';
import { toast } from 'sonner';

interface University {
  id: string;
  name: string;
  country: string;
  ranking: number | null;
  tuition_min: number | null;
  tuition_max: number | null;
  acceptance_rate: string | null;
  programs: string[] | null;
  description: string | null;
  requirements: string | null;
  deadline_fall: string | null;
  deadline_spring: string | null;
  category: string | null;
}

interface ShortlistedUniversity {
  id: string;
  university_id: string;
  status: string;
  risk_level: string | null;
  fit_score: number | null;
  locked_at: string | null;
}

export default function Universities() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [universities, setUniversities] = useState<University[]>([]);
  const [shortlisted, setShortlisted] = useState<Map<string, ShortlistedUniversity>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      navigate('/onboarding');
    }
  }, [profile, navigate]);

  useEffect(() => {
    fetchUniversities();
    fetchShortlisted();
  }, []);

  const fetchUniversities = async () => {
    const { data } = await supabase
      .from('universities')
      .select('*')
      .order('ranking', { ascending: true });
    
    if (data) setUniversities(data);
    setLoading(false);
  };

  const fetchShortlisted = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('shortlisted_universities')
      .select('*')
      .eq('user_id', user.id);
    
    if (data) {
      const map = new Map();
      data.forEach(item => map.set(item.university_id, item));
      setShortlisted(map);
    }
  };

  const handleShortlist = async (university: University) => {
    if (!user) return;

    const existing = shortlisted.get(university.id);
    
    if (existing) {
      // Remove from shortlist
      await supabase
        .from('shortlisted_universities')
        .delete()
        .eq('id', existing.id);
      
      toast.success(`${university.name} removed from shortlist`);
    } else {
      // Add to shortlist
      await supabase
        .from('shortlisted_universities')
        .insert({
          user_id: user.id,
          university_id: university.id,
          status: 'shortlisted',
          risk_level: university.category === 'dream' ? 'high' : university.category === 'safe' ? 'low' : 'medium',
          fit_score: university.category === 'dream' ? 60 : university.category === 'safe' ? 90 : 75
        });
      
      // Update stage to 3 if not already
      if (profile && profile.current_stage < 3) {
        await supabase
          .from('profiles')
          .update({ current_stage: 3 })
          .eq('user_id', user.id);
        await refreshProfile();
      }
      
      toast.success(`${university.name} added to shortlist`);
    }
    
    fetchShortlisted();
  };

  const handleLockClick = (university: University) => {
    setSelectedUniversity(university);
    setLockDialogOpen(true);
  };

  const confirmLock = async () => {
    if (!selectedUniversity || !user) return;

    const existing = shortlisted.get(selectedUniversity.id);
    
    if (existing) {
      if (existing.status === 'locked') {
        // Unlock
        await supabase
          .from('shortlisted_universities')
          .update({ status: 'shortlisted', locked_at: null })
          .eq('id', existing.id);
        
        toast.success(`${selectedUniversity.name} unlocked`);
      } else {
        // Lock
        await supabase
          .from('shortlisted_universities')
          .update({ status: 'locked', locked_at: new Date().toISOString() })
          .eq('id', existing.id);
        
        // Update stage to 4
        if (profile && profile.current_stage < 4) {
          await supabase
            .from('profiles')
            .update({ current_stage: 4 })
            .eq('user_id', user.id);
          await refreshProfile();
        }
        
        toast.success(`${selectedUniversity.name} locked! Application guidance is now available.`);
      }
    } else {
      // Shortlist and lock
      await supabase
        .from('shortlisted_universities')
        .insert({
          user_id: user.id,
          university_id: selectedUniversity.id,
          status: 'locked',
          locked_at: new Date().toISOString(),
          risk_level: selectedUniversity.category === 'dream' ? 'high' : selectedUniversity.category === 'safe' ? 'low' : 'medium',
          fit_score: selectedUniversity.category === 'dream' ? 60 : selectedUniversity.category === 'safe' ? 90 : 75
        });
      
      // Update stage to 4
      if (profile && profile.current_stage < 4) {
        await supabase
          .from('profiles')
          .update({ current_stage: 4 })
          .eq('user_id', user.id);
        await refreshProfile();
      }
      
      toast.success(`${selectedUniversity.name} locked! Application guidance is now available.`);
    }
    
    setLockDialogOpen(false);
    fetchShortlisted();
  };

  const filteredUniversities = universities.filter(uni => {
    const matchesSearch = uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uni.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = countryFilter === 'all' || uni.country === countryFilter;
    const matchesCategory = categoryFilter === 'all' || uni.category === categoryFilter;
    return matchesSearch && matchesCountry && matchesCategory;
  });

  const countries = [...new Set(universities.map(u => u.country))];
  const lockedCount = [...shortlisted.values()].filter(s => s.status === 'locked').length;

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'dream': return Star;
      case 'target': return Target;
      case 'safe': return Shield;
      default: return GraduationCap;
    }
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'dream': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'target': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'safe': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse">Loading universities...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold">University Discovery</h1>
          <p className="text-muted-foreground mt-1">
            Find and shortlist universities that match your profile. Lock at least one to proceed to applications.
          </p>
        </div>

        {/* Status Banner */}
        {lockedCount === 0 && (
          <Card className="border-accent bg-accent/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-accent" />
                <p className="text-sm">
                  <strong>Lock at least one university</strong> to unlock application guidance and create your personalized to-do list.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search universities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="dream">Dream</SelectItem>
                  <SelectItem value="target">Target</SelectItem>
                  <SelectItem value="safe">Safe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* University Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUniversities.map((university, index) => {
            const shortlistStatus = shortlisted.get(university.id);
            const isShortlisted = !!shortlistStatus;
            const isLocked = shortlistStatus?.status === 'locked';
            const CategoryIcon = getCategoryIcon(university.category);

            return (
              <motion.div
                key={university.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`h-full transition-all hover:shadow-lg ${isLocked ? 'ring-2 ring-success' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight">{university.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {university.country}
                          {university.ranking && (
                            <span className="ml-2 text-xs">• Rank #{university.ranking}</span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge className={`${getCategoryColor(university.category)} capitalize`}>
                        <CategoryIcon className="w-3 h-3 mr-1" />
                        {university.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {university.description}
                    </p>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>${(university.tuition_min || 0).toLocaleString()}-{(university.tuition_max || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span>{university.acceptance_rate} rate</span>
                      </div>
                    </div>

                    {university.programs && (
                      <div className="flex flex-wrap gap-1">
                        {university.programs.slice(0, 3).map(program => (
                          <Badge key={program} variant="outline" className="text-xs">
                            {program}
                          </Badge>
                        ))}
                        {university.programs.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{university.programs.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant={isShortlisted ? "secondary" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleShortlist(university)}
                      >
                        {isShortlisted ? (
                          <>
                            <Check className="w-4 h-4 mr-1" />
                            Shortlisted
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Shortlist
                          </>
                        )}
                      </Button>
                      <Button
                        variant={isLocked ? "default" : "outline"}
                        size="sm"
                        className={isLocked ? 'bg-success hover:bg-success/90' : ''}
                        onClick={() => handleLockClick(university)}
                      >
                        {isLocked ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredUniversities.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No universities found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your filters or search query.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lock Confirmation Dialog */}
      <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {shortlisted.get(selectedUniversity?.id || '')?.status === 'locked' ? (
                <>
                  <Unlock className="w-5 h-5" />
                  Unlock {selectedUniversity?.name}?
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-success" />
                  Lock {selectedUniversity?.name}?
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {shortlisted.get(selectedUniversity?.id || '')?.status === 'locked' ? (
                "Unlocking this university will remove it from your committed list. You can always lock it again later."
              ) : (
                "Locking this university means you're committed to applying. This will unlock personalized application guidance and create to-do tasks specific to this university."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmLock}
              className={shortlisted.get(selectedUniversity?.id || '')?.status === 'locked' ? '' : 'bg-success hover:bg-success/90'}
            >
              {shortlisted.get(selectedUniversity?.id || '')?.status === 'locked' ? 'Unlock' : 'Lock University'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
