import { useState, useEffect } from 'react';
import { UserCheck, Users, FileText, Award, Loader2, Calendar, Trophy } from 'lucide-react';
import { organizerService } from '../../../services/services';
import s from '../Organizer.module.css';

export default function OverviewTab({ hackathon, hackathonId }) {
  const [a, setA] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    organizerService.getAnalytics(hackathonId)
      .then(res => setA(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hackathonId]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const stats = [
    { icon: UserCheck, label: 'Registrations', value: a?.registrations?.total, color: 'var(--success)' },
    { icon: Users,     label: 'Teams',         value: a?.teams?.total,         color: '#a06fa8' },
    { icon: FileText,  label: 'Submissions',   value: a?.submissions?.total,   color: 'var(--warning)' },
    { icon: Award,     label: 'Reviewed',      value: a?.submissions?.reviewed, color: 'var(--steel)' },
  ];

  return (
    <div>
      {loading ? (
        <div className={s.loading}><Loader2 size={24} className={s.spinner} /></div>
      ) : (
        <div className={s.statsRow}>
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={s.statCard}>
              <div className={s.statIcon} style={{ background: `${color}18`, color }}><Icon size={20} /></div>
              <div><p className={s.statValue}>{value ?? 0}</p><p className={s.statLabel}>{label}</p></div>
            </div>
          ))}
        </div>
      )}

      <div className={s.grid2}>
        <div className={s.card}>
          <h3 className={s.cardTitle} style={{ marginBottom: 14 }}>Schedule</h3>
          {[
            ['Registration opens', hackathon.registrationStart],
            ['Registration deadline', hackathon.registrationDeadline || hackathon.registrationEnd],
            ['Hackathon starts', hackathon.hackathonStart],
            ['Hackathon ends', hackathon.hackathonEnd],
          ].map(([label, d]) => (
            <div key={label} className={s.listMetaRow} style={{ justifyContent: 'space-between' }}>
              <span className={s.hint}><Calendar size={13} style={{ display: 'inline', marginRight: 5 }} />{label}</span>
              <strong style={{ fontSize: '0.84rem', color: 'var(--navy)' }}>{fmtDate(d)}</strong>
            </div>
          ))}
        </div>

        <div className={s.card}>
          <h3 className={s.cardTitle} style={{ marginBottom: 14 }}>Details</h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
            {hackathon.description || 'No description provided.'}
          </p>
          <div className={s.listMetaRow} style={{ justifyContent: 'space-between' }}>
            <span className={s.hint}>Team size</span>
            <strong style={{ fontSize: '0.84rem' }}>{hackathon.teamSize?.min}–{hackathon.teamSize?.max} members</strong>
          </div>
          <div className={s.listMetaRow} style={{ justifyContent: 'space-between' }}>
            <span className={s.hint}><Trophy size={13} style={{ display: 'inline', marginRight: 5 }} />Prize pool</span>
            <strong style={{ fontSize: '0.84rem' }}>₹{(hackathon.prizePool || 0).toLocaleString('en-IN')}</strong>
          </div>
          {hackathon.themes?.length > 0 && (
            <div className={s.chips} style={{ marginTop: 12 }}>
              {hackathon.themes.map(t => <span key={t} className={`${s.chip} ${s.chipActive}`}>{t}</span>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
