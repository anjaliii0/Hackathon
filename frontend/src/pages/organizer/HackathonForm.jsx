import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, Save, ArrowLeft, ImagePlus, Plus, X } from 'lucide-react';
import { hackathonService } from '../../services/services';
import toast from 'react-hot-toast';
import s from './Organizer.module.css';

const PRESET_THEMES = ['AI/ML', 'Web Development', 'Blockchain', 'Healthcare', 'Open Innovation', 'FinTech', 'Sustainability', 'AR/VR'];

const blank = {
  title: '', description: '', mode: 'online', location: '', venue: '',
  registrationStart: '', registrationEnd: '', registrationDeadline: '',
  hackathonStart: '', hackathonEnd: '',
  teamSize: { min: 1, max: 4 }, maxParticipants: '',
  themes: [], prizePool: '', prizes: [],
};

// trim an ISO date to the yyyy-mm-dd a <input type=date> expects
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export default function HackathonForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const bannerRef = useRef();

  const [form, setForm] = useState(blank);
  const [customTheme, setCustomTheme] = useState('');
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    hackathonService.getById(id)
      .then(res => {
        const h = res.data.data;
        setForm({
          title: h.title || '', description: h.description || '',
          mode: h.mode || 'online', location: h.location || '', venue: h.venue || '',
          registrationStart: toDateInput(h.registrationStart),
          registrationEnd: toDateInput(h.registrationEnd),
          registrationDeadline: toDateInput(h.registrationDeadline),
          hackathonStart: toDateInput(h.hackathonStart),
          hackathonEnd: toDateInput(h.hackathonEnd),
          teamSize: { min: h.teamSize?.min ?? 1, max: h.teamSize?.max ?? 4 },
          maxParticipants: h.maxParticipants || '',
          themes: h.themes || [], prizePool: h.prizePool || '',
          prizes: h.prizes || [],
        });
        setBanner(h.banner);
      })
      .catch(() => toast.error('Failed to load hackathon'))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setTeam = (k, v) => setForm(f => ({ ...f, teamSize: { ...f.teamSize, [k]: Number(v) } }));

  const toggleTheme = (t) => setForm(f => ({
    ...f, themes: f.themes.includes(t) ? f.themes.filter(x => x !== t) : [...f.themes, t],
  }));
  const addCustomTheme = () => {
    const t = customTheme.trim();
    if (t && !form.themes.includes(t)) set('themes', [...form.themes, t]);
    setCustomTheme('');
  };

  const addPrize = () => set('prizes', [...form.prizes, { rank: form.prizes.length + 1, title: '', amount: '' }]);
  const setPrize = (i, k, v) => set('prizes', form.prizes.map((p, idx) => idx === i ? { ...p, [k]: v } : p));
  const removePrize = (i) => set('prizes', form.prizes.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
        prizePool: form.prizePool ? Number(form.prizePool) : 0,
        prizes: form.prizes
          .filter(p => p.title || p.amount)
          .map(p => ({ rank: Number(p.rank), title: p.title, amount: Number(p.amount) || 0 })),
      };

      let hackathonId = id;
      if (editing) {
        await hackathonService.update(id, payload);
      } else {
        const res = await hackathonService.create(payload);
        hackathonId = res.data.data._id;
      }

      // Upload banner if a new file was chosen
      if (banner instanceof File) {
        const fd = new FormData();
        fd.append('banner', banner);
        await hackathonService.uploadBanner(hackathonId, fd);
      }

      toast.success(editing ? 'Hackathon updated' : 'Hackathon created — pending admin approval');
      navigate(`/organizer/hackathons/${hackathonId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  if (loading) return <div className={s.page}><div className={s.loading}><Loader2 size={28} className={s.spinner} /> Loading…</div></div>;

  const showVenue = form.mode === 'offline' || form.mode === 'hybrid';

  return (
    <div className={s.page}>
      <Link to="/organizer/hackathons" className={s.backLink}><ArrowLeft size={15} /> Back to hackathons</Link>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>{editing ? 'Edit Hackathon' : 'Create Hackathon'}</h1>
          <p className={s.subtitle}>
            {editing ? 'Update event details' : 'New hackathons are submitted for admin approval before going live'}
          </p>
        </div>
      </div>

      <form className={s.card} onSubmit={submit}>
        <div className={s.form}>
          {/* Banner */}
          <div className={s.field}>
            <label className={s.label}>Banner</label>
            <div
              onClick={() => bannerRef.current.click()}
              style={{
                height: 150, borderRadius: 'var(--radius)', border: '1px dashed var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                overflow: 'hidden', background: 'var(--bg-hover)', color: 'var(--text-muted)',
              }}>
              {banner
                ? <img src={banner instanceof File ? URL.createObjectURL(banner) : banner} alt="banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><ImagePlus size={20} /> Click to upload banner</span>}
            </div>
            <input ref={bannerRef} type="file" accept="image/*" hidden onChange={e => setBanner(e.target.files[0])} />
          </div>

          <div className={s.field}>
            <label className={s.label}>Title *</label>
            <input className={s.input} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Smart India Hackathon 2026" required />
          </div>

          <div className={s.field}>
            <label className={s.label}>Description</label>
            <textarea className={s.textarea} value={form.description} onChange={e => set('description', e.target.value)} placeholder="What's this hackathon about?" />
          </div>

          <div className={s.formRow}>
            <div className={s.field}>
              <label className={s.label}>Mode</label>
              <select className={s.select} value={form.mode} onChange={e => set('mode', e.target.value)}>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div className={s.field}>
              <label className={s.label}>{showVenue ? 'Venue' : 'Location'}</label>
              <input className={s.input}
                value={showVenue ? form.venue : form.location}
                onChange={e => set(showVenue ? 'venue' : 'location', e.target.value)}
                placeholder={showVenue ? 'Auditorium, Block A…' : 'City / Region'} />
            </div>
          </div>

          {/* Dates */}
          <div className={s.formRow}>
            <div className={s.field}>
              <label className={s.label}>Registration Opens</label>
              <input type="date" className={s.input} value={form.registrationStart} onChange={e => set('registrationStart', e.target.value)} />
            </div>
            <div className={s.field}>
              <label className={s.label}>Registration Deadline</label>
              <input type="date" className={s.input} value={form.registrationDeadline} onChange={e => set('registrationDeadline', e.target.value)} />
            </div>
          </div>
          <div className={s.formRow}>
            <div className={s.field}>
              <label className={s.label}>Hackathon Starts</label>
              <input type="date" className={s.input} value={form.hackathonStart} onChange={e => set('hackathonStart', e.target.value)} />
            </div>
            <div className={s.field}>
              <label className={s.label}>Hackathon Ends</label>
              <input type="date" className={s.input} value={form.hackathonEnd} onChange={e => set('hackathonEnd', e.target.value)} />
            </div>
          </div>

          {/* Team + capacity */}
          <div className={s.formRow}>
            <div className={s.field}>
              <label className={s.label}>Team Size (min – max)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" min="1" className={s.input} value={form.teamSize.min} onChange={e => setTeam('min', e.target.value)} />
                <input type="number" min="1" className={s.input} value={form.teamSize.max} onChange={e => setTeam('max', e.target.value)} />
              </div>
            </div>
            <div className={s.field}>
              <label className={s.label}>Max Participants</label>
              <input type="number" className={s.input} value={form.maxParticipants} onChange={e => set('maxParticipants', e.target.value)} placeholder="Optional" />
            </div>
          </div>

          {/* Themes */}
          <div className={s.field}>
            <label className={s.label}>Themes</label>
            <div className={s.chips}>
              {[...new Set([...PRESET_THEMES, ...form.themes])].map(t => (
                <button type="button" key={t}
                  className={`${s.chip} ${form.themes.includes(t) ? s.chipActive : ''}`}
                  onClick={() => toggleTheme(t)}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <input className={s.input} value={customTheme} placeholder="Add custom theme…"
                onChange={e => setCustomTheme(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTheme(); } }} />
              <button type="button" className={s.btn} onClick={addCustomTheme}><Plus size={15} /></button>
            </div>
          </div>

          {/* Prize pool + prizes */}
          <div className={s.field}>
            <label className={s.label}>Total Prize Pool (₹)</label>
            <input type="number" className={s.input} value={form.prizePool} onChange={e => set('prizePool', e.target.value)} placeholder="e.g. 100000" />
          </div>

          <div className={s.field}>
            <label className={s.label}>Prize Breakdown</label>
            {form.prizes.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input className={s.input} style={{ width: 70 }} type="number" value={p.rank} onChange={e => setPrize(i, 'rank', e.target.value)} placeholder="Rank" />
                <input className={s.input} value={p.title} onChange={e => setPrize(i, 'title', e.target.value)} placeholder="e.g. Winner" />
                <input className={s.input} style={{ width: 130 }} type="number" value={p.amount} onChange={e => setPrize(i, 'amount', e.target.value)} placeholder="Amount" />
                <button type="button" className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} onClick={() => removePrize(i)}><X size={14} /></button>
              </div>
            ))}
            <button type="button" className={`${s.btn} ${s.btnSm}`} onClick={addPrize} style={{ alignSelf: 'flex-start' }}><Plus size={14} /> Add prize</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Link to="/organizer/hackathons" className={s.btn}>Cancel</Link>
            <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
              {saving ? <Loader2 size={16} className={s.spinner} /> : <Save size={16} />} {editing ? 'Save Changes' : 'Create Hackathon'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
