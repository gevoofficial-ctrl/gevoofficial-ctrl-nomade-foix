'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { defaultHomeContent, homeLanguages, homePhotos, homePhotoSlots, homeTextSections, type HomeContent, type HomeLanguage, type HomePhoto } from '../../../lib/home-content';
import type { HomeVersion } from '../../../lib/home-content-store';

const labels = { fr: 'Français', en: 'Anglais', es: 'Espagnol' };
const original = defaultHomeContent();

async function homeRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: 'no-store' }).catch(() => {
    throw new Error('Connexion impossible. Réessayez.');
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    throw new Error(data?.error || 'Le serveur ne répond pas. Réessayez.');
  }
  return data;
}

export default function HomeEditor() {
  const [saved, setSaved] = useState<HomeVersion | null>(null);
  const [draft, setDraft] = useState<HomeContent | null>(null);
  const [lang, setLang] = useState<HomeLanguage>('fr');
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const dirty = !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved.content);

  useEffect(() => {
    const controller = new AbortController();
    homeRequest<HomeVersion>('/api/admin/home', { signal: controller.signal }).then(version => {
      setSaved(version);
      setDraft(version.content);
    }).catch(error => {
      if (!controller.signal.aborted) setMessage({ text: error.message, error: true });
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function edit(update: (content: HomeContent) => void) {
    setDraft(current => {
      if (!current) return null;
      const next = structuredClone(current);
      update(next);
      return next;
    });
    setMessage(null);
  }

  async function upload(slot: HomePhoto, file: File) {
    setMessage(null);
    setWorking(true);
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
        throw new Error('Choisissez une image JPEG, PNG ou WebP de 8 Mo maximum.');
      }
      const bitmap = await createImageBitmap(file).catch(() => null);
      if (!bitmap) throw new Error('Cette image ne peut pas être ouverte.');
      bitmap.close();
      const form = new FormData();
      form.set('file', file);
      const result = await homeRequest<{ url: string; type: string }>('/api/admin/media', { method: 'POST', body: form });
      if (result.type !== 'image') throw new Error('Le fichier doit être une image.');
      edit(content => { content.photos[slot] = result.url; });
      setMessage({ text: 'Photo importée. Publiez la page pour la mettre en ligne.' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Impossible d’importer la photo.', error: true });
    } finally {
      setWorking(false);
    }
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || !saved || !dirty || working) return;
    setWorking(true);
    setMessage(null);
    try {
      const result = await homeRequest<HomeVersion>('/api/admin/home', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft, revision: saved.revision }),
      });
      setSaved(result);
      setDraft(result.content);
      setMessage({ text: 'La page d’accueil a été publiée.' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Impossible de publier.', error: true });
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className="adminPanel homeAdmin" lang="fr">
      <header><h1>NOMADE <span>· Page d’accueil</span></h1></header>
      <nav className="adminToolbar" aria-label="Administration">
        <Link href="/admin" onClick={event => {
          if (dirty && !window.confirm('Quitter sans publier vos modifications ?')) event.preventDefault();
        }}>Retour à l’administration</Link>
        {draft && <>
          <a href="#home-photos-heading">Aller aux photos</a>
          <a href={`/${lang}`} target="_blank" rel="noreferrer">Voir la page publiée ↗</a>
        </>}
      </nav>

      {!draft && <p className="adminMessage" role="status">{message?.text ?? 'Chargement de la page d’accueil…'}</p>}
      {draft && (
        <form onSubmit={publish} noValidate>
          <fieldset className="homeAdminForm" disabled={working}>
            <legend className="srOnly">Contenu de la page d’accueil</legend>
            <label className="homeAdminLanguage">Langue des textes
              <select value={lang} onChange={event => setLang(event.target.value as HomeLanguage)}>
                {homeLanguages.map(code => <option key={code} value={code}>{labels[code]} ({code.toUpperCase()})</option>)}
              </select>
            </label>

            <section aria-labelledby="home-text-heading">
              <h2 id="home-text-heading">Textes</h2>
              {homeTextSections.map(section => (
                <details key={section.title} open={section.title === homeTextSections[0].title}>
                  <summary>{section.title}</summary>
                  <div className="homeAdminFields">
                    {section.fields.map(({ key, label, max }) => {
                      const props = {
                        value: draft.texts[lang][key], maxLength: max, required: true, lang,
                        onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                          const value = event.currentTarget.value;
                          edit(content => { content.texts[lang][key] = value; });
                        },
                      };
                      return <label key={key}>{label}{max > 150 ? <textarea {...props} rows={4} /> : <input {...props} />}</label>;
                    })}
                  </div>
                </details>
              ))}
            </section>

            <section aria-labelledby="home-photos-heading">
              <h2 id="home-photos-heading">Photos</h2>
              <p className="muted">Les photos sont communes aux trois langues. Leurs descriptions se modifient dans la langue sélectionnée.</p>
              <div className="homeAdminPhotos">
                {homePhotos.map(slot => {
                  const { label, original: defaultSrc } = homePhotoSlots[slot];
                  const src = draft.photos[slot] || defaultSrc || '/video/nomade-hero-poster-v2.webp';
                  return (
                    <fieldset key={slot}>
                      <legend>{label}</legend>
                      <div className="homeAdminPreview">
                        <Image src={src} alt={slot === 'hero' ? '' : draft.alt[lang][slot]} fill sizes="(max-width: 620px) 88vw, 300px" />
                      </div>
                      {slot === 'hero' && <small>{draft.photos.hero ? 'Photo à la place de la vidéo.' : 'Vidéo d’origine. Importez une photo pour la remplacer.'}</small>}
                      <label>Importer une photo · {label}
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
                          const file = event.currentTarget.files?.[0];
                          event.currentTarget.value = '';
                          if (file) void upload(slot, file);
                        }} />
                      </label>
                      {slot !== 'hero' && <label>Description de la photo · {labels[lang]}
                        <input lang={lang} value={draft.alt[lang][slot]} maxLength={180} required onChange={event => {
                          const value = event.currentTarget.value;
                          edit(content => { content.alt[lang][slot] = value; });
                        }} />
                      </label>}
                      {draft.photos[slot] && <button type="button" className="homeAdminSecondary" onClick={() => edit(content => {
                        content.photos[slot] = '';
                        if (slot !== 'hero') {
                          for (const code of homeLanguages) content.alt[code][slot] = original.alt[code][slot];
                        }
                      })}>{slot === 'hero' ? 'Rétablir la vidéo' : 'Rétablir la photo d’origine'}</button>}
                    </fieldset>
                  );
                })}
              </div>
              <p className="muted">Les photos et descriptions des plats signatures se modifient dans <Link href="/admin" onClick={event => {
                if (dirty && !window.confirm('Quitter sans publier vos modifications ?')) event.preventDefault();
              }}>La carte</Link>.</p>
            </section>
          </fieldset>

          <div className="homeAdminPublish">
            <p role={message?.error ? 'alert' : 'status'}>
              {message?.text ?? (dirty ? 'Modifications à publier.' : 'Aucune modification en attente.')}
            </p>
            <button type="submit" disabled={working || !dirty}>{working ? 'Veuillez patienter…' : 'Publier la page'}</button>
          </div>
        </form>
      )}
    </main>
  );
}
