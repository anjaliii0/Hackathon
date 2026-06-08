import { useState, useEffect, useCallback } from 'react';
import { Loader2, Megaphone, Send, Users, GraduationCap, Building2, Briefcase, Globe } from 'lucide-react';
import { adminService } from '../../services/services';
import toast from 'react-hot-toast';
import s from './Admin.module.css';

const AUDIENCES = [
  { key: 'all', label: 'Everyone', icon: Globe },
  { key: 'students', label: 'Students', icon: GraduationCap },
  { key: 'colleges', label: 'Colleges', icon: Building2 },
  { key: 'companies', label: 'Companies', icon: Briefcase },
  { key: 'organizers', label: 'Organizers', icon: Users },
];

export default function Broadcast() {
  const [audience, setAudience] = useState('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHist, setLoadingHist] = useState(true);

  const loadHistory = useCallback(() => {
    setLoadingHist(true);
    adminService.getBroadcasts()
      .then(res => setHistory(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingHist(false));
  }, []);
  useEffect(loadHistory, [loadHistory]);

  const send = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return toast.error('Subject and message required');
    if (!confirm(`Send this broadcast to: ${AUDIENCES.find(a => a.key === audience).label}?`)) return;
    setSending(true);
    try {
      const res = await adminService.broadcast({ audience, subject, message });
      toast.success(res.data.message || 'Broadcast sent');
      setSubject(''); setMessage('');
      loadHistory();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSending(false); }
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}><Megaphone size={26} style={{ color: 'var(--steel)' }} /> Broadcast & Notifications</h1>
          <p className={s.subtitle}>Send platform-wide announcements (delivered as in-app notifications)</p>
        </div>
      </div>

      <div className={s.grid2}>
        {/* Composer */}
        <form className={s.card} onSubmit={send}>
          <div className={s.cardHead}><h2 className={s.cardTitle}>Compose</h2></div>
          <div className={s.form}>
            <div className={s.field}>
              <label className={s.label}>Audience</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {AUDIENCES.map(({ key, label, icon: Icon }) => (
                  <button type="button" key={key}
                    className={`${s.btn} ${s.btnSm} ${audience === key ? s.btnPrimary : ''}`}
                    onClick={() => setAudience(key)}>
                    <Icon size={13} /> {label}
                  </button>
                ))}
              </div>
            </div>
            <div className={s.field}>
              <label className={s.label}>Subject</label>
              <input className={s.input} value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Platform maintenance notice" required />
            </div>
            <div className={s.field}>
              <label className={s.label}>Message</label>
              <textarea className={s.textarea} value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your announcement…" required />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={sending}>
                {sending ? <Loader2 size={15} className={s.spinner} /> : <Send size={15} />} Send Broadcast
              </button>
            </div>
          </div>
        </form>

        {/* History */}
        <div className={s.card}>
          <div className={s.cardHead}><h2 className={s.cardTitle}>Recent Broadcasts</h2></div>
          {loadingHist ? (
            <div className={s.loading}><Loader2 size={20} className={s.spinner} /></div>
          ) : history.length === 0 ? (
            <div className={s.empty}><p>No broadcasts sent yet.</p></div>
          ) : history.map(b => (
            <div key={b._id} className={s.listRow} style={{ alignItems: 'flex-start' }}>
              <div className={s.listMain}>
                <div className={s.listTitle}>{b.subject}</div>
                <div className={s.listSub} style={{ marginTop: 2 }}>{b.message}</div>
                <div className={s.listSub} style={{ marginTop: 4 }}>
                  <span className={`${s.badge} ${s.badgeBlue}`}>{b.audience}</span>
                  {' '}· {b.recipientCount} recipients · {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
