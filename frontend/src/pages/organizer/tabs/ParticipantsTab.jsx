import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, FileDown, FileText, Mail, Check, Star, Ban, FileSpreadsheet, Download } from 'lucide-react';
import { organizerService } from '../../../services/services';
import toast from 'react-hot-toast';
import EmailModal from './EmailModal';
import s from '../Organizer.module.css';

const STATUS_BADGE = {
  registered: s.badgeGray, approved: s.badgeGreen, shortlisted: s.badgeBlue, rejected: s.badgeRed,
};
const STATUS_FILTERS = ['', 'registered', 'approved', 'shortlisted', 'rejected'];

export default function ParticipantsTab({ hackathonId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [emailTo, setEmailTo] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    organizerService.getParticipants(hackathonId, { search: search || undefined, status: status || undefined })
      .then(res => setRows(res.data.data.participants || []))
      .catch(() => toast.error('Failed to load participants'))
      .finally(() => setLoading(false));
  }, [hackathonId, search, status]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  const setStatusFor = async (regId, newStatus) => {
    try {
      await organizerService.setParticipantStatus(hackathonId, regId, newStatus);
      toast.success(`Marked ${newStatus}`);
      setRows(prev => prev.map(r => r._id === regId ? { ...r, status: newStatus } : r));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const saveBlob = (data, filename, type) => {
    const url = URL.createObjectURL(new Blob([data], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const exportCsv = async () => {
    try {
      const res = await organizerService.exportParticipants(hackathonId);
      saveBlob(res.data, 'participants.csv', 'text/csv');
      toast.success('CSV downloaded');
    } catch { toast.error('Export failed'); }
  };

  const exportExcel = async () => {
    try {
      const res = await organizerService.exportParticipantsExcel(hackathonId);
      saveBlob(res.data, 'participants.xls', 'application/vnd.ms-excel');
      toast.success('Excel downloaded');
    } catch { toast.error('Export failed'); }
  };

  // Force-download a Cloudinary file with its original name
  const downloadUrl = (url) => (url.includes('/upload/') ? url.replace('/upload/', '/upload/fl_attachment/') : url);

  return (
    <div>
      <div className={s.toolbar}>
        <div className={s.searchWrap}>
          <Search size={16} className={s.searchIcon} />
          <input className={s.searchInput} placeholder="Search name, email, college, skills…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className={s.select} style={{ width: 150 }} value={status} onChange={e => setStatus(e.target.value)}>
          {STATUS_FILTERS.map(f => <option key={f} value={f}>{f ? f[0].toUpperCase() + f.slice(1) : 'All statuses'}</option>)}
        </select>
        <button className={s.btn} onClick={exportCsv}><FileDown size={15} /> CSV</button>
        <button className={s.btn} onClick={exportExcel}><FileSpreadsheet size={15} /> Excel</button>
      </div>

      {loading ? (
        <div className={s.loading}><Loader2 size={24} className={s.spinner} /></div>
      ) : rows.length === 0 ? (
        <div className={s.empty}><p>No participants found.</p></div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Name</th><th>College / Branch</th><th>Skills</th><th>Status</th><th>Resume</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r._id}>
                  <td>
                    <strong style={{ color: 'var(--navy)' }}>{r.student?.name || '—'}</strong>
                    <div className={s.hint}>{r.student?.email}</div>
                  </td>
                  <td>
                    {r.profile?.college || '—'}
                    <div className={s.hint}>{r.profile?.branch}{r.profile?.year ? ` · ${r.profile.year}` : ''}</div>
                  </td>
                  <td>
                    <div className={s.chips}>
                      {(r.profile?.skills || []).slice(0, 3).map(sk => <span key={sk} className={`${s.badge} ${s.badgeBlue}`}>{sk}</span>)}
                      {!r.profile?.skills?.length && <span className={s.hint}>—</span>}
                    </div>
                  </td>
                  <td><span className={`${s.badge} ${STATUS_BADGE[r.status]}`}>{r.status}</span></td>
                  <td>
                    {r.profile?.resume ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <a href={r.profile.resume} target="_blank" rel="noreferrer" className={s.backLink} style={{ margin: 0 }}><FileText size={13} /> View</a>
                        <a href={downloadUrl(r.profile.resume)} className={s.backLink} style={{ margin: 0 }} title="Download resume"><Download size={13} /></a>
                      </div>
                    ) : <span className={s.hint}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className={`${s.btn} ${s.btnSm}`} title="Approve" onClick={() => setStatusFor(r._id, 'approved')}><Check size={13} /></button>
                      <button className={`${s.btn} ${s.btnSm}`} title="Shortlist" onClick={() => setStatusFor(r._id, 'shortlisted')}><Star size={13} /></button>
                      <button className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} title="Reject" onClick={() => setStatusFor(r._id, 'rejected')}><Ban size={13} /></button>
                      <button className={`${s.btn} ${s.btnSm}`} title="Message" onClick={() => setEmailTo(r)}><Mail size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {emailTo && (
        <EmailModal
          hackathonId={hackathonId}
          target="single"
          refId={emailTo.student?._id}
          label={emailTo.student?.name || 'participant'}
          onClose={() => setEmailTo(null)}
        />
      )}
    </div>
  );
}
