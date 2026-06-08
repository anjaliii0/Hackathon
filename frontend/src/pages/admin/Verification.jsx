import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, BadgeCheck, Check, X, Building2, Briefcase, Globe, Mail, ExternalLink,
} from 'lucide-react';
import { adminService } from '../../services/services';
import toast from 'react-hot-toast';
import s from './Admin.module.css';

export default function Verification() {
  const [colleges, setColleges] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

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
    </div>
  );
}
