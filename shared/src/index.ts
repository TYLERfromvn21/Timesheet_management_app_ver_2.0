// Shared types and interfaces will go here
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Timesheet {
  id: string;
  userId: string;
  date: Date;
  hours: number;
}
