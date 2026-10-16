'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Dish } from '../../lib/menu';
import './panel.css';

const blank = (): Dish => ({
  id:'', category:'Plats',
  translations:{
    fr:{name:'',description:'',ingredients:''},
    en:{name:'',description:'',ingredients:''},
    es:{name:'',description:'',ingredients:''},
  },
  imageUrl:'', available:true, signature:false, order:0, regularPriceCents:null, lunchIncluded:false, lunchPriceCents:null,
});
const request = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, { ...options, cache:'no-store', headers:{'Content-Type':'application/json',...options?.headers} });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Request failed');
  return body;
};

function PriceInput({price,onPrice,required=false}:{price:number|null;onPrice:(value:string)=>void;required?:boolean}) {
  const [value,setValue]=useState(price===null?'':(price/100).toFixed(2));
  return <input type="text" inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" value={value} required={required} onChange={e=>{setValue(e.target.value);onPrice(e.target.value);}} onBlur={()=>{const amount=Number(value.replace(',','.'));if(value&&Number.isFinite(amount))setValue(amount.toFixed(2));}}/>;
}

export default function AdminPanel() {
  const [status,setStatus] = useState<'loading'|'locked'|'ready'|'unconfigured'>('loading');
  const [password,setPassword] = useState('');
  const [items,setItems] = useState<Dish[]>([]);
  const [draft,setDraft] = useState<Dish | null>(null);
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  const reload = useCallback(async () => { setItems(await request('/api/admin/menu')); },[]);
  useEffect(() => { request('/api/admin/session').then(async s => {
    if (!s.configured) setStatus('unconfigured');
    else if (s.authenticated) { await reload(); setStatus('ready'); }
    else setStatus('locked');
  }).catch(e => setMessage(e.message)); },[reload]);

  async function login(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('');
    try { await request('/api/admin/session',{method:'POST',body:JSON.stringify({password})}); setPassword(''); await reload(); setStatus('ready'); }
    catch(e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!draft) return; setBusy(true); setMessage('');
    try {
      await request(draft.id ? `/api/admin/menu/${draft.id}` : '/api/admin/menu',{method:draft.id?'PUT':'POST',body:JSON.stringify(draft)});
      await reload(); setDraft(null); setMessage('Enregistré. La carte est mise à jour.');
    } catch(e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  async function remove(dish: Dish) {
    if (!confirm(`Supprimer « ${dish.translations.fr.name} » ?`)) return;
    setBusy(true); setMessage('');
    try { await request(`/api/admin/menu/${dish.id}`,{method:'DELETE'}); await reload(); setDraft(null); }
    catch(e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }
  const set = (patch: Partial<Dish>) => setDraft(current => current && ({...current,...patch}));
  const setPrice = (field: 'regularPriceCents'|'lunchPriceCents', value: string) => {
    const normalized = value.replace(',', '.').trim();
    set({ [field]: normalized === '' ? null : Math.round(Number(normalized) * 100) } as Partial<Dish>);
  };
  const editFrench = (field: 'name'|'description'|'ingredients', value: string) =>
    setDraft(current => current && ({...current,translations:{...current.translations,fr:{...current.translations.fr,[field]:value}}}));
  async function upload(file: File) {
    setBusy(true); setMessage('Téléchargement…');
    try {
      const form = new FormData(); form.set('file',file);
      const res = await fetch('/api/admin/media',{method:'POST',body:form});
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');
      set({imageUrl:result.url}); setMessage('Photo envoyée. Enregistrez le plat pour confirmer.');
    } catch(e) { setMessage((e as Error).message); } finally { setBusy(false); }
  }

  return <main className="adminPanel">
    <header><h1>NOMADE <span>· La carte</span></h1>{status === 'ready' && <button type="button" onClick={async()=>{await request('/api/admin/session',{method:'DELETE'});setStatus('locked');setItems([]);setDraft(null)}}>Déconnexion</button>}</header>
    {message && <p role="status" className="adminMessage">{message}</p>}
    {status === 'loading' && <p>Chargement…</p>}
    {status === 'unconfigured' && <p>Configurez NOMADE_ADMIN_PASSWORD et NOMADE_ADMIN_SECRET (32 caractères minimum) dans les variables d’environnement du serveur.</p>}
    {status === 'locked' && <form className="adminLogin" onSubmit={login}><h2>Connexion</h2><label>Mot de passe<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /></label><button disabled={busy}>Se connecter</button></form>}
    {status === 'ready' && <>
      <div className="adminToolbar"><p>{items.length} plat{items.length !== 1 && 's'}</p><Link href="/admin/reservations">Voir les réservations</Link><button onClick={()=>{setDraft(blank());setMessage('')}}>+ Ajouter un plat</button><a href="/fr/carte" target="_blank" rel="noreferrer">Voir la carte ↗</a></div>
      <div className="adminList">{items.map(d => <article key={d.id}><div><strong>{d.translations.fr.name}</strong><small>{d.category} · {d.available?'Disponible':'Indisponible'} {d.signature && '· ★ Accueil'} {d.lunchIncluded && `· Déjeuner ${((d.lunchPriceCents || 0)/100).toFixed(2)} €`}</small></div><button onClick={()=>{setDraft(structuredClone(d));setMessage('')}}>Modifier</button></article>)}</div>
      {draft && <form className="adminEditor" onSubmit={save}>
        <div className="adminEditorTop"><h2>{draft.id?'Modifier le plat':'Ajouter un plat'}</h2><button type="button" onClick={()=>setDraft(null)}>Fermer ×</button></div>
        <p className="muted">La carte publique affiche le nom, la description et la composition. La photo est utilisée sur l’accueil et dans Déjeuner à partager. Les prix normaux ne sont pas affichés sur la carte publique.</p>
        <div className="adminFields"><label>Catégorie<input value={draft.category} maxLength={80} onChange={e=>set({category:e.target.value})} required /></label><label>Ordre d’affichage<input type="number" value={draft.order} onChange={e=>set({order:Number(e.target.value)})} /></label><label>Prix normal (€)<PriceInput key={`${draft.id}-regular`} price={draft.regularPriceCents} onPrice={value=>setPrice('regularPriceCents',value)} /></label></div>
        <fieldset><legend>FR · plat</legend>
          <label>Nom<input value={draft.translations.fr.name} onChange={e=>editFrench('name',e.target.value)} maxLength={120} required /></label>
          <label>Description<textarea value={draft.translations.fr.description} onChange={e=>editFrench('description',e.target.value)} maxLength={500} rows={2} /></label>
          <label>Composition<textarea value={draft.translations.fr.ingredients} onChange={e=>editFrench('ingredients',e.target.value)} maxLength={500} rows={2} /></label>
        </fieldset>
        <div className="adminChecks"><label><input type="checkbox" checked={draft.available} onChange={e=>set({available:e.target.checked})} />Disponible</label><label><input type="checkbox" checked={draft.signature} onChange={e=>set({signature:e.target.checked})} />★ Mettre en avant sur l’accueil</label></div>
        <fieldset className="lunchEditor"><legend>Déjeuner à partager</legend><label className="adminInlineCheck"><input type="checkbox" checked={draft.lunchIncluded} onChange={e=>set({lunchIncluded:e.target.checked})} />Inclure dans le programme</label><label>Prix spécial (€)<PriceInput key={`${draft.id}-lunch`} price={draft.lunchPriceCents} required={draft.lunchIncluded} onPrice={value=>setPrice('lunchPriceCents',value)} /></label><p className="muted">Le prix normal est utilisé pour 1 à 4 plats et pour les boissons. À partir de 5 plats, le prix spécial est appliqué aux plats. Utilisez « Plats » pour les plats principaux et « Boissons » pour les boissons.</p></fieldset>
        {<label>Photo (accueil ou Déjeuner · JPEG, PNG, WebP · 8 Mo)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>e.target.files?.[0] && upload(e.target.files[0])} /><input aria-label="URL de la photo" value={draft.imageUrl} onChange={e=>set({imageUrl:e.target.value})} placeholder="URL HTTPS ou photo téléchargée" /></label>}
        <div className="adminActions"><button disabled={busy} type="submit">{busy?'Enregistrement…':'Enregistrer'}</button>{draft.id && <button className="danger" type="button" disabled={busy} onClick={()=>remove(draft)}>Supprimer</button>}</div>
      </form>}
    </>}
  </main>;
}
