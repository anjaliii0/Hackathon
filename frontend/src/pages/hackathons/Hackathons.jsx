import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Filter, Bookmark, BookmarkCheck,
  MapPin, Calendar, Trophy, Users, ChevronRight, X, Loader2
} from 'lucide-react';
import { hackathonService, studentService } from '../../services/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './Hackathons.module.css';

const MODE_COLORS  = { online: '#6aaa8a', offline: '#c0706a', hybrid: '#d4a853' };
const STATUS_COLORS = { open: '#6aaa8a', ongoing: '#88BDF2', completed: '#CBCBCB', judging: '#d4a853', pending_approval: '#b0b0b0' };

export default function Hackathons() {
  const { isStudent } = useAuth();
  const [hackathons,  setHackathons]  = useState([]);
  const [pagination,  setPagination]  = useState({ total: 0, page: 1, pages: 1 });
  const [loading,     setLoading]     = useState(true);
  const [bookmarked,  setBookmarked]  = useState(new Set());
  const [search,      setSearch]      = useState('');
  const [filters,     setFilters]     = useState({ mode: '', status: '', theme: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Load the student's saved hackathons so the bookmark state is real
  useEffect(() => {
    if (!isStudent) return;
    studentService.getBookmarks()
      .then(res => setBookmarked(new Set((res.data.data || []).map(h => h._id))))
      .catch(() => {});
  }, [isStudent]);

  const fetchHackathons = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        mode:   filters.mode   || undefined,
        status: filters.status || undefined,
        theme:  filters.theme  || undefined,
        page:   1,
        limit:  12,
        ...overrides,
      };
      // Remove undefined keys so they don't appear as "undefined" in query
      Object.keys(params).forEach(k => params[k] === undefined && delete params[k]);

      const res = await hackathonService.getAll(params);
      setHackathons(res.data.data.hackathons);
      setPagination(res.data.data.pagination);
    } catch (err) {
      toast.error('Failed to load hackathons');
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => { fetchHackathons(); }, [fetchHackathons]);

  const toggleBookmark = async (id) => {
    // optimistic update
    setBookmarked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      const res = await studentService.toggleBookmark(id);
      toast.success(res.data.message);
    } catch (err) {
      // revert on failure
      setBookmarked(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
      toast.error(err.response?.data?.message || 'Failed to save');
    }
  };

  const clearFilters = () => {
    setFilters({ mode: '', status: '', theme: '' });
    setSearch('');
  };
  const hasFilters = Object.values(filters).some(Boolean) || !!search;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Discover Hackathons</h1>
          <p className={styles.subtitle}>
            {loading ? 'Loading…' : `${pagination.total} hackathons available`}
          </p>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchWrap}>
          <Search size={18} className={styles.searchIcon} />
          <input className={styles.searchInput}
            placeholder="Search by title, theme, organizer…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className={styles.clearBtn} onClick={() => setSearch('')}><X size={15} /></button>}
        </div>
        <button
          className={`${styles.filterBtn} ${showFilters ? styles.filterActive : ''}`}
          onClick={() => setShowFilters(p => !p)}>
          <Filter size={16} /> Filters
          {hasFilters && <span className={styles.filterCount}>{[filters.mode, filters.status, filters.theme].filter(Boolean).length}</span>}
        </button>
      </div>

      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Mode</label>
            <div className={styles.filterChips}>
              {['', 'online', 'offline', 'hybrid'].map(m => (
                <button key={m}
                  className={`${styles.chip} ${filters.mode === m ? styles.chipActive : ''}`}
                  onClick={() => setFilters(f => ({ ...f, mode: m }))}>
                  {m || 'All'}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Status</label>
            <div className={styles.filterChips}>
              {['', 'open', 'ongoing', 'completed'].map(s => (
                <button key={s}
                  className={`${styles.chip} ${filters.status === s ? styles.chipActive : ''}`}
                  onClick={() => setFilters(f => ({ ...f, status: s }))}>
                  {s || 'All'}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Theme</label>
            <input className={styles.filterInput}
              placeholder="e.g. AI/ML, Web3…"
              value={filters.theme}
              onChange={e => setFilters(f => ({ ...f, theme: e.target.value }))} />
          </div>
          {hasFilters && (
            <button className={styles.clearFiltersBtn} onClick={clearFilters}>
              <X size={14} /> Clear all
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className={styles.loadingState}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Loading hackathons…</p>
        </div>
      ) : hackathons.length === 0 ? (
        <div className={styles.empty}>
          <Search size={40} style={{ opacity: 0.2 }} />
          <p>No hackathons found. Try different filters.</p>
          {hasFilters && <button className={styles.clearFiltersBtn} onClick={clearFilters}>Clear filters</button>}
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {hackathons.map(h => (
              <div key={h._id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.cardTags}>
                    <span className={styles.modeTag} style={{ color: MODE_COLORS[h.mode] || '#888' }}>
                      ● {h.mode}
                    </span>
                    <span className={styles.statusTag}
                      style={{ background: `${STATUS_COLORS[h.status] || '#888'}22`, color: STATUS_COLORS[h.status] || '#888' }}>
                      {h.status?.replace('_', ' ')}
                    </span>
                  </div>
                  {isStudent && (
                    <button
                      className={`${styles.bookmarkBtn} ${bookmarked.has(h._id) ? styles.bookmarked : ''}`}
                      onClick={() => toggleBookmark(h._id)}>
                      {bookmarked.has(h._id) ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
                    </button>
                  )}
                </div>

                {h.banner && <img src={h.banner} alt={h.title} className={styles.cardBanner} />}

                <h3 className={styles.cardTitle}>{h.title}</h3>
                <p className={styles.cardOrg}>by {h.organizer?.name || 'Organizer'}</p>

                <div className={styles.cardMeta}>
                  {h.location && <span><MapPin size={13} /> {h.location}</span>}
                  {h.registrationEnd && (
                    <span><Calendar size={13} /> Reg. closes {new Date(h.registrationEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  )}
                  {h.prizes?.length > 0 && (
                    <span><Trophy size={13} /> ₹{(h.prizes[0].amount / 1000).toFixed(0)}K+ prize</span>
                  )}
                  {h.maxParticipants && (
                    <span><Users size={13} /> Max {h.maxParticipants}</span>
                  )}
                </div>

                {h.themes?.length > 0 && (
                  <div className={styles.themes}>
                    {h.themes.slice(0, 3).map(t => <span key={t} className={styles.themeTag}>{t}</span>)}
                  </div>
                )}

                <Link to={`/hackathons/${h._id}`} className={styles.viewBtn}>
                  View Details <ChevronRight size={15} />
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className={styles.pagination}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p}
                  className={`${styles.pageBtn} ${pagination.page === p ? styles.pageBtnActive : ''}`}
                  onClick={() => fetchHackathons({ page: p })}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
