import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Settings, Lightbulb, BookOpen, Users, FileText,
  BarChart3, Megaphone, Award, Edit3, ArrowUpCircle,
} from 'lucide-react';
import { hackathonService, organizerService } from '../../services/services';
import toast from 'react-hot-toast';
import s from './Organizer.module.css';

import OverviewTab from './tabs/OverviewTab';
import ProblemsTab from './tabs/ProblemsTab';
import ResourcesTab from './tabs/ResourcesTab';
import ParticipantsTab from './tabs/ParticipantsTab';
import TeamsTab from './tabs/TeamsTab';
import SubmissionsTab from './tabs/SubmissionsTab';
import LeaderboardTab from './tabs/LeaderboardTab';
import AnnouncementsTab from './tabs/AnnouncementsTab';
import CertificatesTab from './tabs/CertificatesTab';

const NEXT_STATUS = { open: 'ongoing', ongoing: 'judging', judging: 'completed' };

const TABS = [
  { key: 'overview',     label: 'Overview',      icon: Settings },
  { key: 'problems',     label: 'Problems',      icon: Lightbulb },
  { key: 'resources',    label: 'Resources',     icon: BookOpen },
  { key: 'participants', label: 'Participants',  icon: Users },
  { key: 'teams',        label: 'Teams',         icon: Users },
  { key: 'submissions',  label: 'Submissions',   icon: FileText },
  { key: 'leaderboard',  label: 'Leaderboard',   icon: BarChart3 },
  { key: 'announce',     label: 'Communication', icon: Megaphone },
  { key: 'certs',        label: 'Certificates',  icon: Award },
];

const STATUS_BADGE = {
  draft: s.badgeGray, pending_approval: s.badgeYellow, open: s.badgeGreen,
  ongoing: s.badgeBlue, judging: s.badgeYellow, completed: s.badgeGray,
};

export default function ManageHackathon() {
  const { id } = useParams();
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  const reload = useCallback(() => {
    return hackathonService.getById(id)
      .then(res => setHackathon(res.data.data))
      .catch(() => toast.error('Failed to load hackathon'));
  }, [id]);

  useEffect(() => { reload().finally(() => setLoading(false)); }, [reload]);

  const advanceStatus = async () => {
    const next = NEXT_STATUS[hackathon.status];
    if (!next || !confirm(`Move from ${hackathon.status} → ${next}?`)) return;
    try {
      await hackathonService.updateStatus(id, next);
      toast.success(`Status → ${next}`);
      reload();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <div className={s.page}><div className={s.loading}><Loader2 size={28} className={s.spinner} /> Loading…</div></div>;
  if (!hackathon) return <div className={s.page}><div className={s.empty}><p>Hackathon not found.</p><Link to="/organizer/hackathons" className={s.btn}>Back</Link></div></div>;

  const props = { hackathon, hackathonId: id, reload };

  return (
    <div className={s.page}>
      <Link to="/organizer/hackathons" className={s.backLink}><ArrowLeft size={15} /> Back to hackathons</Link>

      <div className={s.header}>
        <div>
          <h1 className={s.title}>{hackathon.title}</h1>
          <div className={s.listMetaRow}>
            <span className={`${s.badge} ${STATUS_BADGE[hackathon.status] || s.badgeGray}`}>{hackathon.status?.replace(/_/g, ' ')}</span>
            <span className={s.hint}>{hackathon.mode} · {hackathon.venue || hackathon.location || 'TBA'}</span>
            {!hackathon.isApproved && <span className={`${s.badge} ${s.badgeYellow}`}>Awaiting approval</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/organizer/hackathons/${id}/edit`} className={s.btn}><Edit3 size={15} /> Edit</Link>
          {NEXT_STATUS[hackathon.status] && (
            <button className={`${s.btn} ${s.btnPrimary}`} onClick={advanceStatus}>
              <ArrowUpCircle size={15} /> Move to {NEXT_STATUS[hackathon.status]}
            </button>
          )}
        </div>
      </div>

      <div className={s.tabs}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} className={`${s.tab} ${tab === key ? s.tabActive : ''}`} onClick={() => setTab(key)}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview'     && <OverviewTab {...props} />}
      {tab === 'problems'     && <ProblemsTab {...props} />}
      {tab === 'resources'    && <ResourcesTab {...props} />}
      {tab === 'participants' && <ParticipantsTab {...props} />}
      {tab === 'teams'        && <TeamsTab {...props} />}
      {tab === 'submissions'  && <SubmissionsTab {...props} />}
      {tab === 'leaderboard'  && <LeaderboardTab {...props} />}
      {tab === 'announce'     && <AnnouncementsTab {...props} />}
      {tab === 'certs'        && <CertificatesTab {...props} />}
    </div>
  );
}
