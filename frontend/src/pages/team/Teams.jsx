import { useState, useEffect } from 'react';
import { Users, Plus, Crown, X, Copy, Check, UserPlus, Loader2, RefreshCw } from 'lucide-react';
import { teamService, hackathonService } from '../../services/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './Teams.module.css';

export default function Teams() {
  const { user } = useAuth();

  // State
  const [tab, setTab] = useState('myteams');         // myteams | create | join
  const [hackathons, setHackathons] = useState([]);  // for selecting hackathon
  const [selectedHack, setSelectedHack] = useState(''); // hackathonId currently viewing

  const [team, setTeam]       = useState(null);       // current team from API
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({ hackathonId: '', name: '' });
  // Join form
  const [joinForm, setJoinForm] = useState({ hackathonId: '', inviteCode: '' });
  // Chat (local only — no backend chat route exists yet)
  const [chatMessages, setChatMessages] = useState([
    { id: 1, from: 'System', text: 'Team chat is local only for now. Backend chat coming soon!', time: 'now' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Load open hackathons for the dropdowns
  useEffect(() => {
    hackathonService.getAll({ status: 'open', limit: 20 })
      .then(res => setHackathons(res.data.data.hackathons || []))
      .catch(() => {});
  }, []);

  // Load team whenever selected hackathon changes
  useEffect(() => {
    if (!selectedHack) { setTeam(null); return; }
    setLoading(true);
    teamService.getMyTeam(selectedHack)
      .then(res => setTeam(res.data.data))
      .catch(() => setTeam(null))
      .finally(() => setLoading(false));
  }, [selectedHack]);

  const copyCode = () => {
    if (!team?.inviteCode) return;
    navigator.clipboard.writeText(team.inviteCode);
    setCopiedCode(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreate = async () => {
    if (!createForm.hackathonId || !createForm.name.trim()) {
      toast.error('Select a hackathon and enter team name'); return;
    }
    try {
      await teamService.create(createForm.hackathonId, createForm.name.trim());
      toast.success('Team created!');
      setSelectedHack(createForm.hackathonId);
      setTab('myteams');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create team');
    }
  };

  const handleJoin = async () => {
    if (!joinForm.hackathonId || !joinForm.inviteCode.trim()) {
      toast.error('Select a hackathon and enter invite code'); return;
    }
    try {
      await teamService.join(joinForm.hackathonId, joinForm.inviteCode.trim());
      toast.success('Joined team!');
      setSelectedHack(joinForm.hackathonId);
      setTab('myteams');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid invite code');
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedHack) return;
    try {
      const res = await teamService.markComplete(selectedHack);
      setTeam(res.data.data);
      toast.success('Team marked as complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark complete');
    }
  };

  const handleRegenerateCode = async () => {
    if (!selectedHack) return;
    try {
      const res = await teamService.regenerateCode(selectedHack);
      setTeam(prev => ({ ...prev, inviteCode: res.data.data.inviteCode }));
      toast.success('Invite code regenerated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleLeave = async () => {
    if (!selectedHack) return;
    if (!confirm('Leave this team?')) return;
    try {
      await teamService.leaveTeam(selectedHack);
      setTeam(null);
      toast.success('Left team');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave');
    }
  };

  const isLeader = team?.leader?._id === user?._id || team?.leader === user?._id;

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { id: Date.now(), from: 'You', text: chatInput.trim(), time: 'now' }]);
    setChatInput('');
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Team Management</h1>
        <div className={styles.headerTabs}>
          {[['myteams', 'My Team'], ['create', 'Create Team'], ['join', 'Join Team']].map(([k, v]) => (
            <button key={k}
              className={`${styles.headerTab} ${tab === k ? styles.activeHeaderTab : ''}`}
              onClick={() => setTab(k)}>{v}</button>
          ))}
        </div>
      </div>

      {/* ── My Team ── */}
      {tab === 'myteams' && (
        <div className={styles.myTeamLayout}>
          {/* Hackathon selector */}
          <div className={styles.hackSelector}>
            <label className={styles.label}>Select Hackathon to view team</label>
            <select className={styles.select} value={selectedHack} onChange={e => setSelectedHack(e.target.value)}>
              <option value="">Choose hackathon…</option>
              {hackathons.map(h => (
                <option key={h._id} value={h._id}>{h.title}</option>
              ))}
            </select>
          </div>

          {!selectedHack ? (
            <div className={styles.noSelection}>
              <Users size={40} style={{ opacity: 0.2 }} />
              <p>Select a hackathon above to view or manage your team</p>
            </div>
          ) : loading ? (
            <div className={styles.loadingState}><Loader2 size={24} className={styles.spinner} /> Loading team…</div>
          ) : !team ? (
            <div className={styles.noTeam}>
              <Users size={40} style={{ opacity: 0.2 }} />
              <p>You're not in a team for this hackathon yet.</p>
              <div className={styles.noTeamActions}>
                <button className={styles.actionBtn} onClick={() => { setCreateForm(f => ({ ...f, hackathonId: selectedHack })); setTab('create'); }}>
                  <Plus size={15} /> Create team
                </button>
                <button className={styles.actionBtnOutline} onClick={() => { setJoinForm(f => ({ ...f, hackathonId: selectedHack })); setTab('join'); }}>
                  Join with code
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.teamDetail}>
              <div className={styles.detailHeader}>
                <div>
                  <h2 className={styles.teamName}>{team.name}</h2>
                  <p className={styles.teamHack}>{team.hackathon?.title}</p>
                  {team.isComplete && <span className={styles.completeBadge}>✓ Team Complete</span>}
                </div>
                <div className={styles.codeBox}>
                  <span className={styles.codeLabel}>Invite Code</span>
                  <div className={styles.codeRow}>
                    <span className={styles.code}>{team.inviteCode}</span>
                    <button className={styles.copyBtn} onClick={copyCode}>
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    {isLeader && (
                      <button className={styles.copyBtn} onClick={handleRegenerateCode} title="Regenerate">
                        <RefreshCw size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <h3 className={styles.membersTitle}>
                Members ({team.members?.length}/{team.hackathon?.teamSize?.max || '?'})
              </h3>
              <div className={styles.membersList}>
                {team.members?.map(m => {
                  const mId  = m._id || m;
                  const mName = m.name || 'Member';
                  const isThisLeader = (team.leader?._id || team.leader) === mId;
                  const isMe = user?._id === mId;
                  return (
                    <div key={mId} className={styles.memberRow}>
                      <div className={styles.memberAvatar}>{mName.charAt(0).toUpperCase()}</div>
                      <div className={styles.memberInfo}>
                        <span className={styles.memberName}>{mName}{isMe ? ' (You)' : ''}</span>
                        {isThisLeader && <span className={styles.leaderBadge}><Crown size={11} /> Leader</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Leader actions */}
              {isLeader && !team.isComplete && (
                <button className={styles.completeBtn} onClick={handleMarkComplete}>
                  ✓ Mark Team as Complete
                </button>
              )}
              {!isLeader && (
                <button className={styles.leaveBtn} onClick={handleLeave}>
                  <X size={14} /> Leave Team
                </button>
              )}

              {/* Team Chat (local) */}
              <h3 className={styles.membersTitle} style={{ marginTop: 24 }}>Team Chat</h3>
              <div className={styles.chatBox}>
                <div className={styles.chatMessages}>
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`${styles.chatMsg} ${msg.from === 'You' ? styles.chatMsgSelf : ''}`}>
                      <span className={styles.chatFrom}>{msg.from}</span>
                      <p className={styles.chatText}>{msg.text}</p>
                    </div>
                  ))}
                </div>
                <div className={styles.chatInputRow}>
                  <input className={styles.chatInput} placeholder="Type a message…"
                    value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat()} />
                  <button className={styles.chatSendBtn} onClick={sendChat}>Send</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create Team ── */}
      {tab === 'create' && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Create New Team</h2>
          <p className={styles.formSub}>You must be registered (accepted) to the hackathon to create a team</p>
          <div className={styles.formFields}>
            <div className={styles.field}>
              <label className={styles.label}>Hackathon</label>
              <select className={styles.select} value={createForm.hackathonId}
                onChange={e => setCreateForm(f => ({ ...f, hackathonId: e.target.value }))}>
                <option value="">Select hackathon…</option>
                {hackathons.map(h => <option key={h._id} value={h._id}>{h.title}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Team Name</label>
              <input className={styles.input} placeholder="e.g. CodeBreakers"
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <button className={styles.submitBtn} onClick={handleCreate}>
              <Plus size={16} /> Create Team
            </button>
          </div>
        </div>
      )}

      {/* ── Join Team ── */}
      {tab === 'join' && (
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Join Existing Team</h2>
          <p className={styles.formSub}>Enter the invite code shared by your team leader</p>
          <div className={styles.formFields}>
            <div className={styles.field}>
              <label className={styles.label}>Hackathon</label>
              <select className={styles.select} value={joinForm.hackathonId}
                onChange={e => setJoinForm(f => ({ ...f, hackathonId: e.target.value }))}>
                <option value="">Select hackathon…</option>
                {hackathons.map(h => <option key={h._id} value={h._id}>{h.title}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Invite Code</label>
              <input className={styles.input} placeholder="e.g. A3F9C1B2"
                value={joinForm.inviteCode}
                onChange={e => setJoinForm(f => ({ ...f, inviteCode: e.target.value.toUpperCase() }))} />
            </div>
            <button className={styles.submitBtn} onClick={handleJoin}>
              <UserPlus size={16} /> Join Team
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
