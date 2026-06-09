import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, BadgeCheck, Check, X, Building2, Briefcase, Globe, Mail, ExternalLink, Eye,
} from 'lucide-react';
import { adminService } from '../../services/services';
import toast from 'react-hot-toast';
import s from './Admin.module.css';

export default function Verification() {
  const [colleges, setColleges] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [view, setView] = useState(null); // { profile, type, name }

  const load = useCallback(() => {
    setLoading(true);
    adminService.getPendingOrganizers()
      .then(res => {
        setColleges(res.data.data.colleges || []);
        setCompanies(res.data.data.companies || []);
      })
      .catch(() => toast.error('Failed to load pending organizers'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(load, []);

  const review = async (profile, type, action) => {
    if (action === 'reject' && !confirm(`Reject and remove this ${type}? Their account will be deleted.`)) return;
    setBusy(profile._id);
    try {
      await adminService.reviewOrganizer(profile._id, type, action);
      toast.success(action === 'approve' ? `${type} verified` : `${type} rejected`);
      if (type === 'college') setColleges(prev => prev.filter(c => c._id !== profile._id));
      else setCompanies(prev => prev.filter(c => c._id !== profile._id));
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setBusy(null); }
  };

  const total = colleges.length + companies.length;

  const Card = ({ profile, type, name }) => (
    <div className={s.card} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 12, minWidth: 0 }}>
          <div className={s.statIcon} style={{ background: 'var(--accent-light)', color: 'var(--steel)' }}>
            {type === 'college' ? <Building2 size={22} /> : <Briefcase size={22} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className={s.listTitle} style={{ fontSize: '1rem' }}>{name}</div>
            <div className={s.listSub}>{profile.user?.name} · {profile.user?.email}</div>
            <div className={s.listSub} style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
              {profile.location && <span>📍 {profile.location}</span>}
              {(type === 'college' ? profile.establishedYear : profile.industry) &&
                <span>{type === 'college' ? `Est. ${profile.establishedYear}` : profile.industry}</span>}
              {profile.contactEmail && <span><Mail size={12} style={{ display: 'inline' }} /> {profile.contactEmail}</span>}
              {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" style={{ color: 'var(--steel)' }}><Globe size={12} style={{ display: 'inline' }} /> Website <ExternalLink size={10} style={{ display: 'inline' }} /></a>}
            </div>
            {profile.description && <p className={s.listSub} style={{ marginTop: 8, lineHeight: 1.5 }}>{profile.description}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className={`${s.btn} ${s.btnSm}`} onClick={() => setView({ profile, type, name })}>
            <Eye size={13} /> View
          </button>
          <button className={`${s.btn} ${s.btnSm} ${s.btnSuccess}`} disabled={busy === profile._id} onClick={() => review(profile, type, 'approve')}>
            {busy === profile._id ? <Loader2 size={13} className={s.spinner} /> : <Check size={13} />} Verify
          </button>
          <button className={`${s.btn} ${s.btnSm} ${s.btnDanger}`} disabled={busy === profile._id} onClick={() => review(profile, type, 'reject')}>
            <X size={13} /> Reject
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}><BadgeCheck size={26} style={{ color: 'var(--steel)' }} /> Verification</h1>
          <p className={s.subtitle}>Review and verify colleges & companies before they can host</p>
        </div>
      </div>

      {loading ? (
        <div className={s.loading}><Loader2 size={24} className={s.spinner} /></div>
      ) : total === 0 ? (
        <div className={s.empty}><BadgeCheck size={40} style={{ opacity: 0.25 }} /><p>All caught up — no pending verifications.</p></div>
      ) : (
        <>
          {colleges.length > 0 && (
            <>
              <h2 className={s.cardTitle} style={{ margin: '4px 0 12px' }}>Colleges <span className={s.tabCount}>{colleges.length}</span></h2>
              {colleges.map(c => <Card key={c._id} profile={c} type="college" name={c.collegeName} />)}
            </>
          )}
          {companies.length > 0 && (
            <>
              <h2 className={s.cardTitle} style={{ margin: '20px 0 12px' }}>Companies <span className={s.tabCount}>{companies.length}</span></h2>
              {companies.map(c => <Card key={c._id} profile={c} type="company" name={c.companyName} />)}
            </>
          )}
        </>
      )}

      {view && (
        <ProfileModal
          data={view}
          onClose={() => setView(null)}
          onVerify={() => { review(view.profile, view.type, 'approve'); setView(null); }}
          onReject={() => { review(view.profile, view.type, 'reject'); setView(null); }}
        />
      )}
    </div>
  );
}

const SOCIAL_ICON = { linkedin: Globe, twitter: Globe, instagram: Globe, facebook: Globe, github: Globe };

function ProfileModal({ data, onClose, onVerify, onReject }) {
  const { profile, type, name } = data;
  const Row = ({ label, children }) => children ? (
    <div className={s.detailRow}><span className={s.detailLabel}>{label}</span><span className={s.detailVal}>{children}</span></div>
  ) : null;

  const socials = Object.entries(profile.socialLinks || {}).filter(([, v]) => v);

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 600, padding: 0 }}>
        {/* Cover + logo header */}
        <div style={{ height: 130, background: profile.coverImage ? `url(${profile.coverImage}) center/cover` : 'linear-gradient(135deg, var(--steel), var(--sky))', borderRadius: '18px 18px 0 0', position: 'relative' }}>
          <button className={s.closeBtn} onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.85)' }}><X size={18} /></button>
          <div style={{ position: 'absolute', bottom: -32, left: 24, width: 72, height: 72, borderRadius: 16, background: '#fff', border: '3px solid #fff', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {profile.logo
              ? <img src={profile.logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (type === 'college' ? <Building2 size={30} style={{ color: 'var(--steel)' }} /> : <Briefcase size={30} style={{ color: 'var(--steel)' }} />)}
          </div>
        </div>

        <div style={{ padding: '44px 26px 26px' }}>
          <h3 className={s.modalTitle} style={{ marginBottom: 2 }}>{name}</h3>
          <p className={s.listSub} style={{ marginBottom: 16, textTransform: 'capitalize' }}>{type} · pending verification</p>

          {profile.description && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>{profile.description}</p>}

          <Row label="Account holder">{profile.user?.name}</Row>
          <Row label="Account email">{profile.user?.email}</Row>
          <Row label={type === 'college' ? 'Established' : 'Industry'}>{type === 'college' ? profile.establishedYear : profile.industry}</Row>
          <Row label="Location">{profile.location}</Row>
          <Row label="Contact email">{profile.contactEmail}</Row>
          <Row label="Contact phone">{profile.contactPhone}</Row>
          {profile.website && (
            <div className={s.detailRow}>
              <span className={s.detailLabel}>Website</span>
              <a href={profile.website} target="_blank" rel="noreferrer" className={s.detailVal} style={{ color: 'var(--steel)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Visit <ExternalLink size={12} />
              </a>
            </div>
          )}
          <Row label="Applied on">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null}</Row>

          {socials.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {socials.map(([k, v]) => {
                const Icon = SOCIAL_ICON[k] || Globe;
                return <a key={k} href={v} target="_blank" rel="noreferrer" className={`${s.btn} ${s.btnSm}`}><Icon size={14} /> {k}</a>;
              })}
            </div>
          )}

          <div className={s.modalActions}>
            <button className={`${s.btn} ${s.btnDanger}`} onClick={onReject}><X size={15} /> Reject</button>
            <button className={`${s.btn} ${s.btnSuccess}`} onClick={onVerify}><Check size={15} /> Verify</button>
          </div>
        </div>
      </div>
    </div>
  );
}
