import { useState, useEffect, useRef } from 'react';
import { Loader2, Camera, Save, Building2, Globe, Mail, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { organizerService } from '../../services/services';
import toast from 'react-hot-toast';
import s from './Organizer.module.css';

const SOCIALS = ['linkedin', 'twitter', 'instagram', 'facebook', 'github'];

export default function OrgProfile() {
  const { isCollege } = useAuth();
  const nameKey = isCollege ? 'collegeName' : 'companyName';

  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const logoRef = useRef();
  const coverRef = useRef();

  const load = () => {
    organizerService.getProfile()
      .then(res => {
        const p = res.data.data;
        setProfile(p);
        setForm({
          [nameKey]: p[nameKey] || '',
          [isCollege ? 'establishedYear' : 'industry']: p[isCollege ? 'establishedYear' : 'industry'] || '',
          location: p.location || '',
          website: p.website || '',
          description: p.description || '',
          contactEmail: p.contactEmail || '',
          contactPhone: p.contactPhone || '',
          socialLinks: { ...(p.socialLinks || {}) },
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  };
  useEffect(load, [isCollege, nameKey]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSocial = (k, v) => setForm(f => ({ ...f, socialLinks: { ...f.socialLinks, [k]: v } }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await organizerService.updateProfile(form);
      setProfile(res.data.data);
      toast.success('Profile saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const upload = async (file, kind) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    const fn = kind === 'logo' ? organizerService.uploadLogo : organizerService.uploadCover;
    try {
      await toast.promise(fn(fd), {
        loading: `Uploading ${kind}…`,
        success: `${kind === 'logo' ? 'Logo' : 'Cover'} updated`,
        error: 'Upload failed',
      });
      load();
    } catch { /* toast handled */ }
  };

  if (loading || !form) return <div className={s.page}><div className={s.loading}><Loader2 size={28} className={s.spinner} /> Loading…</div></div>;

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Organization Profile</h1>
          <p className={s.subtitle}>How participants see you across the platform</p>
        </div>
      </div>

      {/* Cover + logo */}
      <div className={s.coverArea}>
        {profile?.coverImage && <img src={profile.coverImage} alt="cover" className={s.coverImg} />}
        <button className={`${s.uploadBtn} ${s.coverUpload}`} onClick={() => coverRef.current.click()}>
          <Camera size={14} /> Cover
        </button>
        <input ref={coverRef} type="file" accept="image/*" hidden onChange={e => upload(e.target.files[0], 'cover')} />
        <div className={s.logoArea} onClick={() => logoRef.current.click()} style={{ cursor: 'pointer' }}>
          {profile?.logo
            ? <img src={profile.logo} alt="logo" className={s.logoImg} />
            : <span className={s.logoFallback}>{form[nameKey]?.charAt(0) || <Building2 />}</span>}
        </div>
        <input ref={logoRef} type="file" accept="image/*" hidden onChange={e => upload(e.target.files[0], 'logo')} />
      </div>

      <form className={s.card} onSubmit={save}>
        <div className={s.form}>
          <div className={s.formRow}>
            <div className={s.field}>
              <label className={s.label}>{isCollege ? 'College Name' : 'Company Name'}</label>
              <input className={s.input} value={form[nameKey]} onChange={e => set(nameKey, e.target.value)} required />
            </div>
            <div className={s.field}>
              <label className={s.label}>{isCollege ? 'Established Year' : 'Industry'}</label>
              <input className={s.input}
                value={form[isCollege ? 'establishedYear' : 'industry']}
                onChange={e => set(isCollege ? 'establishedYear' : 'industry', e.target.value)}
                placeholder={isCollege ? 'e.g. 1998' : 'e.g. FinTech'} />
            </div>
          </div>

          <div className={s.field}>
            <label className={s.label}>Description</label>
            <textarea className={s.textarea} value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Tell participants about your organization…" />
          </div>

          <div className={s.formRow}>
            <div className={s.field}>
              <label className={s.label}><Globe size={13} style={{ display: 'inline', marginRight: 4 }} />Website</label>
              <input className={s.input} value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://…" />
            </div>
            <div className={s.field}>
              <label className={s.label}>Location</label>
              <input className={s.input} value={form.location} onChange={e => set('location', e.target.value)} placeholder="City, Country" />
            </div>
          </div>

          <div className={s.formRow}>
            <div className={s.field}>
              <label className={s.label}><Mail size={13} style={{ display: 'inline', marginRight: 4 }} />Contact Email</label>
              <input className={s.input} type="email" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
            </div>
            <div className={s.field}>
              <label className={s.label}><Phone size={13} style={{ display: 'inline', marginRight: 4 }} />Contact Phone</label>
              <input className={s.input} value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="+91 …" />
            </div>
          </div>

          <div>
            <label className={s.label} style={{ marginBottom: 10, display: 'block' }}>Social Links</label>
            <div className={s.grid2}>
              {SOCIALS.map(k => (
                <div className={s.field} key={k}>
                  <label className={s.hint} style={{ textTransform: 'capitalize' }}>{k}</label>
                  <input className={s.input} value={form.socialLinks[k] || ''}
                    onChange={e => setSocial(k, e.target.value)} placeholder={`${k}.com/your-handle`} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
              {saving ? <Loader2 size={16} className={s.spinner} /> : <Save size={16} />} Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
