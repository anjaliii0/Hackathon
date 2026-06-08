import { useState, useEffect, useCallback } from 'react';
import { Loader2, Megaphone, Trash2, Plus, X, Pin, Mail } from 'lucide-react';
import { organizerService } from '../../../services/services';
import toast from 'react-hot-toast';
import EmailModal from './EmailModal';
import s from '../Organizer.module.css';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'event_update', label: 'Event Update' },
  { value: 'rule_change', label: 'Rule Change' },
  { value: 'schedule_change', label: 'Schedule Change' },
];
const CAT_BADGE = {
  general: s.badgeGray, event_update: s.badgeBlue, rule_change: s.badgeYellow, schedule_change: s.badgeRed,
};
const empty = { title: '', message: '', category: 'general', pinned: false };

export default function AnnouncementsTab({ hackathonId }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [emailAll, setEmailAll] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    organizerService.getAnnouncements(hackathonId)
      .then(res => setList(res.data.data || []))
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  }, [hackathonId]);
  useEffect(load, [load]);

  const post = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return toast.error('Title and message required');
    setSaving(true);
    try {
      await organizerService.createAnnouncement(hackathonId, form);
      toast.success('Announcement posted — participants notified');
      setOpen(false); setForm(empty);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const remove = async (ann) => {
    if (!confirm('Delete this announcement?')) return;
    try { await organizerService.deleteAnnouncement(hackathonId, ann._id); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className={s.cardHead}>
        <h3 className={s.cardTitle}>Announcements ({list.length})</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={s.btn} onClick={() => setEmailAll(true)}><Mail size={15} /> Email Everyone</button>
          <button className={`${s.btn} ${s.btnPrimary}`} onClick={() => setOpen(true)}><Plus size={15} /> New Announcement</button>
        </div>
      </div>

      {loading ? (
        <div className={s.loading}><Loader2 size={24} className={s.spinner} /></div>
      ) : list.length === 0 ? (
        <div className={s.empty}><Megaphone size={36} style={{ opacity: 0.25 }} /><p>No announcements yet.</p></div>
      ) : list.map(ann => (
        <div key={ann._id} className={s.listRow}>
          <div className={s.listMain}>
            <div className={s.listTitle}>
              {ann.pinned && <Pin size={13} style={{ display: 'inline', marginRight: 5, color: 'var(--warning)' }} />}
              {ann.title}
            </div>
            <div className={s.listDesc}>{ann.message}</div>
            <div className={s.listMetaRow}>
              <span className={`${s.badge} ${CAT_BADGE[ann.category]}`}>{ann.category.replace(/_/g, ' ')}</span>
              <span className={s.hint}>{new Date(ann.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <button className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} onClick={() => remove(ann)}><Trash2 size={14} /></button>
        </div>
      ))}

      {open && (
        <div className={s.overlay} onClick={() => setOpen(false)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalHead}>
              <h3 className={s.modalTitle}>New Announcement</h3>
              <button className={s.closeBtn} onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <form className={s.form} onSubmit={post}>
              <div className={s.field}>
                <label className={s.label}>Title</label>
                <input className={s.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className={s.field}>
                <label className={s.label}>Message</label>
                <textarea className={s.textarea} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
              </div>
              <div className={s.formRow}>
                <div className={s.field}>
                  <label className={s.label}>Category</label>
                  <select className={s.select} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className={s.field}>
                  <label className={s.label}>Pin to top</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', paddingTop: 8 }}>
                    <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} />
                    Pinned
                  </label>
                </div>
              </div>
              <div className={s.modalActions}>
                <button type="button" className={s.btn} onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? <Loader2 size={15} className={s.spinner} /> : null} Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {emailAll && (
        <EmailModal hackathonId={hackathonId} target="all" label="all participants" onClose={() => setEmailAll(false)} />
      )}
    </div>
  );
}
