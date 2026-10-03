export const reservationTimeSlots = [
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00',
] as const;

export function isReservationTime(value: unknown): value is (typeof reservationTimeSlots)[number] {
  return typeof value === 'string' && reservationTimeSlots.includes(value as (typeof reservationTimeSlots)[number]);
}
