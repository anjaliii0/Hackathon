import { useState } from 'react';
import {
  Plus, Trash2, Edit3, X, Loader2, Paperclip, ExternalLink,
  FileText, Database, Link2, Video, Code,
} from 'lucide-react';
import { organizerService } from '../../../services/services';
import toast from 'react-hot-toast';
import s from '../Organizer.module.css';

const DIFF_BADGE = { easy: s.badgeGreen, medium: s.badgeYellow, hard: s.badgeRed };
const empty = { title: '', description: '', difficulty: 'medium', tags: '' };

const RES_TYPE = {
  pdf:     { icon: FileText, label: 'PDF',     badge: s.badgeRed },
  api:     { icon: Code,     label: 'API',     badge: s.badgeBlue },
  dataset: { icon: Database, label: 'Dataset', badge: s.badgeGreen },
  link:    { icon: Link2,    label: 'Link',    badge: s.badgeGray },
  video:   { icon: Video,    label: 'Video',   badge: s.badgeYellow },
};
const emptyRes = { type: 'link', title: '', url: '', description: '' };

export default function ProblemsTab({ hackathon, hackathonId, reload }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // psId or null
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  // resource modal: which problem statement we're attaching to
  const [resFor, setResFor] = useState(null); // ps object or null
  const [resForm, setResForm] = useState(emptyRes);
  const [resSaving, setResSaving] = useState(false);

  const list = hackathon.problemStatements || [];

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (ps) => {
    setEditing(ps._id);
    setForm({ title: ps.title, description: ps.description || '', difficulty: ps.difficulty || 'medium', tags: (ps.tags || []).join(', ') });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Title required');
    setSaving(true);
    const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
    try {
      if (editing) await organizerService.updateProblem(hackathonId, editing, payload);
      else await organizerService.addProblem(hackathonId, payload);
      toast.success(editing ? 'Updated' : 'Added');
      setOpen(false);
      await reload();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const remove = async (ps) => {
    if (!confirm(`Delete "${ps.title}"?`)) return;
    try { await organizerService.deleteProblem(hackathonId, ps._id); toast.success('Deleted'); await reload(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  // ── resources ──
  const openRes = (ps) => { setResFor(ps); setResForm(emptyRes); };
  const saveRes = async (e) => {
    e.preventDefault();
    if (!resForm.title.trim() || !resForm.url.trim()) return toast.error('Title and URL required');
    setResSaving(true);
    try {
      await organizerService.addProblemResource(hackathonId, resFor._id, resForm);
      toast.success('Resource attached');
      setResFor(null);
      await reload();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setResSaving(false); }
  };
  const removeRes = async (ps, res) => {
    if (!confirm(`Remove "${res.title}"?`)) return;
    try { await organizerService.deleteProblemResource(hackathonId, ps._id, res._id); toast.success('Removed'); await reload(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className={s.cardHead}>
        <h3 className={s.cardTitle}>Problem Statements ({list.length})</h3>
        <button className={`${s.btn} ${s.btnPrimary}`} onClick={openNew}><Plus size={15} /> Add Problem</button>
      </div>

      {list.length === 0 ? (
        <div className={s.empty}><p>No problem statements yet. Add tracks for participants to build on.</p></div>
      ) : list.map(ps => (
        <div key={ps._id} className={s.listRow} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
            <div className={s.listMain}>
              <div className={s.listTitle}>{ps.title}</div>
              {ps.description && <div className={s.listDesc}>{ps.description}</div>}
              <div className={s.listMetaRow}>
                <span className={`${s.badge} ${DIFF_BADGE[ps.difficulty] || s.badgeGray}`}>{ps.difficulty}</span>
                {(ps.tags || []).map(t => <span key={t} className={`${s.badge} ${s.badgeBlue}`}>{t}</span>)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, height: 'fit-content' }}>
              <button className={`${s.btn} ${s.btnSm}`} onClick={() => openRes(ps)}><Paperclip size={14} /> Resource</button>
              <button className={`${s.btn} ${s.btnSm}`} onClick={() => openEdit(ps)}><Edit3 size={14} /></button>
              <button className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} onClick={() => remove(ps)}><Trash2 size={14} /></button>
            </div>
          </div>

          {/* attached resources */}
          {(ps.resources || []).length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ps.resources.map(r => {
                const meta = RES_TYPE[r.type] || RES_TYPE.link;
                const Icon = meta.icon;
                return (
                  <div key={r._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <Icon size={14} style={{ color: 'var(--steel)', flexShrink: 0 }} />
                      <span className={`${s.badge} ${meta.badge}`}>{meta.label}</span>
                      <a href={r.url} target="_blank" rel="noreferrer" className={s.backLink} style={{ margin: 0 }}>
                        {r.title} <ExternalLink size={11} />
                      </a>
                    </div>
                    <button className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} onClick={() => removeRes(ps, r)}><X size={12} /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Problem statement modal */}
      {open && (
        <div className={s.overlay} onClick={() => setOpen(false)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalHead}>
              <h3 className={s.modalTitle}>{editing ? 'Edit' : 'Add'} Problem Statement</h3>
              <button className={s.closeBtn} onClick={() => setOpen(false)}><X size={18} /></button>
            </div>
            <form className={s.form} onSubmit={save}>
              <div className={s.field}>
                <label className={s.label}>Title *</label>
                <input className={s.input} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className={s.field}>
                <label className={s.label}>Description</label>
                <textarea className={s.textarea} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className={s.formRow}>
                <div className={s.field}>
                  <label className={s.label}>Difficulty</label>
                  <select className={s.select} value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </div>
                <div className={s.field}>
                  <label className={s.label}>Tags (comma separated)</label>
                  <input className={s.input} value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="AI, NLP" />
                </div>
              </div>
              <div className={s.modalActions}>
                <button type="button" className={s.btn} onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
                  {saving ? <Loader2 size={15} className={s.spinner} /> : null} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource modal */}
      {resFor && (
        <div className={s.overlay} onClick={() => setResFor(null)}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalHead}>
              <h3 className={s.modalTitle}>Attach Resource — {resFor.title}</h3>
              <button className={s.closeBtn} onClick={() => setResFor(null)}><X size={18} /></button>
            </div>
            <form className={s.form} onSubmit={saveRes}>
              <div className={s.formRow}>
                <div className={s.field}>
                  <label className={s.label}>Type</label>
                  <select className={s.select} value={resForm.type} onChange={e => setResForm(f => ({ ...f, type: e.target.value }))}>
                    {Object.entries(RES_TYPE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className={s.field}>
                  <label className={s.label}>Title *</label>
                  <input className={s.input} value={resForm.title} onChange={e => setResForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
              </div>
              <div className={s.field}>
                <label className={s.label}>URL *</label>
                <input className={s.input} value={resForm.url} onChange={e => setResForm(f => ({ ...f, url: e.target.value }))} placeholder="https://…" required />
              </div>
              <div className={s.field}>
                <label className={s.label}>Description</label>
                <textarea className={s.textarea} value={resForm.description} onChange={e => setResForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className={s.modalActions}>
                <button type="button" className={s.btn} onClick={() => setResFor(null)}>Cancel</button>
                <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={resSaving}>
                  {resSaving ? <Loader2 size={15} className={s.spinner} /> : null} Attach
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
