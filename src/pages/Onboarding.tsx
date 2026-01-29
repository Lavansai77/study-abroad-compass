import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, ArrowRight, ArrowLeft, Loader2, BookOpen, Target, Wallet, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  { id: 1, title: 'Academic Background', icon: BookOpen },
  { id: 2, title: 'Study Goals', icon: Target },
  { id: 3, title: 'Budget', icon: Wallet },
  { id: 4, title: 'Exams & Readiness', icon: FileCheck },
];

const COUNTRIES = [
  'USA', 'UK', 'Canada', 'Australia', 'Germany', 'Switzerland', 'Netherlands', 'France', 'Singapore', 'New Zealand'
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
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

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
          target_intake_year: formData.target_intake_year ? parseInt(formData.target_intake_year) : null,
          onboarding_completed: true,
          current_stage: 2,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Profile complete! Let\'s find your perfect universities.');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.education_level && formData.degree_major;
      case 2:
        return formData.intended_degree && formData.field_of_study && formData.preferred_countries.length > 0;
      case 3:
        return formData.budget_range && formData.funding_plan;
      case 4:
        return formData.ielts_toefl_status && formData.sop_status;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-xl font-bold">AI Counsellor</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of 4
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b">
        <div className="container mx-auto px-6">
          <div className="flex">
            {STEPS.map((step) => (
              <div 
                key={step.id} 
                className={`flex-1 py-4 relative ${step.id <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      step.id < currentStep 
                        ? 'bg-success text-success-foreground' 
                        : step.id === currentStep 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
                </div>
                {step.id < 4 && (
                  <div 
                    className={`absolute top-1/2 left-full w-full h-0.5 -translate-y-1/2 ${
                      step.id < currentStep ? 'bg-success' : 'bg-muted'
                    }`}
                    style={{ width: 'calc(100% - 2rem)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-6 py-12 max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 1: Academic Background */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-3xl font-bold mb-2">Academic Background</h2>
                  <p className="text-muted-foreground">Tell us about your current education to help us find the best fit.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Current Education Level *</Label>
                    <Select value={formData.education_level} onValueChange={(v) => updateFormData('education_level', v)}>
                      <SelectTrigger className="h-12">
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
                    <Label>Current Degree/Major *</Label>
                    <Input
                      placeholder="e.g., Computer Science, Business Administration"
                      value={formData.degree_major}
                      onChange={(e) => updateFormData('degree_major', e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Graduation Year</Label>
                      <Input
                        type="number"
                        placeholder="2024"
                        value={formData.graduation_year}
                        onChange={(e) => updateFormData('graduation_year', e.target.value)}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>GPA/Percentage</Label>
                      <Input
                        placeholder="e.g., 3.5 or 85%"
                        value={formData.gpa}
                        onChange={(e) => updateFormData('gpa', e.target.value)}
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Study Goals */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-3xl font-bold mb-2">Study Goals</h2>
                  <p className="text-muted-foreground">What do you want to achieve with your study abroad journey?</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Intended Degree *</Label>
                    <Select value={formData.intended_degree} onValueChange={(v) => updateFormData('intended_degree', v)}>
                      <SelectTrigger className="h-12">
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
                    <Label>Field of Study *</Label>
                    <Select value={formData.field_of_study} onValueChange={(v) => updateFormData('field_of_study', v)}>
                      <SelectTrigger className="h-12">
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

                  <div className="space-y-2">
                    <Label>Target Intake Year</Label>
                    <Select value={formData.target_intake_year} onValueChange={(v) => updateFormData('target_intake_year', v)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="When do you plan to start?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025">Fall 2025</SelectItem>
                        <SelectItem value="2026">Fall 2026</SelectItem>
                        <SelectItem value="2027">Fall 2027</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Preferred Countries * (select at least one)</Label>
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
                </div>
              </div>
            )}

            {/* Step 3: Budget */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-3xl font-bold mb-2">Budget</h2>
                  <p className="text-muted-foreground">Understanding your budget helps us recommend affordable options.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Annual Budget Range (USD) *</Label>
                    <Select value={formData.budget_range} onValueChange={(v) => updateFormData('budget_range', v)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select your budget range" />
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
                    <Label>Funding Plan *</Label>
                    <Select value={formData.funding_plan} onValueChange={(v) => updateFormData('funding_plan', v)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="How will you fund your education?" />
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
              </div>
            )}

            {/* Step 4: Exams & Readiness */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-display text-3xl font-bold mb-2">Exams & Readiness</h2>
                  <p className="text-muted-foreground">Let us know your current preparation status.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>IELTS/TOEFL Status *</Label>
                    <Select value={formData.ielts_toefl_status} onValueChange={(v) => updateFormData('ielts_toefl_status', v)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select your status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="scheduled">Test Scheduled</SelectItem>
                        <SelectItem value="completed_low">Completed (Need to retake)</SelectItem>
                        <SelectItem value="completed">Completed (Good score)</SelectItem>
                        <SelectItem value="not_required">Not Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>GRE/GMAT Status</Label>
                    <Select value={formData.gre_gmat_status} onValueChange={(v) => updateFormData('gre_gmat_status', v)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select your status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="scheduled">Test Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="not_required">Not Required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>SOP (Statement of Purpose) Status *</Label>
                    <Select value={formData.sop_status} onValueChange={(v) => updateFormData('sop_status', v)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select your status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="draft">Draft Ready</SelectItem>
                        <SelectItem value="review">Under Review</SelectItem>
                        <SelectItem value="ready">Finalized & Ready</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-12">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button onClick={handleNext} disabled={!isStepValid()} className="gap-2">
              Continue
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!isStepValid() || loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  Complete Setup
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
