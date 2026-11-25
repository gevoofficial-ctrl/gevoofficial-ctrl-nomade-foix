import HomeEditor from './editor';
import '../panel.css';
import './editor.css';

export const metadata = {
  title: 'NOMADE — Page d’accueil',
  robots: { index: false, follow: false },
};

export default function AdminHome() {
  return <HomeEditor />;
}
