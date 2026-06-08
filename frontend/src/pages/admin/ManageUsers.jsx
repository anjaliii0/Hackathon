import { useState, useEffect, useCallback } from 'react';
import {
  Search, Loader2, Ban, RotateCcw, Trash2, Eye, X, ShieldAlert, GraduationCap, Building2, Briefcase, Users,
} from 'lucide-react';
import { adminService } from '../../services/services';
import toast from 'react-hot-toast';
import s from './Admin.module.css';

const TABS = [
  { key: 'student', label: 'Students', icon: GraduationCap },
  { key: 'college', label: 'Colleges', icon: Building2 },
  { key: 'company', label: 'Companies', icon: Briefcase },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtActive = (d) => {
  if (!d) return 'Never';
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function ManageUsers() {
  const [role, setRole] = useState('student');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(null);     // user being viewed
  const [suspendFor, setSuspendFor] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    adminService.getUsers({ role, search: search || undefined, limit: 100 })
      .then(res => setRows(res.data.data.users || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [role, search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const reinstate = async (u) => {
    try { await adminService.reinstateUser(u._id); toast.success('Reinstated'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const remove = async (u) => {
    if (!confirm(`Permanently delete ${u.name}? This removes their account and profile.`)) return;
    try { await adminService.deleteUser(u._id); toast.success('User deleted'); setRows(prev => prev.filter(x => x._id !== u._id)); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const openView = async (u) => {
    try {
      const res = await adminService.getUser(u._id);
      setView(res.data.data);
    } catch { toast.error('Failed to load details'); }
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}><Users size={26} style={{ color: 'var(--steel)' }} /> User Management</h1>
          <p className={s.subtitle}>Manage students, colleges and companies</p>
        </div>
      </div>

      <div className={s.tabs}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} className={`${s.tab} ${role === key ? s.tabActive : ''}`} onClick={() => setRole(key)}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className={s.toolbar}>
        <div className={s.searchWrap}>
          <Search size={16} className={s.searchIcon} />
          <input className={s.searchInput} placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className={s.loading}><Loader2 size={24} className={s.spinner} /></div>
      ) : rows.length === 0 ? (
        <div className={s.empty}><Users size={36} style={{ opacity: 0.25 }} /><p>No {role}s found.</p></div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Status</th><th>Last Active</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className={s.userCell}>
                      <div className={s.avatar}>{u.name?.charAt(0).toUpperCase()}</div>
                      <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{u.name}</span>
                    </div>
                  </td>
                  <td className={s.listSub}>{u.email}{!u.isVerified && <span className={`${s.badge} ${s.badgeYellow}`} style={{ marginLeft: 6 }}>unverified</span>}</td>
                  <td>{u.isBanned ? <span className={`${s.badge} ${s.badgeRed}`}>Suspended</span> : <span className={`${s.badge} ${s.badgeGreen}`}>Active</span>}</td>
                  <td className={s.listSub}>{fmtActive(u.lastActive)}</td>
                  <td className={s.listSub}>{fmtDate(u.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className={`${s.btn} ${s.btnSm}`} title="View" onClick={() => openView(u)}><Eye size={13} /></button>
                      {u.isBanned
                        ? <button className={`${s.btn} ${s.btnSm} ${s.btnSuccess}`} title="Reinstate" onClick={() => reinstate(u)}><RotateCcw size={13} /></button>
                        : <button className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} title="Suspend" onClick={() => setSuspendFor(u)}><Ban size={13} /></button>}
                      <button className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} title="Delete" onClick={() => remove(u)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {suspendFor && <SuspendModal user={suspendFor} onClose={() => setSuspendFor(null)} onDone={() => { setSuspendFor(null); load(); }} />}
      {view && <ViewModal data={view} onClose={() => setView(null)} />}
    </div>
  );
}

function SuspendModal({ user, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminService.suspendUser(user._id, reason || undefined);
      toast.success(`${user.name} suspended`);
      onDone();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };
  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalHead}>
          <h3 className={s.modalTitle}><ShieldAlert size={18} style={{ display: 'inline', marginRight: 6, color: 'var(--danger)' }} />Suspend {user.name}</h3>
          <button className={s.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <form className={s.form} onSubmit={submit}>
          <div className={s.field}>
            <label className={s.label}>Reason (shown to the user)</label>
            <textarea className={s.textarea} style={{ minHeight: 90 }} value={reason} onChange={e => setReason(e.target.value)}
              placeholder="e.g. Repeated violation of community guidelines" />
          </div>
          <div className={s.modalActions}>
            <button type="button" className={s.btn} onClick={onClose}>Cancel</button>
            <button type="submit" className={`${s.btn} ${s.btnDanger}`} disabled={saving}>
              {saving ? <Loader2 size={15} className={s.spinner} /> : <Ban size={15} />} Suspend
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewModal({ data, onClose }) {
  const { user, profile } = data;
  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalHead}>
          <h3 className={s.modalTitle}>{user.name}</h3>
          <button className={s.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <div className={s.detailRow}><span className={s.detailLabel}>Email</span><span className={s.detailVal}>{user.email}</span></div>
        <div className={s.detailRow}><span className={s.detailLabel}>Role</span><span className={s.detailVal} style={{ textTransform: 'capitalize' }}>{user.role}</span></div>
        <div className={s.detailRow}><span className={s.detailLabel}>Verified</span><span className={s.detailVal}>{user.isVerified ? 'Yes' : 'No'}</span></div>
        <div className={s.detailRow}><span className={s.detailLabel}>Status</span><span className={s.detailVal}>{user.isBanned ? 'Suspended' : 'Active'}</span></div>
        {user.suspendedReason && <div className={s.detailRow}><span className={s.detailLabel}>Suspend reason</span><span className={s.detailVal}>{user.suspendedReason}</span></div>}
        <div className={s.detailRow}><span className={s.detailLabel}>Joined</span><span className={s.detailVal}>{fmtDate(user.createdAt)}</span></div>
        <div className={s.detailRow}><span className={s.detailLabel}>Last active</span><span className={s.detailVal}>{fmtActive(user.lastActive)}</span></div>

        {profile && (
          <>
            <h4 style={{ margin: '18px 0 8px', fontFamily: 'var(--font-display)', color: 'var(--navy)' }}>Profile</h4>
            {user.role === 'student' && <>
              {profile.college && <div className={s.detailRow}><span className={s.detailLabel}>College</span><span className={s.detailVal}>{profile.college}</span></div>}
              {profile.branch && <div className={s.detailRow}><span className={s.detailLabel}>Branch</span><span className={s.detailVal}>{profile.branch}</span></div>}
              {profile.skills?.length > 0 && <div className={s.detailRow}><span className={s.detailLabel}>Skills</span><span className={s.detailVal}>{profile.skills.join(', ')}</span></div>}
            </>}
            {user.role === 'college' && <>
              {profile.collegeName && <div className={s.detailRow}><span className={s.detailLabel}>College</span><span className={s.detailVal}>{profile.collegeName}</span></div>}
              <div className={s.detailRow}><span className={s.detailLabel}>Approved</span><span className={s.detailVal}>{profile.isApproved ? 'Yes' : 'No'}</span></div>
            </>}
            {user.role === 'company' && <>
              {profile.companyName && <div className={s.detailRow}><span className={s.detailLabel}>Company</span><span className={s.detailVal}>{profile.companyName}</span></div>}
              <div className={s.detailRow}><span className={s.detailLabel}>Approved</span><span className={s.detailVal}>{profile.isApproved ? 'Yes' : 'No'}</span></div>
            </>}
          </>
        )}
        <div className={s.modalActions}>
          <button className={`${s.btn} ${s.btnPrimary}`} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
