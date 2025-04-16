
import { AppLayout } from "@/frontend/components/layout/AppLayout";
import { Button } from "@/frontend/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/frontend/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/frontend/components/ui/tabs";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/frontend/components/ui/accordion";
import { Badge } from "@/frontend/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { Calendar } from "@/frontend/components/ui/calendar";
import { Switch } from "@/frontend/components/ui/switch";
import { Label } from "@/frontend/components/ui/label";
import { Slider } from "@/frontend/components/ui/slider";
import { Input } from "@/frontend/components/ui/input";
import { Checkbox } from "@/frontend/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/frontend/components/ui/radio-group";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/frontend/components/ui/tooltip";
import { AlertCircle, CalendarDays, Bell, User, Shield, Copy, Check } from "lucide-react";

export default function Components() {
  return (
    <AppLayout>
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Component Library</h1>
          <p className="text-muted-foreground mb-6">
            A showcase of available UI components for your application.
          </p>
        </div>

        <Tabs defaultValue="buttons">
          <TabsList className="grid grid-cols-5 w-[600px]">
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="forms">Form Controls</TabsTrigger>
            <TabsTrigger value="data">Data Display</TabsTrigger>
            <TabsTrigger value="misc">Miscellaneous</TabsTrigger>
          </TabsList>
          
          <TabsContent value="buttons" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Button Variants</CardTitle>
                <CardDescription>
                  Various button styles for different contexts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Button size="sm">Small</Button>
                  <Button>Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon"><User /></Button>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Button disabled>Disabled</Button>
                  <Button variant="outline" disabled>Disabled Outline</Button>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Button>
                    <Shield className="mr-2 h-4 w-4" /> With Icon
                  </Button>
                  <Button variant="outline">
                    <CalendarDays className="mr-2 h-4 w-4" /> Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cards" className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card description goes here</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Card content with information.</p>
                </CardContent>
                <CardFooter>
                  <Button>Action</Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="bg-muted/50 border-b">
                  <CardTitle>Card with Header Styling</CardTitle>
                  <CardDescription>With a styled header area</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <p>Different card style with enhanced header.</p>
                </CardContent>
                <CardFooter className="border-t bg-muted/30 flex justify-between">
                  <Button variant="outline">Cancel</Button>
                  <Button>Submit</Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="forms" className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Form Controls</CardTitle>
                  <CardDescription>Basic form elements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Enter your name" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="select">Select</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option1">Option 1</SelectItem>
                        <SelectItem value="option2">Option 2</SelectItem>
                        <SelectItem value="option3">Option 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <Label htmlFor="terms">Accept terms and conditions</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Radio Group</Label>
                    <RadioGroup defaultValue="option1">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="option1" id="option1" />
                        <Label htmlFor="option1">Option 1</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="option2" id="option2" />
                        <Label htmlFor="option2">Option 2</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Controls</CardTitle>
                  <CardDescription>More interactive form elements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="slider">Slider (0-100)</Label>
                    <Slider defaultValue={[50]} max={100} step={1} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications">Notifications</Label>
                      <Switch id="notifications" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications when new content is available.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Date Picker</Label>
                    <Calendar mode="single" className="border rounded-md p-3" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="data" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Display Components</CardTitle>
                <CardDescription>Components for displaying data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Badges</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Accordion</h3>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Section 1</AccordionTrigger>
                      <AccordionContent>
                        Content for section 1 goes here. You can add any content
                        you want here.
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                      <AccordionTrigger>Section 2</AccordionTrigger>
                      <AccordionContent>
                        Content for section 2 goes here. Accordions are useful
                        for displaying organized content.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="misc" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Miscellaneous Components</CardTitle>
                <CardDescription>Other helpful UI components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Tooltips</h3>
                  <div className="flex gap-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline">Hover me</Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This is a tooltip</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon">
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Important information</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Code Block</h3>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                      <code className="text-sm font-mono">
                        {`const Button = ({ children, ...props }) => {
  return <button {...props}>{children}</button>;
};`}
                      </code>
                    </pre>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        navigator.clipboard.writeText(`const Button = ({ children, ...props }) => {
  return <button {...props}>{children}</button>;
};`);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
