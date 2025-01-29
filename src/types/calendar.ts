export interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  participants: { name: string; avatar: string }[];
  color: string;
}