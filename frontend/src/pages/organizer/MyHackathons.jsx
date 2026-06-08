import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle, Loader2, Calendar, MapPin, Trophy, Settings, Trash2, Trophy as TrophyIcon, ArrowUpCircle,
} from 'lucide-react';
import { hackathonService } from '../../services/services';
import toast from 'react-hot-toast';
import s from './Organizer.module.css';

const STATUS_BADGE = {
  draft: s.badgeGray, pending_approval: s.badgeYellow, open: s.badgeGreen,
  ongoing: s.badgeBlue, judging: s.badgeYellow, completed: s.badgeGray,
};

// Allowed forward status transitions (mirror of the server's state machine)
const NEXT_STATUS = { open: 'ongoing', ongoing: 'judging', judging: 'completed' };

export default function MyHackathons() {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    hackathonService.getMine()
      .then(res => setHackathons(res.data.data || []))
      .catch(() => toast.error('Failed to load hackathons'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const remove = async (h) => {
    if (!confirm(`Delete "${h.title}"? This cannot be undone.`)) return;
    try {
      await hackathonService.remove(h._id);
      toast.success('Hackathon deleted');
      setHackathons(prev => prev.filter(x => x._id !== h._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const advance = async (h) => {
    const next = NEXT_STATUS[h.status];
    if (!next) return;
    if (!confirm(`Move "${h.title}" from ${h.status} → ${next}?`)) return;
    try {
      await hackathonService.updateStatus(h._id, next);
      toast.success(`Status updated to ${next}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>My Hackathons</h1>
          <p className={s.subtitle}>{loading ? 'Loading…' : `${hackathons.length} event${hackathons.length === 1 ? '' : 's'}`}</p>
        </div>
        <Link to="/organizer/hackathons/new" className={`${s.btn} ${s.btnPrimary}`}>
          <PlusCircle size={16} /> Create Hackathon
        </Link>
      </div>

      {loading ? (
        <div className={s.loading}><Loader2 size={28} className={s.spinner} /> Loading…</div>
      ) : hackathons.length === 0 ? (
        <div className={s.empty}>
          <Trophy size={40} style={{ opacity: 0.2 }} />
          <p>You haven't created any hackathons yet.</p>
          <Link to="/organizer/hackathons/new" className={`${s.btn} ${s.btnPrimary}`}>
            <PlusCircle size={16} /> Create your first hackathon
          </Link>
        </div>
      ) : (
        <div className={s.grid3}>
          {hackathons.map(h => (
            <div key={h._id} className={s.hackCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span className={`${s.badge} ${STATUS_BADGE[h.status] || s.badgeGray}`}>{h.status?.replace(/_/g, ' ')}</span>
                <span className={s.hint}>{h.mode}</span>
              </div>
              <div className={s.hackTitle}>{h.title}</div>
              <div className={s.hackMeta}>
                {h.hackathonStart && <span><Calendar size={13} /> {new Date(h.hackathonStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                {(h.venue || h.location) && <span><MapPin size={13} /> {h.venue || h.location}</span>}
                {h.prizePool > 0 && <span><TrophyIcon size={13} /> ₹{(h.prizePool / 1000).toFixed(0)}K</span>}
              </div>
              <div className={s.cardActions}>
                <button className={`${s.btn} ${s.btnSm} ${s.btnPrimary}`} onClick={() => navigate(`/organizer/hackathons/${h._id}`)}>
                  <Settings size={14} /> Manage
                </button>
                {NEXT_STATUS[h.status] && (
                  <button className={`${s.btn} ${s.btnSm}`} onClick={() => advance(h)} title={`Advance to ${NEXT_STATUS[h.status]}`}>
                    <ArrowUpCircle size={14} />
                  </button>
                )}
                {['draft', 'pending_approval'].includes(h.status) && (
                  <button className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} onClick={() => remove(h)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
