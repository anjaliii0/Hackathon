import { useState, useEffect, useCallback } from 'react';
import { Loader2, Star, Mail, Users, CheckCircle2 } from 'lucide-react';
import { orgDataService, organizerService } from '../../../services/services';
import toast from 'react-hot-toast';
import EmailModal from './EmailModal';
import s from '../Organizer.module.css';

export default function TeamsTab({ hackathonId }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailTeam, setEmailTeam] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    orgDataService.getTeams(hackathonId)
      .then(res => setTeams(res.data.data.teams || []))
      .catch(() => toast.error('Failed to load teams'))
      .finally(() => setLoading(false));
  }, [hackathonId]);
  useEffect(load, [load]);

  const toggleShortlist = async (team) => {
    const next = !team.isShortlisted;
    try {
      await organizerService.shortlistTeam(hackathonId, team._id, next);
      toast.success(next ? 'Team shortlisted' : 'Removed from shortlist');
      setTeams(prev => prev.map(t => t._id === team._id ? { ...t, isShortlisted: next } : t));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className={s.loading}><Loader2 size={24} className={s.spinner} /></div>;
  if (teams.length === 0) return <div className={s.empty}><Users size={36} style={{ opacity: 0.25 }} /><p>No teams formed yet.</p></div>;

  return (
    <div>
      <div className={s.cardHead}>
        <h3 className={s.cardTitle}>Teams ({teams.length})</h3>
      </div>
      <div className={s.grid3}>
        {teams.map(t => (
          <div key={t._id} className={s.hackCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={s.hackTitle} style={{ fontSize: '1rem' }}>{t.name}</span>
              {t.isShortlisted && <span className={`${s.badge} ${s.badgeBlue}`}>Shortlisted</span>}
            </div>
            <div className={s.listMetaRow}>
              {t.isComplete
                ? <span className={`${s.badge} ${s.badgeGreen}`}><CheckCircle2 size={11} style={{ display: 'inline' }} /> Complete</span>
                : <span className={`${s.badge} ${s.badgeGray}`}>Forming</span>}
              <span className={s.hint}>{t.members?.length || 0} member(s)</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {(t.members || []).map(m => (
                <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                  <span>{m.name}{t.leader?._id === m._id || t.leader === m._id ? ' 👑' : ''}</span>
                  <span className={s.hint}>{m.email}</span>
                </div>
              ))}
            </div>
            <div className={s.cardActions}>
              <button className={`${s.btn} ${s.btnSm} ${t.isShortlisted ? '' : s.btnPrimary}`} onClick={() => toggleShortlist(t)}>
                <Star size={13} /> {t.isShortlisted ? 'Unshortlist' : 'Shortlist'}
              </button>
              <button className={`${s.btn} ${s.btnSm}`} onClick={() => setEmailTeam(t)}><Mail size={13} /> Message</button>
            </div>
          </div>
        ))}
      </div>

      {emailTeam && (
        <EmailModal hackathonId={hackathonId} target="team" refId={emailTeam._id}
          label={`team "${emailTeam.name}"`} onClose={() => setEmailTeam(null)} />
      )}
    </div>
  );
}
