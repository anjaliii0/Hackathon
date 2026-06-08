import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Activity, Trophy, IndianRupee, Loader2, ShieldAlert,
  BadgeCheck, TrendingUp, ChevronRight, Megaphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/services';
import toast from 'react-hot-toast';
import s from './Admin.module.css';

const money = (n = 0) => n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboard()
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={s.page}><div className={s.loading}><Loader2 size={28} className={s.spinner} /> Loading…</div></div>;

  const u = data?.users || {};
  const h = data?.hackathons || {};
  const r = data?.revenue || {};

  const stats = [
    { icon: Users,       label: 'Total Users',     value: u.total,           sub: `${u.students||0} students · ${u.colleges||0} colleges · ${u.companies||0} cos.`, color: 'var(--steel)' },
    { icon: Activity,    label: 'Active Users',     value: u.active?.week,    sub: `${u.active?.today||0} today · ${u.active?.month||0} this month`, color: 'var(--success)' },
    { icon: Trophy,      label: 'Total Hackathons', value: h.total,           sub: `${h.live||0} live · ${h.pending||0} pending`, color: '#a06fa8' },
    { icon: IndianRupee, label: 'Revenue',          value: money(r.total),    sub: `${money(r.thisMonth)} this month`, color: 'var(--warning)' },
  ];

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Welcome, <em>{user?.name?.split(' ')[0] || 'Admin'}</em> 👑</h1>
          <p className={s.subtitle}>Platform control center</p>
        </div>
        <Link to="/admin/broadcast" className={`${s.btn} ${s.btnPrimary}`}><Megaphone size={16} /> Broadcast</Link>
      </div>

      <div className={s.statsRow}>
        {stats.map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className={s.statCard}>
            <div className={s.statIcon} style={{ background: `${color}18`, color }}><Icon size={22} /></div>
            <div style={{ minWidth: 0 }}>
              <p className={s.statValue}>{value ?? 0}</p>
              <p className={s.statLabel}>{label}</p>
              <p className={s.statSub}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action cards for pending work */}
      <div className={s.statsRow} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <Link to="/admin/verification" className={s.statCard} style={{ textDecoration: 'none' }}>
          <div className={s.statIcon} style={{ background: '#fbf2db', color: 'var(--warning)' }}><BadgeCheck size={22} /></div>
          <div>
            <p className={s.statValue}>{data?.pendingOrganizers ?? 0}</p>
            <p className={s.statLabel}>Pending Verifications</p>
          </div>
          <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
        </Link>
        <Link to="/admin/hackathons" className={s.statCard} style={{ textDecoration: 'none' }}>
          <div className={s.statIcon} style={{ background: 'var(--accent-light)', color: 'var(--steel)' }}><Trophy size={22} /></div>
          <div>
            <p className={s.statValue}>{h.pending ?? 0}</p>
            <p className={s.statLabel}>Hackathons Awaiting Approval</p>
          </div>
          <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
        </Link>
        <Link to="/admin/users" className={s.statCard} style={{ textDecoration: 'none' }}>
          <div className={s.statIcon} style={{ background: '#fbe9e7', color: 'var(--danger)' }}><ShieldAlert size={22} /></div>
          <div>
            <p className={s.statValue}>{u.suspended ?? 0}</p>
            <p className={s.statLabel}>Suspended Accounts</p>
          </div>
          <ChevronRight size={18} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
        </Link>
      </div>

      <div className={s.grid2}>
        {/* Recent revenue */}
        <div className={s.card}>
          <div className={s.cardHead}>
            <h2 className={s.cardTitle}>Recent Revenue</h2>
            <span className={s.badge + ' ' + s.badgeGreen}>{money(r.total)} total</span>
          </div>
          {(!r.recent || r.recent.length === 0) ? (
            <div className={s.empty}><p>No transactions yet. Revenue is recorded when you approve or feature hackathons.</p></div>
          ) : r.recent.map(tx => (
            <div key={tx._id} className={s.listRow}>
              <div className={s.listMain}>
                <div className={s.listTitle}>{tx.hackathon?.title || tx.note || 'Transaction'}</div>
                <div className={s.listSub}>
                  {tx.organizer?.name || '—'} · {tx.type.replace(/_/g, ' ')} · {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <span className={s.amount}>{money(tx.amount)}</span>
            </div>
          ))}
        </div>

        {/* Revenue breakdown */}
        <div className={s.card}>
          <div className={s.cardHead}><h2 className={s.cardTitle}>Breakdown</h2></div>
          <div className={s.listRow}>
            <div className={s.listMain}><div className={s.listTitle}>Listing Fees</div><div className={s.listSub}>From approved hackathons</div></div>
            <span className={s.amount}>{money(r.byType?.listing_fee)}</span>
          </div>
          <div className={s.listRow}>
            <div className={s.listMain}><div className={s.listTitle}>Feature Fees</div><div className={s.listSub}>From promoted hackathons</div></div>
            <span className={s.amount}>{money(r.byType?.feature_fee)}</span>
          </div>
          <div className={s.listRow}>
            <div className={s.listMain}><div className={s.listTitle} style={{ display: 'flex', gap: 6, alignItems: 'center' }}><TrendingUp size={15} style={{ color: 'var(--steel)' }} /> Featured Live</div></div>
            <span className={s.badge + ' ' + s.badgeBlue}>{h.featured ?? 0} hackathons</span>
          </div>
        </div>
      </div>
    </div>
  );
}
