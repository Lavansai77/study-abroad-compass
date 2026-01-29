import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GraduationCap, Target, CheckCircle2, ArrowRight, Sparkles, Globe, BookOpen, Users } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="gradient-hero text-primary-foreground">
        <nav className="container mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-accent-foreground" />
            </div>
            <span className="font-display text-xl font-bold">AI Counsellor</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">AI-Powered Study Abroad Guidance</span>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Your Personal Guide to
              <span className="block text-accent">Study Abroad Success</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-foreground/80 max-w-3xl mx-auto mb-10">
              Stop guessing. Start planning. Our AI Counsellor understands your profile, 
              recommends the right universities, and guides you step-by-step to your dream admission.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow text-lg px-8 py-6">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8 py-6">
                  I Have an Account
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Wave Divider */}
        <div className="relative h-24">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 100L1440 100L1440 0C1440 0 1080 80 720 80C360 80 0 0 0 0L0 100Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            A Guided Path to Your <span className="text-gradient">Dream University</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No more confusion. Our structured approach takes you from uncertainty to clarity.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: BookOpen,
              title: 'Profile Building',
              description: 'Complete onboarding to understand your academic background, goals, and readiness.',
              stage: 1,
            },
            {
              icon: Globe,
              title: 'Smart Discovery',
              description: 'AI recommends Dream, Target, and Safe universities based on your unique profile.',
              stage: 2,
            },
            {
              icon: Target,
              title: 'Decision Locking',
              description: 'Lock your choices to create focused, personalized application strategies.',
              stage: 3,
            },
            {
              icon: CheckCircle2,
              title: 'Application Guidance',
              description: 'Get AI-generated tasks, document checklists, and timeline management.',
              stage: 4,
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="gradient-card rounded-2xl p-8 h-full border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `hsl(var(--stage-${feature.stage}))` }}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Stage {feature.stage}</div>
                <h3 className="font-display text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AI Counsellor Section */}
      <section className="py-24 bg-secondary/50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
                Meet Your <span className="text-gradient">AI Counsellor</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Not just a chatbot. A decision-making partner that understands your journey, 
                explains risks, and takes action on your behalf.
              </p>

              <div className="space-y-6">
                {[
                  'Analyzes your profile strengths and gaps',
                  'Explains why universities fit or don\'t',
                  'Shortlists and locks universities for you',
                  'Creates personalized to-do tasks',
                  'Updates guidance as your profile changes',
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-success-foreground" />
                    </div>
                    <span className="text-lg">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-card rounded-2xl border shadow-xl p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                  <div className="w-10 h-10 rounded-full gradient-hero flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold">AI Counsellor</div>
                    <div className="text-sm text-muted-foreground">Your personal guide</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-secondary rounded-lg p-4">
                    <p className="text-sm">
                      Based on your profile, I recommend focusing on <strong>Target universities</strong> in Canada. 
                      Your GPA of 3.5 and IELTS 7.0 make you a strong candidate for University of Toronto and UBC. 
                      Would you like me to shortlist these?
                    </p>
                  </div>
                  <div className="bg-accent/10 rounded-lg p-4 ml-8">
                    <p className="text-sm">Yes, please shortlist them and tell me what documents I need.</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-4">
                    <p className="text-sm">
                      ✅ Done! I've added both to your shortlist. For UofT's Computer Science program, 
                      you'll need: SOP, 3 LORs, transcripts, and IELTS scores. 
                      I've created tasks for each. Start with your SOP—deadline is January 15.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-success/20 rounded-full blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="gradient-hero rounded-3xl p-12 md:p-16 text-center text-primary-foreground"
          >
            <Users className="w-16 h-16 mx-auto mb-6 text-accent" />
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
              Join thousands of students who found clarity in their study-abroad decisions. 
              Your AI Counsellor is waiting.
            </p>
            <Link to="/signup">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow text-lg px-10 py-6">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-semibold">AI Counsellor</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 AI Counsellor. Your guided path to study abroad success.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
