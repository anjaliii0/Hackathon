import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, TrendingUp, Loader2 } from 'lucide-react';
import { hackathonService } from '../../services/services';
import { useAuth } from '../../context/AuthContext';
import styles from './Leaderboard.module.css';

export default function Leaderboard() {
  const { user } = useAuth();
  const [hackathons, setHackathons] = useState([]);
  const [selectedHack, setSelectedHack] = useState('');
  const [entries, setEntries]       = useState([]);
  const [loading, setLoading]       = useState(false);

  // Load completed hackathons for leaderboard
  useEffect(() => {
    hackathonService.getAll({ status: 'completed', limit: 20 })
      .then(res => {
        const list = res.data.data.hackathons || [];
        setHackathons(list);
        if (list.length > 0) setSelectedHack(list[0]._id);
      })
      .catch(() => {});
  }, []);

  // Load leaderboard when hackathon selected
  useEffect(() => {
    if (!selectedHack) return;
    setLoading(true);
    hackathonService.getLeaderboard(selectedHack)
      .then(res => setEntries(res.data.data || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [selectedHack]);

  const top3   = entries.slice(0, 3);
  const rest   = entries.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean); // silver | gold | bronze

  const badgeColors = ['#d4a853', '#9e9e9e', '#b87333'];
  const BadgeIcons  = [Crown, Medal, Medal];

  // Find my team's entry
  const myEntry = entries.find(e =>
    e.team?.members?.some(m => (m._id || m) === user?._id)
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Leaderboard</h1>
        <select className={styles.hackSelect} value={selectedHack}
          onChange={e => setSelectedHack(e.target.value)}>
          <option value="">Select hackathon…</option>
          {hackathons.map(h => <option key={h._id} value={h._id}>{h.title}</option>)}
        </select>
      </div>

      {myEntry && (
        <div className={styles.myRankBanner}>
          <TrendingUp size={18} className={styles.myRankIcon} />
          <span>
            Your team <strong>{myEntry.team?.name}</strong> is ranked{' '}
            <strong>#{myEntry.rank}</strong> with a score of{' '}
            <strong>{myEntry.score}</strong>
          </span>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingState}><Loader2 size={26} className={styles.spinner} /> Loading leaderboard…</div>
      ) : entries.length === 0 ? (
        <div className={styles.empty}>
          <Trophy size={40} style={{ opacity: 0.2 }} />
          <p>{selectedHack ? 'No ranked submissions yet for this hackathon.' : 'Select a hackathon to view rankings.'}</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 1 && (
            <div className={styles.podium}>
              {podiumOrder.map((entry, i) => {
                const rankIdx = entry.rank - 1;
                const color   = badgeColors[rankIdx] || '#888';
                const BIcon   = BadgeIcons[rankIdx] || Medal;
                const height  = entry.rank === 1 ? 130 : entry.rank === 2 ? 100 : 80;
                return (
                  <div key={entry._id} className={styles.podiumEntry}>
                    <div className={styles.podiumAvatar} style={{ borderColor: color }}>
                      {entry.team?.name?.charAt(0) || '?'}
                    </div>
                    <p className={styles.podiumTeam}>{entry.team?.name}</p>
                    <p className={styles.podiumScore}>{entry.score} pts</p>
                    <div className={styles.podiumBlock} style={{ height, background: color }}>
                      <BIcon size={22} fill="white" color="white" />
                      <span className={styles.podiumRank}>#{entry.rank}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full table */}
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Team</th>
                  <th>Score</th>
                  <th>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => {
                  const isMe = entry.team?.members?.some(m => (m._id || m) === user?._id);
                  return (
                    <tr key={entry._id} className={`${styles.row} ${isMe ? styles.myRow : ''}`}>
                      <td>
                        <span className={styles.rankNum} style={{ color: badgeColors[entry.rank - 1] || 'var(--navy)' }}>
                          #{entry.rank}
                        </span>
                      </td>
                      <td>
                        <div className={styles.teamCell}>
                          <div className={styles.miniAvatar}>{entry.team?.name?.charAt(0) || '?'}</div>
                          <span className={styles.teamCellName}>{entry.team?.name}</span>
                          {isMe && <span className={styles.youTag}>You</span>}
                        </div>
                      </td>
                      <td>
                        <div className={styles.scoreCell}>
                          <div className={styles.scoreBar}>
                            <div className={styles.scoreFill}
                              style={{ width: `${Math.min(100, entry.score)}%`, background: badgeColors[entry.rank - 1] || 'var(--steel)' }} />
                          </div>
                          <span className={styles.scoreNum}>{entry.score}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.feedbackCell}>{entry.feedback || '—'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
