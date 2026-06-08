import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import styles from './Notifications.module.css';

const INITIAL = [
  { id: 1, text: 'Submission deadline in 2 days for DevSprint 2025', type: 'warning', time: '2 hours ago', read: false },
  { id: 2, text: 'Your team "CodeBreakers" has been joined by Priya Singh', type: 'success', time: '5 hours ago', read: false },
  { id: 3, text: 'HackNITR results announced — check leaderboard!', type: 'info', time: '1 day ago', read: true },
  { id: 4, text: 'New hackathon added: Microsoft Imagine Cup 2025', type: 'info', time: '2 days ago', read: true },
  { id: 5, text: 'Participation certificate for Google Solution Challenge is ready', type: 'success', time: '3 days ago', read: true },
];

export default function Notifications() {
  const [notifs, setNotifs] = useState(INITIAL);

  const markRead = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const remove = (id) => setNotifs(prev => prev.filter(n => n.id !== id));
  const unread = notifs.filter(n => !n.read).length;

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
        {notifs.length === 0 ? (
          <div className={styles.empty}><Bell size={40} style={{ opacity: 0.2 }} /><p>All caught up!</p></div>
        ) : notifs.map(n => (
          <div key={n.id} className={`${styles.item} ${!n.read ? styles.unread : ''} ${styles[n.type]}`}>
            <div className={styles.dot} />
            <div className={styles.body}>
              <p className={styles.text}>{n.text}</p>
              <span className={styles.time}>{n.time}</span>
            </div>
            <div className={styles.actions}>
              {!n.read && (
                <button className={styles.readBtn} onClick={() => markRead(n.id)} title="Mark as read">
                  <Check size={14} />
                </button>
              )}
              <button className={styles.deleteBtn} onClick={() => remove(n.id)} title="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
