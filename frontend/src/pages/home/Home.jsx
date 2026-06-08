import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy, Sparkles, TrendingUp, CalendarClock, Star, MapPin, Calendar,
  Users, ChevronRight, Loader2, Zap, MessageSquarePlus, X, Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { homeService } from '../../services/services';
import toast from 'react-hot-toast';
import s from './Home.module.css';

const MODE_COLORS = { online: '#6aaa8a', offline: '#c0706a', hybrid: '#d4a853' };
const STATUS_COLORS = { open: '#6aaa8a', ongoing: '#88BDF2', completed: '#CBCBCB', judging: '#d4a853' };

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null;
const money = (n) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K` : `₹${n}`;

function HackCard({ h, rank }) {
  return (
    <Link to={`/hackathons/${h._id}`} className={s.card}>
      {h.banner
        ? <img src={h.banner} alt={h.title} className={s.cardBanner} />
        : <div className={s.cardBannerFallback}><Trophy size={32} opacity={0.5} /></div>}
      <div className={s.cardBody}>
        <div className={s.cardTags}>
          <span className={s.modeTag} style={{ color: MODE_COLORS[h.mode] || '#888' }}>● {h.mode}</span>
          {rank != null
            ? <span className={s.rankTag}><TrendingUp size={12} /> #{rank} trending</span>
            : h.status && <span className={s.statusBadge} style={{ background: `${STATUS_COLORS[h.status] || '#888'}22`, color: STATUS_COLORS[h.status] || '#888' }}>{h.status.replace('_', ' ')}</span>}
        </div>
        <div className={s.cardTitle}>{h.title}</div>
        <div className={s.cardOrg}>by {h.organizer?.name || 'Organizer'}</div>
        {h.themes?.length > 0 && (
          <div className={s.themeRow}>{h.themes.slice(0, 3).map(t => <span key={t} className={s.themeTag}>{t}</span>)}</div>
        )}
        <div className={s.cardMeta}>
          {(h.venue || h.location) && <span><MapPin size={13} /> {h.venue || h.location}</span>}
          {fmtDate(h.hackathonStart) && <span><Calendar size={13} /> {fmtDate(h.hackathonStart)}</span>}
          {h.prizePool > 0 && <span><Trophy size={13} /> {money(h.prizePool)}</span>}
          {h.registrationCount > 0 && <span><Users size={13} /> {h.registrationCount} joined</span>}
        </div>
      </div>
    </Link>
  );
}

function Section({ icon: Icon, title, sub, children, alt }) {
  const inner = (
    <div className={alt ? s.altInner : undefined}>
      <div className={s.sectionHead}>
        <div>
          <h2 className={s.sectionTitle}><Icon size={22} style={{ color: 'var(--steel)' }} /> {title}</h2>
          {sub && <p className={s.sectionSub}>{sub}</p>}
        </div>
        <Link to="/hackathons" className={s.seeAll}>Browse all <ChevronRight size={14} /></Link>
      </div>
      {children}
    </div>
  );
  return <section className={alt ? `${s.section} ${s.altBg}` : s.section}>{inner}</section>;
}

export default function Home() {
  const { isLoggedIn, isOrganizer, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);

  const load = () => {
    homeService.getHomeData()
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load home'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const dashHref = isAdmin ? '/admin' : isOrganizer ? '/organizer' : '/dashboard';
  const stats = data?.stats;

  return (
    <div className={s.home}>
      {/* Navbar */}
      <nav className={s.navbar}>
        <div className={s.brand}>
          <div className={s.brandLogo}><Trophy size={20} /></div>
          <span className={s.brandName}>HackPortal</span>
        </div>
        <div className={s.navLinks}>
          <Link to="/hackathons" className={s.navLink}>Explore</Link>
          {isLoggedIn ? (
            <Link to={dashHref} className={`${s.btn} ${s.btnPrimary}`}>Go to Dashboard <ChevronRight size={15} /></Link>
          ) : (
            <>
              <Link to="/login" className={s.navLink}>Log in</Link>
              <Link to="/register" className={`${s.btn} ${s.btnPrimary}`}>Sign up</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className={s.hero}>
        <span className={s.heroEyebrow}><Sparkles size={14} /> Where ideas become innovations</span>
        <h1 className={s.heroTitle}>Discover, compete and win at the best <em>hackathons</em></h1>
        <p className={s.heroSub}>
          Join thousands of builders. Find your next challenge, form a team, and ship something incredible.
        </p>
        <div className={s.heroActions}>
          {isLoggedIn ? (
            <Link to={dashHref} className={`${s.btn} ${s.btnPrimary} ${s.heroBtnLg}`}><Zap size={17} /> Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/register" className={`${s.btn} ${s.btnPrimary} ${s.heroBtnLg}`}><Zap size={17} /> Get Started</Link>
              <Link to="/hackathons" className={`${s.btn} ${s.heroBtnLg}`}>Explore Hackathons</Link>
            </>
          )}
        </div>

        {stats && (
          <div className={s.statsStrip}>
            <div className={s.statItem}><div className={s.statValue}>{stats.hackathons}+</div><div className={s.statLabel}>Hackathons</div></div>
            <div className={s.statItem}><div className={s.statValue}>{stats.students}+</div><div className={s.statLabel}>Students</div></div>
            <div className={s.statItem}><div className={s.statValue}>{stats.organizers}+</div><div className={s.statLabel}>Organizers</div></div>
            <div className={s.statItem}><div className={s.statValue}>{money(stats.prizePool)}+</div><div className={s.statLabel}>In Prizes</div></div>
          </div>
        )}
      </header>

      {loading ? (
        <div className={s.loading}><Loader2 size={30} className={s.spinner} /> Loading…</div>
      ) : (
        <>
          {/* Featured */}
          <Section icon={Sparkles} title="Featured Hackathons" sub="Handpicked events you shouldn't miss">
            {data.featured?.length ? (
              <div className={s.grid}>{data.featured.map(h => <HackCard key={h._id} h={h} />)}</div>
            ) : <div className={s.empty}><p>No featured hackathons yet.</p></div>}
          </Section>

          {/* Trending */}
          <Section icon={TrendingUp} title="Trending Now" sub="Most popular by registrations" alt>
            {data.trending?.length ? (
              <div className={s.grid}>{data.trending.map((h, i) => <HackCard key={h._id} h={h} rank={i + 1} />)}</div>
            ) : <div className={s.empty}><p>Nothing trending yet — be the first to register!</p></div>}
          </Section>

          {/* Upcoming */}
          <Section icon={CalendarClock} title="Upcoming Events" sub="Mark your calendar">
            {data.upcoming?.length ? (
              <div className={s.grid}>{data.upcoming.map(h => <HackCard key={h._id} h={h} />)}</div>
            ) : <div className={s.empty}><p>No upcoming events scheduled.</p></div>}
          </Section>

          {/* Reviews */}
          <section className={`${s.section} ${s.altBg}`}>
            <div className={s.altInner}>
              <div className={s.sectionHead}>
                <div>
                  <h2 className={s.sectionTitle}><Star size={22} style={{ color: 'var(--steel)' }} /> What People Say</h2>
                  <p className={s.sectionSub}>Reviews from our community</p>
                </div>
                {isLoggedIn && (
                  <button className={`${s.btn}`} onClick={() => setShowReview(true)}>
                    <MessageSquarePlus size={15} /> Write a review
                  </button>
                )}
              </div>
              {data.reviews?.length ? (
                <div className={s.reviewGrid}>
                  {data.reviews.map(r => (
                    <div key={r._id} className={s.reviewCard}>
                      <div className={s.stars}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={15} fill={i < r.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                      <p className={s.reviewText}>“{r.comment}”</p>
                      <div className={s.reviewer}>
                        <div className={s.reviewerAvatar}>{r.name?.charAt(0).toUpperCase() || 'U'}</div>
                        <div>
                          <div className={s.reviewerName}>{r.name}</div>
                          <div className={s.reviewerRole}>{r.role || 'Member'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={s.empty}>
                  <Award size={32} style={{ opacity: 0.3 }} />
                  <p>No reviews yet.{isLoggedIn ? ' Be the first to share your experience!' : ' Log in to leave one.'}</p>
                </div>
              )}
            </div>
          </section>

          {/* CTA */}
          {!isLoggedIn && (
            <div className={s.cta}>
              <h2 className={s.ctaTitle}>Ready to build something great?</h2>
              <p className={s.ctaSub}>Create your free account and join the next hackathon.</p>
              <Link to="/register" className={`${s.btn} ${s.heroBtnLg} ${s.ctaBtn}`}>Create Account <ChevronRight size={16} /></Link>
            </div>
          )}

          <footer className={s.footer}>
            © {new Date().getFullYear()} HackPortal · Where ideas become innovations
          </footer>
        </>
      )}

      {showReview && <ReviewModal onClose={() => setShowReview(false)} onSaved={() => { setShowReview(false); load(); }} />}
    </div>
  );
}

function ReviewModal({ onClose, onSaved }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return toast.error('Please write a comment');
    setSaving(true);
    try {
      await homeService.addReview({ rating, comment });
      toast.success('Thanks for your review!');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalHead}>
          <h3 className={s.modalTitle}>Write a Review</h3>
          <button className={s.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className={s.field}>
            <label className={s.label}>Your rating</label>
            <div className={s.ratingPick}>
              {Array.from({ length: 5 }).map((_, i) => (
                <button type="button" key={i} className={`${s.starBtn} ${i < rating ? s.starOn : ''}`} onClick={() => setRating(i + 1)}>
                  <Star size={26} fill={i < rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <div className={s.field}>
            <label className={s.label}>Your review</label>
            <textarea className={s.textarea} value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Share your experience with HackPortal…" required />
          </div>
          <div className={s.modalActions}>
            <button type="button" className={s.btn} onClick={onClose}>Cancel</button>
            <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={saving}>
              {saving ? <Loader2 size={15} className={s.spinner} /> : null} Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
