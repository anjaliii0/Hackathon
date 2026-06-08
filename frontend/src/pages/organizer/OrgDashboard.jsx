import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Users, FileText, UserCheck, Loader2, PlusCircle, ChevronRight, Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { organizerService } from '../../services/services';
import toast from 'react-hot-toast';
import s from './Organizer.module.css';

const STATUS_BADGE = {
  draft: s.badgeGray, pending_approval: s.badgeYellow, open: s.badgeGreen,
  ongoing: s.badgeBlue, judging: s.badgeYellow, completed: s.badgeGray,
};

export default function OrgDashboard() {
  const { user, isCollege } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    organizerService.getOverview()
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const totals = data?.totals || {};
  const stats = [
    { icon: Trophy,    label: 'Hackathons',    value: totals.hackathons,    color: 'var(--steel)' },
    { icon: UserCheck, label: 'Registrations', value: totals.registrations, color: 'var(--success)' },
    { icon: Users,     label: 'Teams',         value: totals.teams,         color: '#a06fa8' },
    { icon: FileText,  label: 'Submissions',   value: totals.submissions,   color: 'var(--warning)' },
  ];

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Welcome back, <em>{user?.name?.split(' ')[0] || 'Organizer'}</em></h1>
          <p className={s.subtitle}>
            {isCollege ? 'College' : 'Company'} organizer dashboard · manage your events end-to-end
          </p>
        </div>
        <Link to="/organizer/hackathons/new" className={`${s.btn} ${s.btnPrimary}`}>
          <PlusCircle size={16} /> Create Hackathon
        </Link>
      </div>

      {loading ? (
        <div className={s.loading}><Loader2 size={28} className={s.spinner} /> Loading…</div>
      ) : (
        <>
          <div className={s.statsRow}>
            {stats.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className={s.statCard}>
                <div className={s.statIcon} style={{ background: `${color}18`, color }}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className={s.statValue}>{value ?? 0}</p>
                  <p className={s.statLabel}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={s.card}>
            <div className={s.cardHead}>
              <h2 className={s.cardTitle}>Recent Hackathons</h2>
              <Link to="/organizer/hackathons" className={s.backLink}>View all <ChevronRight size={14} /></Link>
            </div>

            {(!data?.recent || data.recent.length === 0) ? (
              <div className={s.empty}>
                <Building2 size={36} style={{ opacity: 0.25 }} />
                <p>No hackathons yet. Create your first one to get started.</p>
                <Link to="/organizer/hackathons/new" className={`${s.btn} ${s.btnPrimary}`}>
                  <PlusCircle size={16} /> Create Hackathon
                </Link>
              </div>
            ) : (
              data.recent.map(h => (
                <Link key={h._id} to={`/organizer/hackathons/${h._id}`} className={s.listRow} style={{ textDecoration: 'none' }}>
                  <div className={s.listMain}>
                    <div className={s.listTitle}>{h.title}</div>
                    <div className={s.listMetaRow}>
                      <span className={`${s.badge} ${STATUS_BADGE[h.status] || s.badgeGray}`}>
                        {h.status?.replace(/_/g, ' ')}
                      </span>
                      <span className={s.hint}>Created {new Date(h.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--text-muted)', alignSelf: 'center' }} />
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
