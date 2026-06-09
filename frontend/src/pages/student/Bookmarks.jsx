import { useState, useEffect } from 'react';
import { Bookmark, Trash2, ExternalLink, Loader2, MapPin, Calendar, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { studentService } from '../../services/services';
import toast from 'react-hot-toast';
import styles from './Bookmarks.module.css';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
const money = (n) => !n ? null : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;

export default function Bookmarks() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentService.getBookmarks()
      .then(res => setSaved(res.data.data || []))
      .catch(() => toast.error('Failed to load saved hackathons'))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id) => {
    const prev = saved;
    setSaved(s => s.filter(h => h._id !== id));   // optimistic
    try {
      await studentService.toggleBookmark(id);
      toast.success('Removed from saved');
    } catch {
      setSaved(prev);
      toast.error('Failed to remove');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Saved Hackathons</h1>
        <p className={styles.subtitle}>{loading ? 'Loading…' : `${saved.length} hackathon${saved.length === 1 ? '' : 's'} bookmarked`}</p>
      </div>

      {loading ? (
        <div className={styles.empty}><Loader2 size={28} className={styles.spinner} /></div>
      ) : saved.length === 0 ? (
        <div className={styles.empty}>
          <Bookmark size={48} style={{ opacity: 0.2 }} />
          <p>No saved hackathons. Browse and bookmark ones you like!</p>
          <Link to="/hackathons" className={styles.discoverLink}>Browse Hackathons</Link>
        </div>
      ) : (
        <div className={styles.list}>
          {saved.map(h => (
            <div key={h._id} className={styles.item}>
              <div className={styles.itemLeft}>
                <div className={styles.itemMeta}>
                  {(h.themes || []).slice(0, 2).map(t => <span key={t} className={styles.tag}>{t}</span>)}
                  <span className={`${styles.mode} ${styles[h.mode]}`}>● {h.mode}</span>
                </div>
                <h3 className={styles.itemTitle}>{h.title}</h3>
                <div className={styles.itemDetail}>
                  {(h.venue || h.location) && <span><MapPin size={13} /> {h.venue || h.location}</span>}
                  {fmtDate(h.registrationDeadline || h.registrationEnd) && <span><Calendar size={13} /> Closes {fmtDate(h.registrationDeadline || h.registrationEnd)}</span>}
                  {money(h.prizePool) && <span><Trophy size={13} /> {money(h.prizePool)}</span>}
                </div>
              </div>
              <div className={styles.itemActions}>
                <Link to={`/hackathons/${h._id}`} className={styles.viewBtn} title="View details"><ExternalLink size={16} /></Link>
                <button className={styles.removeBtn} onClick={() => remove(h._id)} title="Remove"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
