import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { notificationService } from '../../services/services';
import toast from 'react-hot-toast';
import styles from './Notifications.module.css';

// Map backend notification types → the visual style used in the UI
const TYPE_STYLE = {
  submission_result:   'success',
  hackathon_approved:  'success',
  application_update:  'info',
  team_invite:         'info',
  submission_reminder: 'warning',
  general:             'info',
};

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const days = Math.floor(h / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    notificationService.getAll()
      .then(res => setNotifs(res.data.data.notifications || []))
      .catch(() => toast.error('Failed to load notifications'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const markRead = async (id) => {
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    try { await notificationService.markRead(id); } catch { /* non-critical */ }
  };

  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    try { await notificationService.markAllRead(); toast.success('All marked as read'); } catch { /* */ }
  };

  const remove = async (id) => {
    const prev = notifs;
    setNotifs(n => n.filter(x => x._id !== id));
    try { await notificationService.remove(id); } catch { setNotifs(prev); toast.error('Failed to delete'); }
  };

  const unread = notifs.filter(n => !n.isRead).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          {unread > 0 && <span className={styles.badge}>{unread} unread</span>}
        </div>
        {unread > 0 && (
          <button className={styles.markAllBtn} onClick={markAllRead}>
            <CheckCheck size={15} /> Mark all as read
          </button>
        )}
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.empty}><Loader2 size={28} className={styles.spinner} /></div>
        ) : notifs.length === 0 ? (
          <div className={styles.empty}><Bell size={40} style={{ opacity: 0.2 }} /><p>All caught up!</p></div>
        ) : notifs.map(n => {
          const variant = TYPE_STYLE[n.type] || 'info';
          return (
            <div key={n._id} className={`${styles.item} ${!n.isRead ? styles.unread : ''} ${styles[variant]}`}>
              <div className={styles.dot} />
              <div className={styles.body}>
                <p className={styles.text}>{n.message}</p>
                <span className={styles.time}>{timeAgo(n.createdAt)}</span>
              </div>
              <div className={styles.actions}>
                {!n.isRead && (
                  <button className={styles.readBtn} onClick={() => markRead(n._id)} title="Mark as read">
                    <Check size={14} />
                  </button>
                )}
                <button className={styles.deleteBtn} onClick={() => remove(n._id)} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
