'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Dish, Lang } from '../../lib/menu';
import './panel.css';

const blank = (): Dish => ({
  id: '', category:'Plats', translations: {fr:{name:'',description:''}, en:{name:'',description:''}, es:{name:'',description:''}},
  priceCents:0, imageUrl:'', videoUrl:'', allergens:[], vegetarian:false, vegan:false, glutenFree:false,
  available:true, signature:false, order:0,
});
const allergenNames = ['Céréales/gluten','Crustacés','Œufs','Poissons','Arachides','Soja','Lait','Fruits à coque','Céleri','Moutarde','Sésame','Sulfites','Lupin','Mollusques'];
const request = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, { ...options, cache:'no-store', headers:{'Content-Type':'application/json',...options?.headers} });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
};

export default function AdminPanel() {
  const [status,setStatus] = useState<'loading'|'locked'|'ready'|'unconfigured'>('loading');
  const [password,setPassword] = useState('');
  const [items,setItems] = useState<Dish[]>([]);
  const [draft,setDraft] = useState<Dish | null>(null);
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  const reload = useCallback(async () => { setItems(await request('/api/admin/menu')); },[]);
  useEffect(() => {
    request('/api/admin/session').then(async s => {
      if (!s.configured) setStatus('unconfigured');
      else if (s.authenticated) { await reload(); setStatus('ready'); }
      else setStatus('locked');
    }).catch(e => setMessage(e.message));
  },[reload]);
  async function login(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('');
    try { await request('/api/admin/session',{method:'POST',body:JSON.stringify({password})}); setPassword(''); await reload(); setStatus('ready'); }
    catch(e) { setMessage((e as Error).message); }
    finally { setBusy(false); }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!draft) return;
    setBusy(true); setMessage('');
    try {
      const url = draft.id ? `/api/admin/menu/${draft.id}` : '/api/admin/menu';
      await request(url,{method:draft.id?'PUT':'POST',body:JSON.stringify(draft)});
      await reload(); setDraft(null); setMessage('Enregistré. La carte est mise à jour.');
    } catch(e) { setMessage((e as Error).message); }
    finally { setBusy(false); }
  }
  async function remove(dish: Dish) {
    if (!confirm(`Supprimer « ${dish.translations.fr.name} » ?`)) return;
    setBusy(true); setMessage('');
    try { await request(`/api/admin/menu/${dish.id}`,{method:'DELETE'}); await reload(); setDraft(null); }
    catch(e) { setMessage((e as Error).message); }
    finally { setBusy(false); }
  }
  const set = (patch: Partial<Dish>) => setDraft(current => current && ({...current,...patch}));
  const editTranslation = (lang: Lang, field: 'name'|'description', value: string) =>
    setDraft(current => current && ({...current,translations:{...current.translations,[lang]:{...current.translations[lang],[field]:value}}}));
  async function upload(file: File, field: 'imageUrl'|'videoUrl') {
    setBusy(true); setMessage('Téléchargement…');
    try {
      const form = new FormData(); form.set('file',file);
      const res = await fetch('/api/admin/media',{method:'POST',body:form});
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');
      set({[field]:result.url}); setMessage('Fichier envoyé. Enregistrez le plat pour confirmer.');
    } catch(e) { setMessage((e as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="adminPanel">
    <header><h1>NOMADE <span>· La carte</span></h1>{status === 'ready' && <button type="button" onClick={async()=>{await request('/api/admin/session',{method:'DELETE'});setStatus('locked');setItems([]);setDraft(null)}}>Déconnexion</button>}</header>
    {message && <p role="status" className="adminMessage">{message}</p>}
    {status === 'loading' && <p>Chargement…</p>}
    {status === 'unconfigured' && <p>Configurez NOMADE_ADMIN_PASSWORD et NOMADE_ADMIN_SECRET (32 caractères minimum) dans les variables d’environnement du serveur.</p>}
    {status === 'locked' && <form className="adminLogin" onSubmit={login}><h2>Connexion</h2><label>Mot de passe<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /></label><button disabled={busy}>Se connecter</button></form>}
    {status === 'ready' && <>
      <div className="adminToolbar"><p>{items.length} plat{items.length !== 1 && 's'}</p><button onClick={()=>{setDraft(blank());setMessage('')}}>+ Ajouter un plat</button><a href="/fr/carte" target="_blank" rel="noreferrer">Voir la carte ↗</a></div>
      <div className="adminList">{items.map(d => <article key={d.id}><div><strong>{d.translations.fr.name}</strong><small>{d.category} · {(d.priceCents/100).toFixed(2)} € · {d.available?'Disponible':'Indisponible'} {d.signature && '· ★ Signature'}</small></div><button onClick={()=>{setDraft(structuredClone(d));setMessage('')}}>Modifier</button></article>)}</div>
      {draft && <form className="adminEditor" onSubmit={save}><div className="adminEditorTop"><h2>{draft.id?'Modifier le plat':'Ajouter un plat'}</h2><button type="button" onClick={()=>setDraft(null)}>Fermer ×</button></div>
        <div className="adminFields"><label>Catégorie (nom affiché)<input value={draft.category} maxLength={80} onChange={e=>set({category:e.target.value})} required /></label><label>Prix en €<input type="number" min="0" max="100000" step="0.01" value={(draft.priceCents/100).toFixed(2)} onChange={e=>set({priceCents:Math.round(Number(e.target.value)*100)})} required /></label><label>Ordre d’affichage<input type="number" value={draft.order} onChange={e=>set({order:Number(e.target.value)})} /></label></div>
        {(['fr','en','es'] as const).map(lang=><fieldset key={lang}><legend>{lang.toUpperCase()} {lang === 'fr' && '· obligatoire'}</legend><label>Nom<input value={draft.translations[lang].name} onChange={e=>editTranslation(lang,'name',e.target.value)} maxLength={120} required={lang==='fr'} /></label><label>Description<textarea value={draft.translations[lang].description} onChange={e=>editTranslation(lang,'description',e.target.value)} maxLength={500} rows={2} /></label></fieldset>)}
        <div className="adminFields"><label>Photo (JPEG, PNG, WebP · 8 Mo)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>e.target.files?.[0] && upload(e.target.files[0],'imageUrl')} /><input aria-label="URL de la photo" value={draft.imageUrl} onChange={e=>set({imageUrl:e.target.value})} placeholder="URL HTTPS ou photo téléchargée" /></label><label>Vidéo (MP4, WebM · 30 Mo)<input type="file" accept="video/mp4,video/webm" onChange={e=>e.target.files?.[0] && upload(e.target.files[0],'videoUrl')} /><input aria-label="URL de la vidéo" value={draft.videoUrl} onChange={e=>set({videoUrl:e.target.value})} placeholder="URL HTTPS ou vidéo téléchargée" /></label></div>
        <fieldset><legend>Allergènes</legend><div className="adminChecks">{allergenNames.map((name,i)=><label key={i}><input type="checkbox" checked={draft.allergens.includes(i+1)} onChange={e=>set({allergens:e.target.checked?[...draft.allergens,i+1]:draft.allergens.filter(n=>n!==i+1)})} />{i+1}. {name}</label>)}</div></fieldset>
        <div className="adminChecks"><label><input type="checkbox" checked={draft.vegetarian} onChange={e=>set({vegetarian:e.target.checked})} />Vegetarian</label><label><input type="checkbox" checked={draft.vegan} onChange={e=>set({vegan:e.target.checked})} />Vegan</label><label><input type="checkbox" checked={draft.glutenFree} onChange={e=>set({glutenFree:e.target.checked})} />Gluten-free</label><label><input type="checkbox" checked={draft.available} onChange={e=>set({available:e.target.checked})} />Disponible</label><label><input type="checkbox" checked={draft.signature} onChange={e=>set({signature:e.target.checked})} />★ Signature</label></div>
        <div className="adminActions"><button disabled={busy} type="submit">{busy?'Enregistrement…':'Enregistrer'}</button>{draft.id && <button className="danger" type="button" disabled={busy} onClick={()=>remove(draft)}>Supprimer</button>}</div>
      </form>}
    </>}
  </main>;
}
