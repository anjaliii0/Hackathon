import { useState, useEffect, useCallback } from 'react';
import { Loader2, Trophy, Award, Medal, Crown } from 'lucide-react';
import { organizerService } from '../../../services/services';
import toast from 'react-hot-toast';
import s from '../Organizer.module.css';

const POSITIONS = [
  { value: '', label: '—' },
  { value: 'winner', label: 'Winner' },
  { value: 'runner_up', label: 'Runner Up' },
  { value: 'second_runner_up', label: '2nd Runner Up' },
  { value: 'special_award', label: 'Special Award' },
];

const RANK_ICON = (r) => r === 1 ? <Crown size={16} style={{ color: '#d4a853' }} />
  : r === 2 ? <Medal size={16} style={{ color: '#9aa7b3' }} />
  : r === 3 ? <Medal size={16} style={{ color: '#c08a5a' }} /> : <span className={s.hint}>{r}</span>;

export default function LeaderboardTab({ hackathonId }) {
  const [board, setBoard] = useState([]);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  // map: submissionId -> { position, awardTitle }
  const [selections, setSelections] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    organizerService.getLeaderboard(hackathonId)
      .then(res => {
        const data = res.data.data;
        setBoard(data.leaderboard || []);
        setPublished(data.resultsPublished);
        // seed selections from existing winners
        const seed = {};
        (data.winners || []).forEach(w => {
          if (w.submission) seed[w.submission] = { position: w.position, awardTitle: w.awardTitle || '' };
        });
        setSelections(seed);
      })
      .catch(() => toast.error('Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, [hackathonId]);
  useEffect(load, [load]);

  const setSel = (subId, key, value) =>
    setSelections(prev => ({ ...prev, [subId]: { ...prev[subId], [key]: value } }));

  const publish = async () => {
    const winners = board
      .filter(row => selections[row._id]?.position)
      .map(row => ({
        team: row.team?._id,
        submission: row._id,
        position: selections[row._id].position,
        awardTitle: selections[row._id].awardTitle || undefined,
      }));
    if (winners.length === 0) return toast.error('Assign at least one winner position');
    if (!confirm(`Publish results with ${winners.length} award(s)? Participants will be notified.`)) return;
    setPublishing(true);
    try {
      await organizerService.publishWinners(hackathonId, winners);
      toast.success('Results published 🎉');
      setPublished(true);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setPublishing(false); }
  };

  if (loading) return <div className={s.loading}><Loader2 size={24} className={s.spinner} /></div>;
  if (board.length === 0) return <div className={s.empty}><Trophy size={36} style={{ opacity: 0.25 }} /><p>No scored submissions yet. Review submissions to build the leaderboard.</p></div>;

  return (
    <div>
      <div className={s.cardHead}>
        <h3 className={s.cardTitle}>
          Leaderboard {published && <span className={`${s.badge} ${s.badgeGreen}`} style={{ marginLeft: 8 }}>Published</span>}
        </h3>
        <button className={`${s.btn} ${s.btnPrimary}`} onClick={publish} disabled={publishing}>
          {publishing ? <Loader2 size={15} className={s.spinner} /> : <Award size={15} />} Publish Results
        </button>
      </div>

      <p className={s.hint} style={{ marginBottom: 14 }}>
        Auto-ranked by total score (judge score + bonus); ties broken by earliest submission. Assign award positions, then publish.
      </p>

      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr><th>Rank</th><th>Team</th><th>Project</th><th>Score</th><th>Bonus</th><th>Total</th><th>Award</th><th>Title</th></tr>
          </thead>
          <tbody>
            {board.map(row => (
              <tr key={row._id}>
                <td style={{ textAlign: 'center' }}>{RANK_ICON(row.computedRank)}</td>
                <td><strong style={{ color: 'var(--navy)' }}>{row.team?.name || '—'}</strong></td>
                <td>{row.title}</td>
                <td>{row.score ?? 0}</td>
                <td>{row.bonusPoints ?? 0}</td>
                <td><strong>{row.effectiveScore}</strong></td>
                <td>
                  <select className={s.select} style={{ width: 150, padding: '6px 8px' }}
                    value={selections[row._id]?.position || ''}
                    onChange={e => setSel(row._id, 'position', e.target.value)}>
                    {POSITIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </td>
                <td>
                  <input className={s.input} style={{ width: 140, padding: '6px 8px' }}
                    placeholder="e.g. Best UI"
                    value={selections[row._id]?.awardTitle || ''}
                    onChange={e => setSel(row._id, 'awardTitle', e.target.value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
