import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="notFoundPage">
      <p className="eyebrow">NOMADE · FOIX</p>
      <h1>Page introuvable</h1>
      <p className="lead">La page demandée n’existe pas ou n’est plus disponible.</p>
      <Link className="button" href="/fr">Retour à l’accueil</Link>
    </main>
  );
}
