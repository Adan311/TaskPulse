// import { useState, useEffect } from "react";
// import { AppLayout } from "@/frontend/components/layout/AppLayout";
// import { Button } from "@/frontend/components/ui/button";
// import { Plus } from "lucide-react";
// import { CheckCircle, XCircle } from "lucide-react";
// import { format } from "date-fns";
// import { Card, CardContent, CardHeader, CardTitle } from "@/frontend/components/ui/card";
// import { CalendarHeader } from "@/frontend/features/calendar/components/CalendarHeader";
// import { CalendarSidebar } from "@/frontend/features/calendar/components/CalendarSidebar";
// import { MonthView } from "@/frontend/features/calendar/components/MonthView";
// import { WeekView } from "@/frontend/features/calendar/components/WeekView";
// import { ListView } from "@/frontend/features/calendar/components/ListView";
// import { EventDialog } from "@/frontend/features/calendar/components/EventDialog";
// import { GoogleCalendarButton } from "@/frontend/features/calendar/components/GoogleCalendarButton";
// import { DisconnectGoogleCalendarButton } from "@/frontend/features/calendar/components/DisconnectGoogleCalendarButton";
// import { getEvents } from "@/backend/api/services/eventService";
// import { getConnectedCalendars } from "@/backend/api/services/googleCalendarService";
// import { supabase } from "@/integrations/supabase/client";
// import { Event } from "@/frontend/types/calendar";
// import { DayView } from "@/frontend/features/calendar/components/DayView";
// import { ChevronUp, ChevronDown, RefreshCw, Calendar as CalendarIcon, LogOut } from "lucide-react";

// export default function Calendar() {
//   const [date, setDate] = useState<Date | undefined>(new Date());
//   const [view, setView] = useState<"month" | "week" | "day" | "list">("month");
//   // Debug: log current view on each render
//   useEffect(() => {
//     console.log('Calendar: view changed to', view);
//   }, [view]);
//   const [eventDialogOpen, setEventDialogOpen] = useState(false);
//   const [events, setEvents] = useState<Event[]>([]);
//   const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
//   const [hasGoogleCalendar, setHasGoogleCalendar] = useState(false);
//   const [user, setUser] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [calendarId, setCalendarId] = useState<string | null>(null);

//   useEffect(() => {
//     // Get the current user when component mounts
//     const getCurrentUser = async () => {
//       const { data } = await supabase.auth.getUser();
//       setUser(data.user);
//     };

//     getCurrentUser();

//     // Set up auth state change listener
//     const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
//       setUser(session?.user || null);
//     });

//     return () => {
//       authListener?.subscription?.unsubscribe();
//     };
//   }, []);

//   const fetchEvents = async () => {
//     try {
//       if (!user) return;

//       setLoading(true);
//       const data = await getEvents();
//       setEvents(data);
//       setLoading(false);
//     } catch (error) {
//       console.error("Error fetching events:", error);
//       setLoading(false);
//     }
//   };

//   const checkGoogleCalendar = async () => {
//     try {
//       if (!user) {
//         setHasGoogleCalendar(false);
//         setCalendarId(null);
//         return;
//       }

//       // Fetch connected calendars, expect [{ id, ... }]
//       const calendars = await getConnectedCalendars();
//       setHasGoogleCalendar(calendars.length > 0);
//       setCalendarId(calendars.length > 0 ? calendars[0].id : null);
//     } catch (error) {
//       console.error("Error checking Google Calendar:", error);
//       setCalendarId(null);
//     }
//   };

//   useEffect(() => {
//     if (user) {
//       fetchEvents();
//       checkGoogleCalendar();
//     }
//   }, [user]);

//   const handleEditEvent = (event: Event) => {
//     setSelectedEvent(event);
//     setEventDialogOpen(true);
//   };

//   const renderView = () => {
//     console.log('renderView: view =', view, 'date =', date);
//     const props = {
//       events,
//       date,
//       onEditEvent: handleEditEvent,
//       onEventsChange: fetchEvents,
//     };

//     switch (view) {
//       case "month":
//         return <MonthView {...props} />;
//       case "week":
//         return <WeekView {...props} />;
//       case "day":
//         return date ? <DayView events={events} date={date} onEditEvent={handleEditEvent} /> : null;
//       case "list":
//         return <ListView events={events} onEditEvent={handleEditEvent} onEventsChange={fetchEvents} />;
//       default:
//         return <MonthView {...props} />;
//     }
//   };

//   return (
//     <AppLayout>
//       <div className="p-6 space-y-6">
//         <CalendarHeader
//           date={date}
//           view={view}
//           setDate={setDate}
//           setView={setView}
//         />

//         <div className="flex gap-6">
//           <CalendarSidebar date={date} setDate={setDate} />
//           <div className="flex-1">
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between">
//                 <CardTitle>
//                   {date ? format(date, "EEEE, MMMM d, yyyy") : "Select a date"}
//                 </CardTitle>
                
//               </CardHeader>
//               <CardContent>
//                 {!user ? (
//                   <div className="text-center p-6">
//                     <p className="text-muted-foreground">
//                       Please sign in to view and manage your calendar.
//                     </p>
//                   </div>
//                 ) : (
//                   renderView()
//                 )}
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>

//       <EventDialog
//         open={eventDialogOpen}
//         onOpenChange={setEventDialogOpen}
//         onSuccess={fetchEvents}
//         event={selectedEvent}
//       />
//     </AppLayout>
//   );
// }
