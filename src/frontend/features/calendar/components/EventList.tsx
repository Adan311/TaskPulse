
import { Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/frontend/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/frontend/components/ui/table";
import { Event } from "@/frontend/types/calendar";

interface EventListProps {
  events: Event[];
}

export function EventList({ events }: EventListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Time</TableHead>
          <TableHead>Event</TableHead>
          <TableHead>Participants</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <TableRow key={event.id}>
            <TableCell>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                {event.startTime} - {event.endTime}
              </div>
            </TableCell>
            <TableCell>{event.title}</TableCell>
            <TableCell>
              <div className="flex -space-x-2">
                {event.participants?.map((participant, i) => (
                  <Avatar key={i} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={participant.avatar} alt={participant.name} />
                    <AvatarFallback>{participant.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
