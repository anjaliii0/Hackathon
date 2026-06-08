import { useState } from 'react';
import { Bookmark, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './Bookmarks.module.css';

const MOCK_SAVED = [
  { id: '1', title: 'IIT Bombay TechHack 2025', mode: 'offline', deadline: '2025-08-15', prize: '₹1,00,000', theme: ['AI/ML'], status: 'open' },
  { id: '5', title: 'Microsoft Imagine Cup', mode: 'online', deadline: '2025-10-01', prize: '₹15,00,000', theme: ['AI', 'Cloud'], status: 'open' },
];

export default function Bookmarks() {
  const [saved, setSaved] = useState(MOCK_SAVED);

  const remove = (id) => {
    setSaved(prev => prev.filter(h => h.id !== id));
    toast.success('Removed from saved');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Saved Hackathons</h1>
        <p className={styles.subtitle}>{saved.length} hackathons bookmarked</p>
      </div>

      {saved.length === 0 ? (
        <div className={styles.empty}>
          <Bookmark size={48} style={{ opacity: 0.2 }} />
          <p>No saved hackathons. Browse and bookmark ones you like!</p>
          <Link to="/hackathons" className={styles.discoverLink}>Browse Hackathons</Link>
        </div>
      ) : (
        <div className={styles.list}>
          {saved.map(h => (
            <div key={h.id} className={styles.item}>
              <div className={styles.itemLeft}>
                <div className={styles.itemMeta}>
                  {h.theme.map(t => <span key={t} className={styles.tag}>{t}</span>)}
                  <span className={`${styles.mode} ${styles[h.mode]}`}>● {h.mode}</span>
                </div>
                <h3 className={styles.itemTitle}>{h.title}</h3>
                <div className={styles.itemDetail}>
                  <span>Closes {h.deadline}</span>
                  <span>{h.prize}</span>
                </div>
              </div>
              <div className={styles.itemActions}>
                <Link to={`/hackathons/${h.id}`} className={styles.viewBtn}><ExternalLink size={16} /></Link>
                <button className={styles.removeBtn} onClick={() => remove(h.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
