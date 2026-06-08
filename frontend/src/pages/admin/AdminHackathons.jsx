import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Trophy, Check, X, Star, Trash2, Filter,
} from 'lucide-react';
import { adminService } from '../../services/services';
import toast from 'react-hot-toast';
import s from './Admin.module.css';

const STATUS_BADGE = {
  draft: s.badgeGray, pending_approval: s.badgeYellow, open: s.badgeGreen,
  ongoing: s.badgeBlue, judging: s.badgeYellow, completed: s.badgeGray,
};
const FILTERS = [
  { key: 'pending', label: 'Pending', params: { status: 'pending_approval' } },
  { key: 'all', label: 'All', params: {} },
  { key: 'live', label: 'Live', params: { status: 'open' } },
  { key: 'featured', label: 'Featured', params: {} }, // filtered client-side
];

export default function AdminHackathons() {
  const [filter, setFilter] = useState('pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const def = FILTERS.find(f => f.key === filter);
    adminService.getHackathons({ ...def.params, limit: 100 })
      .then(res => {
        let list = res.data.data.hackathons || [];
        if (filter === 'featured') list = list.filter(h => h.isFeatured);
        setRows(list);
      })
      .catch(() => toast.error('Failed to load hackathons'))
      .finally(() => setLoading(false));
  }, [filter]);
  useEffect(load, [load]);

  const review = async (h, action) => {
    setBusy(h._id);
    try {
      await adminService.reviewHackathon(h._id, action);
      toast.success(action === 'approve' ? 'Approved & live' : 'Rejected');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setBusy(null); }
  };

  const toggleFeature = async (h) => {
    try {
      const res = await adminService.featureHackathon(h._id, !h.isFeatured);
      toast.success(res.data.message);
      setRows(prev => prev.map(x => x._id === h._id ? { ...x, isFeatured: res.data.data.isFeatured } : x));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const remove = async (h) => {
    if (!confirm(`Delete "${h.title}" and all its data (teams, submissions)?`)) return;
    try { await adminService.deleteHackathon(h._id); toast.success('Deleted'); setRows(prev => prev.filter(x => x._id !== h._id)); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}><Trophy size={26} style={{ color: 'var(--steel)' }} /> Hackathon Management</h1>
          <p className={s.subtitle}>Approve, feature and moderate hackathons</p>
        </div>
      </div>

      <div className={s.tabs}>
        {FILTERS.map(f => (
          <button key={f.key} className={`${s.tab} ${filter === f.key ? s.tabActive : ''}`} onClick={() => setFilter(f.key)}>
            <Filter size={14} /> {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={s.loading}><Loader2 size={24} className={s.spinner} /></div>
      ) : rows.length === 0 ? (
        <div className={s.empty}><Trophy size={36} style={{ opacity: 0.25 }} /><p>No hackathons here.</p></div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr><th>Title</th><th>Organizer</th><th>Status</th><th>Featured</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map(h => (
                <tr key={h._id}>
                  <td><strong style={{ color: 'var(--navy)' }}>{h.title}</strong><div className={s.listSub}>{h.mode} · {new Date(h.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div></td>
                  <td className={s.listSub}>{h.organizer?.name || '—'}<div>{h.organizer?.role}</div></td>
                  <td><span className={`${s.badge} ${STATUS_BADGE[h.status] || s.badgeGray}`}>{h.status?.replace(/_/g, ' ')}</span></td>
                  <td>{h.isFeatured ? <span className={`${s.badge} ${s.badgeBlue}`}>Featured</span> : <span className={s.listSub}>—</span>}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {h.status === 'pending_approval' && (
                        <>
                          <button className={`${s.btn} ${s.btnSm} ${s.btnSuccess}`} disabled={busy === h._id} title="Approve" onClick={() => review(h, 'approve')}>
                            {busy === h._id ? <Loader2 size={13} className={s.spinner} /> : <Check size={13} />}
                          </button>
                          <button className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} disabled={busy === h._id} title="Reject" onClick={() => review(h, 'reject')}><X size={13} /></button>
                        </>
                      )}
                      <button className={`${s.btn} ${s.btnSm} ${h.isFeatured ? s.btnPrimary : ''}`} title="Toggle featured" onClick={() => toggleFeature(h)}>
                        <Star size={13} />
                      </button>
                      <button className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} title="Delete" onClick={() => remove(h)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
