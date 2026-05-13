export interface Shift {
  open: string;  // "HH:mm"
  close: string; // "HH:mm"
}

export interface DaySchedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  shifts: Shift[];
}
