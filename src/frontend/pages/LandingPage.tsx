import React from 'react';
import { Button } from "@/frontend/components/ui/button";
import { Card, CardContent } from "@/frontend/components/ui/card";
import { ArrowRight, Calendar, Clock, FileText, Users, CheckSquare, Check, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ModeToggle } from "@/frontend/components/theme/mode-toggle";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth/signup');
  };

  const handleSignIn = () => {
    navigate('/auth/signin');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary via-primary to-primary/90 rounded-lg flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-primary-foreground drop-shadow-sm" fill="currentColor" />
              </div>
              <span className="text-xl font-bold">TaskPulse</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <nav className="flex space-x-6">
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
              </nav>
              <div className="flex items-center space-x-3">
                <ModeToggle />
                <Button variant="ghost" size="sm" onClick={handleSignIn}>Sign In</Button>
                <Button size="sm" onClick={handleGetStarted}>Get Started</Button>
              </div>
            </div>
            <div className="md:hidden flex items-center space-x-2">
              <ModeToggle />
              <Button variant="ghost" size="sm" onClick={handleGetStarted}>
                <Zap className="w-5 h-5 text-foreground" fill="currentColor" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 bg-muted/50 rounded-full px-3 py-1 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-muted-foreground">AI-Powered Productivity</span>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                  Intelligence meets{' '}
                  <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text">
                    productivity
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                  AI-powered workspace that learns your workflow. Manage projects, track time, and amplify every task with intelligent automation.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="group" onClick={handleGetStarted}>
                  Start Free Today
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" onClick={handleSignIn}>
                  Sign In
                </Button>
              </div>
              <div className="flex items-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Free to use</span>
                </div>
              </div>
            </div>
            
            {/* Hero Visual */}
            <div className="relative">
              <div className="relative bg-card rounded-2xl border shadow-2xl overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">AI Assistant</h3>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">💡 I notice you have 3 overdue tasks. Should I reschedule them?</p>
                    </div>
                    <div className="bg-primary/10 rounded-lg p-3 ml-8">
                      <p className="text-sm">Yes, please optimize my schedule for this week</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">✅ Perfect! I've rescheduled your tasks and blocked focus time. Your productivity score will increase by 23%.</p>
                    </div>
                  </div>
                </div>
                <div className="border-t bg-muted/30 p-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-background rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-primary">84%</div>
                      <div className="text-xs text-muted-foreground">Productivity</div>
                    </div>
                    <div className="bg-background rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-green-600">12</div>
                      <div className="text-xs text-muted-foreground">Tasks Done</div>
                    </div>
                    <div className="bg-background rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-blue-600">6.2h</div>
                      <div className="text-xs text-muted-foreground">Focus Time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Intelligence in every workflow
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the future of productivity with AI that understands your work patterns and amplifies your potential.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI-Powered Intelligence */}
            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 border-0 bg-gradient-to-br from-card to-muted/20 cursor-pointer">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary to-primary/90 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <Zap className="w-6 h-6 text-primary-foreground drop-shadow-sm" fill="currentColor" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">Your AI productivity partner</h3>
                <p className="text-muted-foreground mb-4">
                  Smart suggestions, automated task creation, and intelligent insights that adapt to your workflow patterns.
                </p>
              </CardContent>
            </Card>

            {/* Project Management */}
            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <Users className="w-6 h-6 text-white drop-shadow-sm" fill="currentColor" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors">Projects that organize themselves</h3>
                <p className="text-muted-foreground mb-4">
                  Intuitive project boards with AI-driven task breakdown and automatic progress tracking.
                </p>
              </CardContent>
            </Card>

            {/* Time Tracking */}
            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 via-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <Clock className="w-6 h-6 text-white drop-shadow-sm" fill="currentColor" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-green-600 transition-colors">Time tracking that actually works</h3>
                <p className="text-muted-foreground mb-4">
                  Pomodoro timers, automatic time logging, and productivity analytics powered by AI insights.
                </p>
              </CardContent>
            </Card>

            {/* Calendar Integration */}
            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <Calendar className="w-6 h-6 text-white drop-shadow-sm" fill="currentColor" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-purple-600 transition-colors">Calendar integration, perfected</h3>
                <p className="text-muted-foreground mb-4">
                  Seamless Google Calendar sync with intelligent task scheduling and deadline management.
                </p>
              </CardContent>
            </Card>

            {/* Notes & Files */}
            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <FileText className="w-6 h-6 text-white drop-shadow-sm" fill="currentColor" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-orange-600 transition-colors">Everything in its place</h3>
                <p className="text-muted-foreground mb-4">
                  Smart note-taking and file organization that connects to your projects and tasks automatically.
                </p>
              </CardContent>
            </Card>

            {/* Task Management */}
            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <CheckSquare className="w-6 h-6 text-white drop-shadow-sm" fill="currentColor" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-indigo-600 transition-colors">Smart task management</h3>
                <p className="text-muted-foreground mb-4">
                  Intelligent to-do lists that prioritize themselves, with smart reminders and progress tracking.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Designed for productivity
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              TaskPulse brings together the best of task management, project organization, and time tracking in one intelligent platform.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Intuitive Design", desc: "Clean, modern interface that gets out of your way" },
              { title: "AI-Powered Insights", desc: "Smart recommendations based on your work patterns" },
              { title: "Cross-Platform", desc: "Works seamlessly on desktop, tablet, and mobile" },
              { title: "Real-time Updates", desc: "Instant sync across all your devices" },
              { title: "Privacy Focused", desc: "Your data stays secure and private" },
              { title: "Always Improving", desc: "Regular updates with new features and improvements" }
            ].map((feature, index) => (
              <div key={index} className="bg-card rounded-xl p-6 border hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                <h4 className="font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to amplify your productivity?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of professionals who've transformed their workflow with AI-powered task management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="group" onClick={handleGetStarted}>
                Get Started - It's Free
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Check className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-1">
                <Check className="w-4 h-4 text-green-500" />
                <span>Free to use</span>
              </div>
              <div className="flex items-center space-x-1">
                <Check className="w-4 h-4 text-green-500" />
                <span>Start immediately</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary via-primary to-primary/90 rounded-lg flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-primary-foreground drop-shadow-sm" fill="currentColor" />
              </div>
              <span className="text-xl font-bold">TaskPulse</span>
            </div>
            
            <div className="text-muted-foreground text-center">
              © 2025 TaskPulse. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 