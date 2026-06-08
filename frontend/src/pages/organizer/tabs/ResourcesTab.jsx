import { useState } from 'react';
import { Plus, Trash2, X, Loader2, FileText, Database, Link2, Video, Code, ExternalLink } from 'lucide-react';
import { organizerService } from '../../../services/services';
import toast from 'react-hot-toast';
import s from '../Organizer.module.css';

const TYPE_META = {
  pdf:     { icon: FileText, label: 'PDF',     badge: s.badgeRed },
  api:     { icon: Code,     label: 'API',     badge: s.badgeBlue },
  dataset: { icon: Database, label: 'Dataset', badge: s.badgeGreen },
  link:    { icon: Link2,    label: 'Link',    badge: s.badgeGray },
  video:   { icon: Video,    label: 'Video',   badge: s.badgeYellow },
};
const empty = { type: 'link', title: '', url: '', description: '' };

export default function ResourcesTab({ hackathon, hackathonId, reload }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const list = hackathon.resources || [];

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) return toast.error('Title and URL required');
    setSaving(true);
    try {
      await organizerService.addResource(hackathonId, form);
      toast.success('Resource added');
      setOpen(false); setForm(empty);
      await reload();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const remove = async (r) => {
    if (!confirm(`Remove "${r.title}"?`)) return;
    try { await organizerService.deleteResource(hackathonId, r._id); toast.success('Removed'); await reload(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className={s.cardHead}>
        <h3 className={s.cardTitle}>Resources ({list.length})</h3>
        <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => setOpen(true)}><Plus size={15} /> Add Resource</button>
      </div>

      {list.length === 0 ? (
        <div className={s.empty}><p>No resources shared yet. Add PDFs, APIs, datasets, videos or links.</p></div>
      ) : list.map(r => {
        const meta = TYPE_META[r.type] || TYPE_META.link;
        const Icon = meta.icon;
        return (
          <div key={r._id} className={s.listRow}>
            <div className={s.listMain}>
              <div className={s.listTitle} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={16} style={{ color: 'var(--steel)' }} /> {r.title}
                <span className={`${s.badge} ${meta.badge}`}>{meta.label}</span>
              </div>
              {r.description && <div className={s.listDesc}>{r.description}</div>}
              <a href={r.url} target="_blank" rel="noreferrer" className={s.backLink} style={{ marginTop: 6 }}>
                {r.url} <ExternalLink size={12} />
              </a>
            </div>
            <button className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} onClick={() => remove(r)}><Trash2 size={14} /></button>
          </div>
        );
      })}

      {open && (
        <div className={s.overlay} onClick={() => setOpen(false)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalHead}>
              <h3 className={s.modalTitle}>Add Resource</h3>
              <button className={s.closeBtn} onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <form className={s.form} onSubmit={save}>
              <div className={s.formRow}>
                <div className={s.field}>
                  <label className={s.label}>Type</label>
                  <select className={s.select} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className={s.field}>
                  <label className={s.label}>Title *</label>
                  <input className={s.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
              </div>
              <div className={s.field}>
                <label className={s.label}>URL *</label>
                <input className={s.input} value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://…" required />
              </div>
              <div className={s.field}>
                <label className={s.label}>Description</label>
                <textarea className={s.textarea} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className={s.modalActions}>
                <button type="button" className={s.btn} onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? <Loader2 size={15} className={s.spinner} /> : null} Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
