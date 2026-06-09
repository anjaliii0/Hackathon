import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trophy, Calendar, MapPin, Users, Clock, Loader2, Bookmark, BookmarkCheck,
  CheckCircle2, Lightbulb, BookOpen, FileText, Database, Link2, Video, Code, ExternalLink,
  CalendarClock, Layers,
} from 'lucide-react';
import { hackathonService, registrationService, studentService } from '../../services/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import s from './HackathonDetail.module.css';

const MODE_COLORS = { online: '#6aaa8a', offline: '#c0706a', hybrid: '#d4a853' };
const STATUS_COLORS = { open: '#6aaa8a', ongoing: '#88BDF2', completed: '#CBCBCB', judging: '#d4a853', pending_approval: '#b0b0b0', draft: '#b0b0b0' };
const DIFF_CLASS = { easy: s.diffEasy, medium: s.diffMedium, hard: s.diffHard };
const RES_ICON = { pdf: FileText, api: Code, dataset: Database, link: Link2, video: Video };

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const money = (n) => !n ? '—' : n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;

export default function HackathonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isStudent } = useAuth();

  const [h, setH] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hackathonService.getById(id);
      setH(res.data.data);

      if (isStudent) {
        // registration + bookmark status (best-effort)
        const [reg, bm] = await Promise.allSettled([
          registrationService.getMyStatus(id),
          studentService.getBookmarks(),
        ]);
        if (reg.status === 'fulfilled') setRegistered(!!reg.value.data.data.registered);
        if (bm.status === 'fulfilled') setBookmarked((bm.value.data.data || []).some(x => x._id === id));
      }
    } catch {
      toast.error('Failed to load hackathon');
    } finally { setLoading(false); }
  }, [id, isStudent]);

  useEffect(() => { load(); }, [load]);

  const toggleBookmark = async () => {
    try {
      const res = await studentService.toggleBookmark(id);
      setBookmarked(res.data.data.bookmarked);
      toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const register = async () => {
    setBusy(true);
    try {
      await registrationService.register(id);
      setRegistered(true);
      toast.success('Registered successfully!');
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    finally { setBusy(false); }
  };

  const unregister = async () => {
    if (!confirm('Cancel your registration for this hackathon?')) return;
    setBusy(true);
    try {
      await registrationService.unregister(id);
      setRegistered(false);
      toast.success('Registration cancelled');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  };

  if (loading) return <div className={s.page}><div className={s.loading}><Loader2 size={30} className={s.spinner} /> Loading…</div></div>;
  if (!h) return <div className={s.page}><div className={s.empty}><p>Hackathon not found.</p><Link to="/hackathons" className={s.btn}>Browse hackathons</Link></div></div>;

  const regOpen = ['open', 'ongoing'].includes(h.status);
  const deadline = h.registrationDeadline || h.registrationEnd;

  return (
    <div className={s.page}>
      <Link to="/hackathons" className={s.back}><ArrowLeft size={15} /> Back to hackathons</Link>

      <div className={s.banner}>
        {h.banner ? <img src={h.banner} alt={h.title} className={s.bannerImg} />
          : <div className={s.bannerFallback}><Trophy size={56} /></div>}
      </div>

      <div className={s.body}>
        <div className={s.head}>
          <div className={s.titleWrap}>
            <div className={s.tags}>
              <span className={s.mode} style={{ color: MODE_COLORS[h.mode] || '#888' }}>● {h.mode}</span>
              <span className={s.statusBadge} style={{ background: `${STATUS_COLORS[h.status] || '#888'}22`, color: STATUS_COLORS[h.status] || '#888' }}>
                {h.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className={s.title}>{h.title}</h1>
            <p className={s.org}>by {h.organizer?.name || 'Organizer'}</p>
          </div>

          {isStudent && (
            <div className={s.actions}>
              <button className={`${s.btn} ${s.iconBtn} ${bookmarked ? s.saved : ''}`} onClick={toggleBookmark} title={bookmarked ? 'Saved' : 'Save'}>
                {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              </button>
              {registered ? (
                <>
                  <span className={s.registeredPill}><CheckCircle2 size={15} /> Registered</span>
                  <button className={`${s.btn} ${s.btnDanger}`} onClick={unregister} disabled={busy}>Cancel</button>
                </>
              ) : (
                <button className={`${s.btn} ${s.btnPrimary}`} onClick={register} disabled={busy || !regOpen}>
                  {busy ? <Loader2 size={16} className={s.spinner} /> : null}
                  {regOpen ? 'Register Now' : 'Registration Closed'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick facts */}
        <div className={s.facts}>
          <div className={s.fact}>
            <span className={s.factLabel}><CalendarClock size={12} /> Reg. deadline</span>
            <span className={s.factValue}>{fmtDate(deadline)}</span>
          </div>
          <div className={s.fact}>
            <span className={s.factLabel}><Calendar size={12} /> Event dates</span>
            <span className={s.factValue}>{fmtDate(h.hackathonStart)}{h.hackathonEnd ? ` – ${fmtDate(h.hackathonEnd)}` : ''}</span>
          </div>
          <div className={s.fact}>
            <span className={s.factLabel}><Users size={12} /> Team size</span>
            <span className={s.factValue}>{h.teamSize?.min || 1}–{h.teamSize?.max || 4} members</span>
          </div>
          <div className={s.fact}>
            <span className={s.factLabel}><Trophy size={12} /> Prize pool</span>
            <span className={s.factValue}>{money(h.prizePool)}</span>
          </div>
        </div>

        {(h.venue || h.location) && (
          <div className={s.section}>
            <p className={s.factLabel} style={{ marginBottom: 4 }}><MapPin size={12} /> Venue</p>
            <p className={s.factValue}>{h.venue || h.location}</p>
          </div>
        )}

        {/* About */}
        <div className={s.section}>
          <h2 className={s.sectionTitle}><BookOpen size={18} /> About</h2>
          <p className={s.prose}>{h.description || 'No description provided.'}</p>
        </div>

        {/* Themes */}
        {h.themes?.length > 0 && (
          <div className={s.section}>
            <h2 className={s.sectionTitle}><Layers size={18} /> Themes</h2>
            <div className={s.themes}>{h.themes.map(t => <span key={t} className={s.themeTag}>{t}</span>)}</div>
          </div>
        )}

        {/* Problem statements */}
        {h.problemStatements?.length > 0 && (
          <div className={s.section}>
            <h2 className={s.sectionTitle}><Lightbulb size={18} /> Problem Statements</h2>
            <div className={s.psList}>
              {h.problemStatements.map(ps => (
                <div key={ps._id} className={s.psCard}>
                  <div className={s.psHead}>
                    <span className={s.psTitle}>{ps.title}</span>
                    {ps.difficulty && <span className={`${s.diff} ${DIFF_CLASS[ps.difficulty]}`}>{ps.difficulty}</span>}
                  </div>
                  {ps.description && <p className={s.psDesc}>{ps.description}</p>}
                  {ps.tags?.length > 0 && <div className={s.psTags}>{ps.tags.map(t => <span key={t} className={s.psTag}>{t}</span>)}</div>}
                  {ps.resources?.length > 0 && (
                    <div className={s.psResources}>
                      {ps.resources.map(r => {
                        const Icon = RES_ICON[r.type] || Link2;
                        return (
                          <a key={r._id} href={r.url} target="_blank" rel="noreferrer" className={s.resLink}>
                            <Icon size={14} /> <span className={s.resType}>{r.type}</span> {r.title} <ExternalLink size={11} />
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resources */}
        {h.resources?.length > 0 && (
          <div className={s.section}>
            <h2 className={s.sectionTitle}><BookOpen size={18} /> Resources</h2>
            <div className={s.resList}>
              {h.resources.map(r => {
                const Icon = RES_ICON[r.type] || Link2;
                return (
                  <div key={r._id} className={s.resCard}>
                    <a href={r.url} target="_blank" rel="noreferrer" className={s.resLink}>
                      <Icon size={15} /> <span className={s.resType}>{r.type}</span> {r.title} <ExternalLink size={12} />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Prizes */}
        {h.prizes?.length > 0 && (
          <div className={s.section}>
            <h2 className={s.sectionTitle}><Trophy size={18} /> Prizes</h2>
            <div className={s.prizes}>
              {h.prizes.map((p, i) => (
                <div key={i} className={s.prizeCard}>
                  <div className={s.prizeRank}>{p.title || `Rank ${p.rank}`}</div>
                  <div className={s.prizeAmount}>{money(p.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
