import ReservationsDashboard from './reservations-dashboard';

export const metadata = {
  title: 'NOMADE — Réservations',
  robots: { index:false, follow:false },
};

export default function ReservationsPage() {
  return <ReservationsDashboard />;
}
