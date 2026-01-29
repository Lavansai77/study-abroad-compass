import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const COUNTRIES = [
  'USA', 'UK', 'Canada', 'Australia', 'Germany', 'Switzerland', 'Netherlands', 'France', 'Singapore', 'New Zealand'
];

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    education_level: '',
    degree_major: '',
    graduation_year: '',
    gpa: '',
    intended_degree: '',
    field_of_study: '',
    target_intake_year: '',
    preferred_countries: [] as string[],
    budget_range: '',
    funding_plan: '',
    ielts_toefl_status: '',
    gre_gmat_status: '',
    sop_status: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        education_level: profile.education_level || '',
        degree_major: profile.degree_major || '',
        graduation_year: profile.graduation_year?.toString() || '',
        gpa: profile.gpa || '',
        intended_degree: profile.intended_degree || '',
        field_of_study: profile.field_of_study || '',
        target_intake_year: profile.target_intake_year?.toString() || '',
        preferred_countries: profile.preferred_countries || [],
        budget_range: profile.budget_range || '',
        funding_plan: profile.funding_plan || '',
        ielts_toefl_status: profile.ielts_toefl_status || '',
        gre_gmat_status: profile.gre_gmat_status || '',
        sop_status: profile.sop_status || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      navigate('/onboarding');
    }
  }, [profile, navigate]);

  const updateFormData = (key: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleCountry = (country: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_countries: prev.preferred_countries.includes(country)
        ? prev.preferred_countries.filter(c => c !== country)
        : [...prev.preferred_countries, country]
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
          target_intake_year: formData.target_intake_year ? parseInt(formData.target_intake_year) : null,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse">Loading profile...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-display text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground mt-1">
              Update your information to get better university recommendations.
            </p>
          </div>
          <Button onClick={handleSave} disabled={loading} className="gap-2">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => updateFormData('full_name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </CardContent>
          </Card>

          {/* Academic Background */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Academic Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Education Level</Label>
                <Select value={formData.education_level} onValueChange={(v) => updateFormData('education_level', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your education level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high_school">High School</SelectItem>
                    <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                    <SelectItem value="masters">Master's Degree</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="working">Working Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Current Degree/Major</Label>
                <Input
                  value={formData.degree_major}
                  onChange={(e) => updateFormData('degree_major', e.target.value)}
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Graduation Year</Label>
                  <Input
                    type="number"
                    value={formData.graduation_year}
                    onChange={(e) => updateFormData('graduation_year', e.target.value)}
                    placeholder="2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GPA/Percentage</Label>
                  <Input
                    value={formData.gpa}
                    onChange={(e) => updateFormData('gpa', e.target.value)}
                    placeholder="e.g., 3.5 or 85%"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Study Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Study Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Intended Degree</Label>
                  <Select value={formData.intended_degree} onValueChange={(v) => updateFormData('intended_degree', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bachelors">Bachelor's</SelectItem>
                      <SelectItem value="masters">Master's</SelectItem>
                      <SelectItem value="mba">MBA</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Intake Year</Label>
                  <Select value={formData.target_intake_year} onValueChange={(v) => updateFormData('target_intake_year', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="When to start?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025">Fall 2025</SelectItem>
                      <SelectItem value="2026">Fall 2026</SelectItem>
                      <SelectItem value="2027">Fall 2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Field of Study</Label>
                <Select value={formData.field_of_study} onValueChange={(v) => updateFormData('field_of_study', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your field" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="computer_science">Computer Science</SelectItem>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="business">Business & Management</SelectItem>
                    <SelectItem value="data_science">Data Science</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="arts">Arts & Design</SelectItem>
                    <SelectItem value="sciences">Natural Sciences</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Preferred Countries</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {COUNTRIES.map((country) => (
                    <div
                      key={country}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.preferred_countries.includes(country)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleCountry(country)}
                    >
                      <Checkbox 
                        checked={formData.preferred_countries.includes(country)}
                        onCheckedChange={() => toggleCountry(country)}
                      />
                      <span className="text-sm">{country}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Annual Budget Range (USD)</Label>
                  <Select value={formData.budget_range} onValueChange={(v) => updateFormData('budget_range', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under_20k">Under $20,000</SelectItem>
                      <SelectItem value="20k_35k">$20,000 - $35,000</SelectItem>
                      <SelectItem value="35k_50k">$35,000 - $50,000</SelectItem>
                      <SelectItem value="50k_70k">$50,000 - $70,000</SelectItem>
                      <SelectItem value="over_70k">Over $70,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Funding Plan</Label>
                  <Select value={formData.funding_plan} onValueChange={(v) => updateFormData('funding_plan', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="How to fund?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self_funded">Self-funded</SelectItem>
                      <SelectItem value="scholarship">Scholarship-dependent</SelectItem>
                      <SelectItem value="loan">Education Loan</SelectItem>
                      <SelectItem value="mixed">Mix of sources</SelectItem>
                      <SelectItem value="employer">Employer Sponsored</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exams & Readiness */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Exams & Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>IELTS/TOEFL Status</Label>
                  <Select value={formData.ielts_toefl_status} onValueChange={(v) => updateFormData('ielts_toefl_status', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed_low">Need to retake</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="not_required">Not Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>GRE/GMAT Status</Label>
                  <Select value={formData.gre_gmat_status} onValueChange={(v) => updateFormData('gre_gmat_status', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="not_required">Not Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>SOP Status</Label>
                  <Select value={formData.sop_status} onValueChange={(v) => updateFormData('sop_status', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="draft">Draft Ready</SelectItem>
                      <SelectItem value="review">Under Review</SelectItem>
                      <SelectItem value="ready">Finalized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading} size="lg" className="gap-2">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </Button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
