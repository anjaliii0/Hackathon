import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Trophy, Users, ChevronRight, Bell, Zap, BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hackathonService } from '../../services/services';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hackathonService.getAll({ status: 'open', limit: 3 })
      .then(res => setHackathons(res.data.data.hackathons || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const modeColor = { online: '#6aaa8a', offline: '#c0706a', hybrid: '#d4a853' };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            Good morning, <em>{user?.name?.split(' ')[0] || 'Student'}</em> 👋
          </h1>
          <p className={styles.subtitle}>Here's what's happening in your hackathon world</p>
        </div>
        <Link to="/hackathons" className={styles.discoverBtn}>
          <Zap size={16} /> Discover Hackathons
        </Link>
      </header>

      <div className={styles.statsRow}>
        {[
          { icon: Trophy,   label: 'Registered', value: '—', color: 'var(--steel)' },
          { icon: Users,    label: 'My Teams',   value: '—', color: 'var(--success)' },
          { icon: BookOpen, label: 'Submissions', value: '—', color: 'var(--warning)' },
          { icon: Calendar, label: 'Open Now',
            value: loading ? '…' : hackathons.length, color: '#a06fa8' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: `${color}18`, color }}>
              <Icon size={20} />
            </div>
            <div>
              <p className={styles.statValue}>{value}</p>
              <p className={styles.statLabel}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {/* Open hackathons from API */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Open Hackathons</h2>
            <Link to="/hackathons" className={styles.seeAll}>See all <ChevronRight size={14} /></Link>
          </div>

          {loading ? (
            <div className={styles.loadingRow}><Loader2 size={22} className={styles.spinner} /> Loading…</div>
          ) : hackathons.length === 0 ? (
            <p className={styles.emptyMsg}>No open hackathons right now. <Link to="/hackathons">Browse all</Link></p>
          ) : (
            <div className={styles.hackList}>
              {hackathons.map(h => (
                <Link to={`/hackathons/${h._id}`} key={h._id} className={styles.hackCard}>
                  <div className={styles.hackTop}>
                    {h.themes?.[0] && <span className={styles.hackTheme}>{h.themes[0]}</span>}
                    <span className={styles.hackMode} style={{ color: modeColor[h.mode] }}>
                      ● {h.mode}
                    </span>
                  </div>
                  <h3 className={styles.hackTitle}>{h.title}</h3>
                  <div className={styles.hackMeta}>
                    {h.registrationEnd && (
                      <span><Clock size={13} /> Closes {new Date(h.registrationEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    )}
                    {h.prizes?.[0] && (
                      <span><Trophy size={13} /> ₹{(h.prizes[0].amount / 1000).toFixed(0)}K</span>
                    )}
                  </div>
                  <div className={styles.hackFooter}>
                    <span className={styles.hackStatus}>Registration Open</span>
                    <ChevronRight size={15} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Quick links sidebar */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>Quick Access</h2>
          </div>
          <div className={styles.quickLinks}>
            {[
              { to: '/profile',      label: 'Complete your profile',  sub: 'Add skills & links' },
              { to: '/teams',        label: 'Manage teams',            sub: 'Create or join a team' },
              { to: '/submissions',  label: 'Submit project',          sub: 'Upload your hack' },
              { to: '/certificates', label: 'My certificates',         sub: 'Download & share' },
              { to: '/leaderboard',  label: 'View leaderboard',        sub: 'See rankings' },
            ].map(q => (
              <Link key={q.to} to={q.to} className={styles.quickItem}>
                <div>
                  <span className={styles.quickLabel}>{q.label}</span>
                  <span className={styles.quickSub}>{q.sub}</span>
                </div>
                <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
