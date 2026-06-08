import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, FileText, Code, Video, ExternalLink, Star, X, Send, Presentation,
  FileSpreadsheet, Archive, Bell, Download,
} from 'lucide-react';
import JSZip from 'jszip';
import { orgDataService, organizerService } from '../../../services/services';
import toast from 'react-hot-toast';
import s from '../Organizer.module.css';

// Force-download a Cloudinary file with its original name
const downloadUrl = (url) => (url && url.includes('/upload/') ? url.replace('/upload/', '/upload/fl_attachment/') : url);

const STATUS_BADGE = {
  submitted: s.badgeGray, under_review: s.badgeYellow, reviewed: s.badgeGreen, shortlisted: s.badgeBlue,
};

export default function SubmissionsTab({ hackathonId }) {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    orgDataService.getSubmissions(hackathonId)
      .then(res => setSubs(res.data.data.submissions || []))
      .catch(() => toast.error('Failed to load submissions'))
      .finally(() => setLoading(false));
  }, [hackathonId]);
  useEffect(load, [load]);

  const [busy, setBusy] = useState(false);

  const downloadReports = async () => {
    try {
      const res = await organizerService.exportSubmissions(hackathonId);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.ms-excel' }));
      const a = document.createElement('a');
      a.href = url; a.download = 'submissions_report.xls';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch { toast.error('Report failed'); }
  };

  // Bundle a per-team folder of details + a combined CSV into one ZIP (text only → no CORS)
  const downloadZip = async () => {
    if (!subs.length) return toast.error('No submissions to bundle');
    setBusy(true);
    try {
      const zip = new JSZip();
      const esc = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
      const header = ['Team', 'Project', 'Status', 'Score', 'Bonus', 'Total', 'GitHub', 'PPT', 'Video', 'Demo', 'Submitted'];
      const csvRows = [header.map(esc).join(',')];

      subs.forEach((sub) => {
        const total = (sub.score ?? 0) + (sub.bonusPoints ?? 0);
        csvRows.push([
          sub.team?.name, sub.title, sub.status, sub.score ?? 0, sub.bonusPoints ?? 0, total,
          sub.githubUrl, sub.pptUrl || sub.presentation, sub.videoUrl, sub.demoUrl,
          sub.submittedAt ? new Date(sub.submittedAt).toISOString() : '',
        ].map(esc).join(','));

        const folder = (sub.team?.name || 'team').replace(/[^a-z0-9]+/gi, '_');
        const details =
`PROJECT: ${sub.title || ''}
TEAM: ${sub.team?.name || ''}
MEMBERS: ${(sub.team?.members || []).map((m) => m.name).join(', ')}
STATUS: ${sub.status || 'submitted'}
SUBMITTED: ${sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : ''}
SCORE: ${sub.score ?? 0}  BONUS: ${sub.bonusPoints ?? 0}  TOTAL: ${total}

DESCRIPTION:
${sub.description || '—'}

LINKS:
  GitHub: ${sub.githubUrl || '—'}
  PPT/Slides: ${sub.pptUrl || sub.presentation || '—'}
  Video Demo: ${sub.videoUrl || '—'}
  Live Demo: ${sub.demoUrl || '—'}

JUDGE COMMENTS:
  Feedback: ${sub.judgeComments?.feedback || sub.feedback || '—'}
  Suggestions: ${sub.judgeComments?.suggestions || '—'}
  Improvement Areas: ${sub.judgeComments?.improvementAreas || '—'}
`;
        zip.folder(folder).file('details.txt', details);
      });

      zip.file('submissions_report.csv', csvRows.join('\n'));
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'submissions.zip';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      toast.success('ZIP downloaded');
    } catch { toast.error('ZIP failed'); }
    finally { setBusy(false); }
  };

  const sendReminder = async () => {
    if (!confirm('Send a submission reminder to all teams that haven\'t submitted yet?')) return;
    try {
      const res = await organizerService.remindSubmissions(hackathonId);
      toast.success(res.data.message || 'Reminder sent');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <div className={s.cardHead}>
        <h3 className={s.cardTitle}>Submissions ({subs.length})</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={s.btn} onClick={sendReminder}><Bell size={15} /> Remind</button>
          <button className={s.btn} onClick={downloadReports}><FileSpreadsheet size={15} /> Reports</button>
          <button className={s.btn} onClick={downloadZip} disabled={busy}>
            {busy ? <Loader2 size={15} className={s.spinner} /> : <Archive size={15} />} ZIP
          </button>
        </div>
      </div>

      {loading ? (
        <div className={s.loading}><Loader2 size={24} className={s.spinner} /></div>
      ) : subs.length === 0 ? (
        <div className={s.empty}><FileText size={36} style={{ opacity: 0.25 }} /><p>No submissions yet.</p></div>
      ) : (
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr><th>Project</th><th>Team</th><th>Submitted</th><th>Links</th><th>Score</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {subs.map(sub => (
              <tr key={sub._id}>
                <td><strong style={{ color: 'var(--navy)' }}>{sub.title}</strong>{sub.isLate && <span className={`${s.badge} ${s.badgeRed}`} style={{ marginLeft: 6 }}>Late</span>}</td>
                <td>{sub.team?.name || '—'}<div className={s.hint}>{sub.team?.members?.length || 0} member(s)</div></td>
                <td className={s.hint}>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {sub.githubUrl && <a href={sub.githubUrl} target="_blank" rel="noreferrer" title="GitHub repository"><Code size={15} /></a>}
                    {(sub.pptUrl || sub.presentation) && <a href={sub.pptUrl || sub.presentation} target="_blank" rel="noreferrer" title="View slides"><Presentation size={15} /></a>}
                    {(sub.pptUrl || sub.presentation) && <a href={downloadUrl(sub.pptUrl || sub.presentation)} title="Download PPT"><Download size={15} /></a>}
                    {sub.videoUrl && <a href={sub.videoUrl} target="_blank" rel="noreferrer" title="Video demo"><Video size={15} /></a>}
                    {sub.demoUrl && <a href={sub.demoUrl} target="_blank" rel="noreferrer" title="Live demo"><ExternalLink size={15} /></a>}
                    {!(sub.githubUrl || sub.pptUrl || sub.presentation || sub.videoUrl || sub.demoUrl) && <span className={s.hint}>—</span>}
                  </div>
                </td>
                <td><strong>{(sub.score ?? 0) + (sub.bonusPoints ?? 0)}</strong>{sub.bonusPoints ? <span className={s.hint}> (+{sub.bonusPoints})</span> : null}</td>
                <td><span className={`${s.badge} ${STATUS_BADGE[sub.status] || s.badgeGray}`}>{(sub.status || 'submitted').replace(/_/g, ' ')}</span></td>
                <td><button className={`${s.btn} ${s.btnSm} ${s.btnPrimary}`} onClick={() => setReview(sub)}><Star size={13} /> Review</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {review && <ReviewModal hackathonId={hackathonId} submission={review} onClose={() => setReview(null)} onSaved={() => { setReview(null); load(); }} />}
    </div>
  );
}

function ReviewModal({ hackathonId, submission, onClose, onSaved }) {
  const [form, setForm] = useState({
    score: submission.score ?? '',
    bonusPoints: submission.bonusPoints ?? 0,
    status: submission.status || 'reviewed',
    feedback: submission.judgeComments?.feedback || submission.feedback || '',
    suggestions: submission.judgeComments?.suggestions || '',
    improvementAreas: submission.judgeComments?.improvementAreas || '',
  });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await organizerService.reviewSubmission(hackathonId, submission._id, {
        score: form.score === '' ? undefined : Number(form.score),
        bonusPoints: Number(form.bonusPoints) || 0,
        status: form.status,
        judgeComments: {
          feedback: form.feedback,
          suggestions: form.suggestions,
          improvementAreas: form.improvementAreas,
        },
      });
      toast.success('Review saved');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalHead}>
          <h3 className={s.modalTitle}>Review: {submission.title}</h3>
          <button className={s.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <form className={s.form} onSubmit={save}>
          <div className={s.formRow}>
            <div className={s.field}>
              <label className={s.label}>Score (0–100)</label>
              <input type="number" min="0" max="100" className={s.input} value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))} />
            </div>
            <div className={s.field}>
              <label className={s.label}>Bonus Points</label>
              <input type="number" className={s.input} value={form.bonusPoints} onChange={e => setForm(f => ({ ...f, bonusPoints: e.target.value }))} />
            </div>
          </div>
          <div className={s.field}>
            <label className={s.label}>Status</label>
            <select className={s.select} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under review</option>
              <option value="reviewed">Reviewed</option>
              <option value="shortlisted">Shortlisted</option>
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label}>Feedback</label>
            <textarea className={s.textarea} value={form.feedback} onChange={e => setForm(f => ({ ...f, feedback: e.target.value }))} placeholder="Overall feedback…" />
          </div>
          <div className={s.field}>
            <label className={s.label}>Suggestions</label>
            <textarea className={s.textarea} value={form.suggestions} onChange={e => setForm(f => ({ ...f, suggestions: e.target.value }))} placeholder="What could make this stronger…" />
          </div>
          <div className={s.field}>
            <label className={s.label}>Improvement Areas</label>
            <textarea className={s.textarea} value={form.improvementAreas} onChange={e => setForm(f => ({ ...f, improvementAreas: e.target.value }))} />
          </div>
          <div className={s.modalActions}>
            <button type="button" className={s.btn} onClick={onClose}>Cancel</button>
            <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
              {saving ? <Loader2 size={15} className={s.spinner} /> : <Send size={15} />} Save Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
