import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/frontend/components/ui/card";
import { Input } from "@/frontend/components/ui/input";
import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/frontend/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/frontend/components/ui/accordion";
import { Badge } from "@/frontend/components/ui/badge";
import { Alert, AlertDescription } from "@/frontend/components/ui/alert";
import { Search, BookOpen, MessageCircle, Play, CheckCircle, Clock, Calendar, FileText, Brain, Timer, FolderOpen, Bell, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/frontend/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { submitSupportContact } from "@/backend/api/services/support.service";

const HelpSupport = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await submitSupportContact({
        name: contactForm.name,
        email: contactForm.email,
        subject: contactForm.subject,
        message: contactForm.message
      });

      toast({
        title: "Message Sent Successfully!",
        description: "We've received your support request and will get back to you within 24 hours.",
      });
      
      setContactForm({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Error Sending Message",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Start button handlers
  const handleQuickStartAction = (actionType: string) => {
    switch (actionType) {
      case "profile":
        navigate("/settings");
        toast({
          title: "Opening Profile Settings",
          description: "Complete your profile information in the Profile tab.",
        });
        break;
      case "project":
        navigate("/projects");
        toast({
          title: "Opening Projects",
          description: "Click 'New Project' to create your first project.",
        });
        break;
      case "tasks":
        navigate("/tasks");
        toast({
          title: "Opening Tasks",
          description: "Click 'Add Task' to create your first task.",
        });
        break;
      case "ai":
        navigate("/chat");
        toast({
          title: "Opening AI Chat",
          description: "Start chatting with AI to experience productivity assistance.",
        });
        break;
      case "calendar":
        navigate("/settings");
        setTimeout(() => {
          // Switch to AI tab where Google Calendar integration is
          const aiTab = document.querySelector('[value="ai"]') as HTMLElement;
          aiTab?.click();
        }, 100);
        toast({
          title: "Opening Calendar Integration",
          description: "Go to the AI tab to connect your Google Calendar.",
        });
        break;
    }
  };

  const faqCategories = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: Play,
      color: "bg-green-500",
      items: [
        {
          question: "How do I create my first account?",
          answer: "Creating an account is simple and free:\n\n1. **Visit the Sign-Up Page**: Click 'Sign Up' on the login page\n2. **Enter Your Information**: Provide a valid email address and create a secure password (minimum 8 characters)\n3. **Verify Your Email**: Check your inbox for a verification email and click the confirmation link\n4. **Automatic Login**: You'll be logged in automatically and can start using all features immediately\n5. **No Credit Card Required**: All core features are available instantly\n\n**Tip**: Use a password manager to create a strong, unique password for your account."
        },
        {
          question: "What should I do first after signing up?",
          answer: "Follow this step-by-step onboarding process:\n\n**Step 1: Complete Your Profile** (2 minutes)\n• Go to Settings > Profile tab\n• Add your first name, last name, and preferred timezone\n• Upload a profile picture (optional)\n\n**Step 2: Create Your First Project** (3 minutes)\n• Navigate to the Projects page\n• Click 'New Project' and give it a meaningful name\n• Add a description and optional due date\n• This will help organize all your related tasks and files\n\n**Step 3: Add Some Tasks** (5 minutes)\n• Go to the Tasks page and click 'Add Task'\n• Try different priorities (High, Medium, Low)\n• Set due dates and add labels\n• Practice dragging tasks between columns\n\n**Step 4: Explore AI Features** (10 minutes)\n• Set up your free Gemini API key (see AI section below)\n• Try natural language commands like 'Create a task to buy groceries'\n• Ask the AI questions about your data\n\n**Step 5: Connect Google Calendar** (5 minutes)\n• Sync your existing calendar for a unified experience\n• All new events will automatically sync both ways"
        },
        {
          question: "How do I navigate around the app?",
          answer: "TaskPulse is designed for intuitive navigation:\n\n**Main Sidebar** (Left side)\n• **Dashboard**: Overview of all your work\n• **Tasks**: Kanban board for task management\n• **Calendar**: View and manage events\n• **Notes**: Create and organize notes\n• **Timer**: Pomodoro timer and time tracking\n• **Files**: Upload and manage documents\n• **Projects**: Organize work into projects\n• **AI Chat**: Natural language assistant\n• **Suggestions**: AI-generated task and event suggestions\n• **Settings**: Account and app preferences\n\n**Keyboard Shortcuts**\n• **Alt + M**: Jump to main content\n• **Alt + N**: Focus on navigation\n• **Tab**: Navigate between interactive elements\n• **Enter/Space**: Activate buttons and links\n\n**Sidebar Controls**\n• Click the arrow button to collapse/expand the sidebar\n• Hover over collapsed icons to see tooltips\n• Current page is highlighted with accent color\n\n**Responsive Design**\n• Works seamlessly on desktop, tablet, and mobile\n• Touch-friendly interface for mobile devices"
        }
      ]
    },
    {
      id: "tasks",
      title: "Tasks Management",
      icon: CheckCircle,
      color: "bg-blue-500",
      items: [
        {
          question: "How do I create and organize tasks?",
          answer: "Go to the Tasks page and click 'Add Task'. You can set priority (high/medium/low), due dates, labels, and assign tasks to projects. Drag and drop tasks between columns (To Do, In Progress, Done) to change their status."
        },
        {
          question: "What are task priorities and how do I use them?",
          answer: "Priorities help you focus on what's important: High (red), Medium (yellow), Low (gray). Set priorities when creating tasks, and use the filter options to view tasks by priority level."
        },
        {
          question: "How do recurring tasks work?",
          answer: "When creating a task, enable 'Recurring' and choose your pattern (daily, weekly, monthly). You can set an end date or number of occurrences. Tasks will automatically regenerate based on your pattern."
        },
        {
          question: "How do I archive old tasks?",
          answer: "Tasks are automatically archived after 30 days of being completed. You can also manually archive tasks from the task menu. View archived tasks by clicking the archive button on the Tasks page."
        }
      ]
    },
    {
      id: "calendar",
      title: "Calendar & Events",
      icon: Calendar,
      color: "bg-purple-500",
      items: [
        {
          question: "How do I connect Google Calendar?",
          answer: "Go to Settings > AI tab and look for Google Calendar integration. Click 'Connect' and authorize the app. Your events will sync automatically, and new events created in the app will appear in your Google Calendar."
        },
        {
          question: "How does calendar syncing work?",
          answer: "Manual sync: Click the sync button on the Calendar page. Automatic push: New events created in TaskPulse are automatically sent to Google Calendar. Pull sync: Use the sync button to get recent events from Google Calendar."
        },
        {
          question: "Can I create recurring events?",
          answer: "Yes! When creating an event, enable 'Recurring' and choose your pattern. You can set daily, weekly, monthly, or yearly recurrence with custom end conditions."
        }
      ]
    },
    {
      id: "projects",
      title: "Projects",
      icon: FolderOpen,
      color: "bg-orange-500",
      items: [
        {
          question: "How do I create and manage projects?",
          answer: "Go to Projects page and click 'New Project'. Add a title, description, and optional due date. Projects help organize related tasks, events, notes, and files in one place."
        },
        {
          question: "How do I link items to projects?",
          answer: "When creating tasks, events, notes, or uploading files, select a project from the dropdown. You can also link existing items by editing them and selecting a project."
        },
        {
          question: "What's the difference between auto and manual progress?",
          answer: "Auto progress: Calculated based on completed tasks in the project. Manual progress: Set your own percentage using the slider. Toggle between modes in the project details view."
        }
      ]
    },
    {
      id: "timer",
      title: "Timer & Time Tracking",
      icon: Timer,
      color: "bg-red-500",
      items: [
        {
          question: "How does the Pomodoro timer work?",
          answer: "The timer follows the Pomodoro technique: 25-minute focus sessions, 5-minute short breaks, and 15-minute long breaks after every 4 focus sessions. You can customize these durations in the timer settings."
        },
        {
          question: "How do I track time on specific tasks?",
          answer: "Start the timer and select a context (task, event, or project). Time will be automatically tracked and associated with your selection. You can also manually start/stop time tracking from the timer page."
        },
        {
          question: "Where can I see my time statistics?",
          answer: "Time analytics are available on the Timer page. View daily, weekly, and total time spent, session counts, and time breakdown by session type."
        }
      ]
    },
    {
      id: "ai",
      title: "AI Features",
      icon: Brain,
      color: "bg-pink-500",
      items: [
        {
          question: "How do I set up the AI features? (Complete Guide)",
          answer: "**Step-by-Step AI Setup** (10 minutes total):\n\n**1. Get Your Free Gemini API Key** (5 minutes)\n• Visit https://ai.google.dev (Google AI Studio)\n• Sign in with your Google account\n• Click 'Get API Key' in the top navigation\n• Click 'Create API Key in new project' (or select existing project)\n• Copy the generated API key (starts with 'AIza...')\n• **Important**: Keep this key secure and never share it publicly\n\n**2. Add API Key to TaskPulse** (2 minutes)\n• Go to Settings > AI tab in TaskPulse\n• Paste your API key in the 'Gemini API Key' field\n• Click 'Save Settings'\n• You'll see a green checkmark when successfully connected\n\n**3. Test Your Setup** (3 minutes)\n• Go to AI Chat page\n• Try this test command: 'Create a task called Test AI Setup'\n• If working correctly, you'll see the task created and a success message\n• Try asking: 'What tasks do I have?' to test data querying\n\n**Troubleshooting**:\n• **Error 'Invalid API Key'**: Double-check you copied the complete key\n• **Error 'Quota Exceeded'**: You've hit the free tier limit (generous for most users)\n• **No Response**: Check your internet connection and try again\n\n**Free Tier Limits**:\n• 60 requests per minute\n• 1,500 requests per day\n• More than enough for typical productivity use\n\n**Security Note**: Your API key is stored securely in your browser and never shared with other users."
        },
        {
          question: "What can I ask the AI? (Complete Command List)",
          answer: "**Task Management Commands**:\n• 'Create a task called [name]' - Basic task creation\n• 'Create a high priority task to finish the report by Friday' - With priority and due date\n• 'Add a task for my [project name] project about [description]' - Project-specific tasks\n• 'Mark the [task name] task as done' - Complete tasks\n• 'Delete the task about [description]' - Remove tasks (with confirmation)\n• 'Update the [task name] task to high priority' - Modify existing tasks\n\n**Event Management Commands**:\n• 'Schedule a meeting tomorrow at 3 PM' - Basic event creation\n• 'Create an event called Team Standup every Monday at 10 AM' - Recurring events\n• 'Schedule a 2-hour workshop on Friday afternoon' - Events with duration\n• 'Add a dentist appointment next Tuesday at 2 PM for my personal project' - Project-linked events\n\n**Data Query Commands**:\n• 'What tasks do I have due this week?' - Filter by due date\n• 'Show me all high priority tasks' - Filter by priority\n• 'What events do I have tomorrow?' - Calendar queries\n• 'What's in my [project name] project?' - Project summaries\n• 'Show me overdue tasks' - Status-based queries\n• 'What projects am I working on?' - Project overview\n\n**Project Management Commands**:\n• 'Create a new project called [name]' - Project creation\n• 'Show me progress on [project name]' - Project status\n• 'What tasks are left in [project name]?' - Project task queries\n\n**Smart Context Understanding**:\n• The AI understands natural language variations\n• It can infer dates ('tomorrow', 'next Friday', 'in 2 weeks')\n• It recognizes priorities ('urgent', 'important', 'low priority')\n• It handles partial matches for project and task names"
        },
        {
          question: "How do AI suggestions work?",
          answer: "**Automatic Suggestion Generation**:\n\n**How It Works**:\n• The AI continuously analyzes your chat conversations\n• It identifies potential tasks or events mentioned in discussion\n• Suggestions appear automatically in the Suggestions page\n• You can accept, reject, or modify suggestions before creating\n\n**Types of Suggestions**:\n• **Task Suggestions**: Action items mentioned in conversation\n• **Event Suggestions**: Meetings, deadlines, or appointments discussed\n• **Project Suggestions**: New projects based on conversation themes\n\n**Suggestion Quality**:\n• Includes relevant context from the conversation\n• Suggests appropriate priorities based on language used\n• Infers due dates from temporal references\n• Links to projects when context is clear\n\n**Managing Suggestions**:\n• View all suggestions on the Suggestions page\n• Green checkmark to accept and create the item\n• Red X to reject and remove the suggestion\n• Edit button to modify before accepting\n• Feedback helps improve future suggestions\n\n**Privacy Note**: Suggestions are generated locally and not shared with other users."
        },
        {
          question: "Can I ask the AI about my data?",
          answer: "**Comprehensive Data Querying**:\n\n**Available Data Queries**:\n• **Tasks**: Status, priority, due dates, project assignments, labels\n• **Events**: Upcoming/past events, project-linked events, recurring patterns\n• **Projects**: Progress, task counts, team members, deadlines\n• **Time Tracking**: Hours spent, session statistics, productivity patterns\n• **Files**: Recent uploads, project associations, file types\n\n**Advanced Query Examples**:\n• 'Show me all tasks due before next Monday'\n• 'What events do I have in my work projects this week?'\n• 'How many hours did I spend on [project name] last week?'\n• 'What files have I uploaded recently?'\n• 'Show me incomplete high-priority tasks'\n• 'What projects have overdue tasks?'\n• 'When is my next meeting?'\n\n**Smart Filtering**:\n• Combine multiple criteria in one query\n• Natural language date parsing\n• Project-aware queries\n• Status-based filtering\n\n**Data Privacy**: All queries are processed locally with your data and never shared externally."
        }
      ]
    },
    {
      id: "files-notes",
      title: "Files & Notes",
      icon: FileText,
      color: "bg-teal-500",
      items: [
        {
          question: "How do I upload and manage files?",
          answer: "Go to Files page and drag & drop files or click 'Upload Files'. Files can be linked to tasks, events, or projects. You can preview most file types directly in the browser."
        },
        {
          question: "How do I organize my notes?",
          answer: "Create notes from the Notes page. Notes can be linked to projects for better organization. Use the search function to quickly find specific notes by content."
        },
        {
          question: "What file types are supported?",
          answer: "Most common file types are supported including documents (PDF, DOC), images (JPG, PNG), and text files. Files are securely stored and can be shared or downloaded anytime."
        }
      ]
    },
    {
      id: "notifications",
      title: "Notifications & Reminders",
      icon: Bell,
      color: "bg-indigo-500",
      items: [
        {
          question: "How do I set up reminders?",
          answer: "When creating tasks or events, scroll down to the 'Reminders' section. Choose from preset times (5 min, 15 min, 1 hour before) or set a custom time. Multiple reminders can be set for the same item."
        },
        {
          question: "Why am I not receiving notifications?",
          answer: "Check your browser notification settings. You may need to allow notifications for this website. Also ensure you've set reminders on your tasks and events."
        },
        {
          question: "Can I customize notification timing?",
          answer: "Yes! When setting reminders, you can choose from preset options or select 'Custom' to set any specific time before the task/event."
        }
      ]
    }
  ];

  const filteredFAQ = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  const quickStartSteps = [
    {
      title: "Set up your profile",
      description: "Complete your profile information in Settings",
      action: "Go to Profile Settings",
      actionType: "profile",
      completed: false
    },
    {
      title: "Create your first project",
      description: "Organize your work with projects",
      action: "Create Project",
      actionType: "project",
      completed: false
    },
    {
      title: "Add some tasks",
      description: "Start managing your tasks effectively",
      action: "Add Tasks",
      actionType: "tasks",
      completed: false
    },
    {
      title: "Try the AI chat",
      description: "Experience AI-powered productivity assistance",
      action: "Open AI Chat",
      actionType: "ai",
      completed: false
    },
    {
      title: "Connect Google Calendar",
      description: "Sync your existing calendar",
      action: "Connect Calendar",
      actionType: "calendar",
      completed: false
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Help & Support
          </CardTitle>
          <CardDescription>
            Find answers to common questions and get help with using TaskPulse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="faq" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="quick-start">Quick Start</TabsTrigger>
              <TabsTrigger value="contact">Contact Support</TabsTrigger>
            </TabsList>

            <TabsContent value="faq" className="space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search FAQ..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    aria-label="Search frequently asked questions"
                  />
                </div>

                <div className="grid gap-4">
                  {(searchQuery ? filteredFAQ : faqCategories).map((category) => (
                    <Card key={category.id} className="border">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-3 text-lg">
                          <div className={`p-2 rounded-lg ${category.color}`}>
                            <category.icon className="h-4 w-4 text-white" />
                          </div>
                          {category.title}
                          <Badge variant="secondary">{category.items.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="single" collapsible className="space-y-2">
                          {category.items.map((item, index) => (
                            <AccordionItem key={index} value={`${category.id}-${index}`} className="border rounded-lg px-4">
                              <AccordionTrigger 
                                className="text-left hover:no-underline py-4"
                                aria-describedby={`faq-answer-${category.id}-${index}`}
                              >
                                <span className="font-medium">{item.question}</span>
                              </AccordionTrigger>
                              <AccordionContent 
                                id={`faq-answer-${category.id}-${index}`}
                                className="text-muted-foreground pb-4 leading-relaxed whitespace-pre-line"
                              >
                                {item.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  ))}

                  {searchQuery && filteredFAQ.length === 0 && (
                    <Alert>
                      <AlertDescription>
                        No FAQ items found matching "{searchQuery}". Try different keywords or contact support.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="quick-start" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Start Guide</CardTitle>
                  <CardDescription>
                    Follow these steps to get the most out of TaskPulse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {quickStartSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          step.completed ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {step.completed ? <CheckCircle className="h-4 w-4" /> : index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{step.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={step.completed}
                            onClick={() => handleQuickStartAction(step.actionType)}
                            className="flex items-center gap-2"
                          >
                            {step.completed ? 'Completed' : step.action}
                            {!step.completed && <ExternalLink className="h-3 w-3" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Contact Support
                  </CardTitle>
                  <CardDescription>
                    Can't find what you're looking for? Send us a message and we'll help you out.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="contact-name" className="text-sm font-medium">Name</label>
                        <Input
                          id="contact-name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                          disabled={isSubmitting}
                          aria-required="true"
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-email" className="text-sm font-medium">Email</label>
                        <Input
                          id="contact-email"
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                          disabled={isSubmitting}
                          aria-required="true"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="contact-subject" className="text-sm font-medium">Subject</label>
                      <Input
                        id="contact-subject"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                        required
                        disabled={isSubmitting}
                        aria-required="true"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-message" className="text-sm font-medium">Message</label>
                      <Textarea
                        id="contact-message"
                        value={contactForm.message}
                        onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                        rows={5}
                        required
                        disabled={isSubmitting}
                        aria-required="true"
                        aria-describedby="message-help"
                      />
                      <p id="message-help" className="text-xs text-muted-foreground mt-1">
                        Please provide as much detail as possible to help us assist you better.
                      </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Sending Message...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpSupport; 