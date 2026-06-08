import { useState, useEffect } from 'react';
import { Camera, GitBranch, Link2 as Linkedin, Globe, Plus, X, Upload, Save, ExternalLink, Loader2 } from 'lucide-react';
import { studentService } from '../../services/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './Profile.module.css';

const SKILL_SUGGESTIONS = ['React', 'Python', 'Machine Learning', 'Node.js', 'Java', 'Flutter',
  'TypeScript', 'MongoDB', 'AWS', 'Docker', 'Figma', 'Deep Learning', 'Next.js', 'FastAPI'];

export default function Profile() {
  const { user } = useAuth();

  // Fields that map exactly to backend Student model + updateProfile body
  const [profile, setProfile] = useState({
    bio: '', college: '', skills: [], github: '', linkedin: '',
    // Extended fields stored in frontend only (backend doesn't have these yet — noted)
    year: '', branch: '', portfolio: '',
  });
  const [resumeName, setResumeName] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [skillInput, setSkillInput]   = useState('');
  const [saving, setSaving]           = useState(false);
  const [fetching, setFetching]       = useState(true);
  const [activeTab, setActiveTab]     = useState('personal');

  // Load profile from backend
  useEffect(() => {
    studentService.getProfile()
      .then(res => {
        const d = res.data.data;
        if (d) {
          setProfile(prev => ({
            ...prev,
            bio:      d.bio       || '',
            college:  d.college   || '',
            skills:   d.skills    || [],
            github:   d.github    || '',
            linkedin: d.linkedin  || '',
          }));
          if (d.avatar)  setAvatarPreview(d.avatar);
          if (d.resume)  setResumeName(d.resume.split('/').pop() || 'Resume uploaded');
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const addSkill = (skill) => {
    const s = skill.trim();
    if (s && !profile.skills.includes(s))
      setProfile(p => ({ ...p, skills: [...p.skills, s] }));
    setSkillInput('');
  };
  const removeSkill = (s) => setProfile(p => ({ ...p, skills: p.skills.filter(x => x !== s) }));

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      await studentService.uploadAvatar(fd);
      toast.success('Avatar updated!');
    } catch { toast.error('Avatar upload failed'); }
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeName(file.name);
    const fd = new FormData();
    fd.append('resume', file);
    try {
      await studentService.uploadResume(fd);
      toast.success('Resume uploaded!');
    } catch { toast.error('Resume upload failed'); }
  };

  // Save only the fields backend accepts: bio, college, skills, github, linkedin
  const handleSave = async () => {
    setSaving(true);
    try {
      await studentService.updateProfile({
        bio:       profile.bio,
        college:   profile.college,
        year:      profile.year,
        branch:    profile.branch,
        skills:    profile.skills,
        github:    profile.github,
        linkedin:  profile.linkedin,
        portfolio: profile.portfolio,
      });
      toast.success('Profile saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Completion score based on filled fields
  const completionFields = [
    profile.bio, profile.college, profile.github,
    profile.linkedin, profile.skills.length > 0, avatarPreview, resumeName,
  ];
  const completion = Math.round((completionFields.filter(Boolean).length / completionFields.length) * 100);

  if (fetching) return (
    <div className={styles.fetchingState}>
      <Loader2 size={28} className={styles.spinner} />
      <p>Loading profile…</p>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Profile</h1>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className={styles.layout}>
        {/* Avatar card */}
        <div className={styles.avatarCard}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatarCircle}>
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar" className={styles.avatarImg} />
                : <span className={styles.avatarInitial}>{user?.name?.charAt(0).toUpperCase()}</span>}
            </div>
            <label className={styles.cameraBtn} title="Upload photo">
              <Camera size={15} />
              <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </label>
          </div>
          <h2 className={styles.avatarName}>{user?.name}</h2>
          <p className={styles.avatarEmail}>{user?.email}</p>
          <span className={styles.roleTag}>Student</span>

          <div className={styles.completionWrap}>
            <div className={styles.completionLabel}>
              <span>Profile completion</span>
              <span>{completion}%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className={styles.mainCard}>
          <div className={styles.tabs}>
            {['personal', 'education', 'links', 'skills'].map(t => (
              <button key={t}
                className={`${styles.tab} ${activeTab === t ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles.tabContent}>

            {activeTab === 'personal' && (
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label}>Bio</label>
                  <textarea className={styles.textarea} rows={4}
                    placeholder="Tell the world about yourself — your passions, projects, what makes you hack…"
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Resume <span className={styles.optLabel}>(PDF)</span></label>
                  <label className={styles.uploadArea}>
                    <Upload size={20} className={styles.uploadIcon} />
                    <span>{resumeName || 'Click to upload PDF resume'}</span>
                    <span className={styles.uploadSub}>PDF only · max 5 MB</span>
                    <input type="file" accept=".pdf" hidden onChange={handleResumeChange} />
                  </label>
                </div>
              </div>
            )}


            {activeTab === 'education' && (
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label}>College / University</label>
                  <input className={styles.input} placeholder="IIT Delhi"
                    value={profile.college}
                    onChange={e => setProfile(p => ({ ...p, college: e.target.value }))} />
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Year of Study</label>
                    <select className={styles.select}
                      value={profile.year} onChange={e => setProfile(p => ({ ...p, year: e.target.value }))}>
                      <option value="">Select year</option>
                      {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Branch / Department</label>
                    <input className={styles.input} placeholder="Computer Science & Engineering"
                      value={profile.branch}
                      onChange={e => setProfile(p => ({ ...p, branch: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'links' && (
              <div className={styles.fields}>
                {[
                  { key: 'github',   icon: GitBranch, placeholder: 'https://github.com/username',      label: 'GitHub Profile' },
                  { key: 'linkedin', icon: Linkedin,  placeholder: 'https://linkedin.com/in/username', label: 'LinkedIn Profile' },
                  { key: 'portfolio',icon: Globe,     placeholder: 'https://yourportfolio.dev',        label: 'Portfolio Website', notSaved: true },
                ].map(({ key, icon: Icon, placeholder, label, notSaved }) => (
                  <div key={key} className={styles.field}>
                    <label className={styles.label}>
                      {label}
                      {notSaved && <span className={styles.optLabel}> (local only)</span>}
                    </label>
                    <div className={styles.inputWrap}>
                      <Icon size={16} className={styles.icon} />
                      <input className={styles.input} style={{ paddingLeft: 38 }}
                        placeholder={placeholder}
                        value={profile[key]}
                        onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))} />
                      {profile[key] && (
                        <a href={profile[key]} target="_blank" rel="noreferrer" className={styles.externalLink}>
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'skills' && (
              <div className={styles.fields}>
                <div className={styles.field}>
                  <label className={styles.label}>Add Skills</label>
                  <div className={styles.skillInputRow}>
                    <input className={styles.input}
                      placeholder="Type a skill and press Enter"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput))} />
                    <button className={styles.addSkillBtn} onClick={() => addSkill(skillInput)}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className={styles.suggestionRow}>
                  {SKILL_SUGGESTIONS.filter(s => !profile.skills.includes(s)).slice(0, 8).map(s => (
                    <button key={s} className={styles.suggestion} onClick={() => addSkill(s)}>{s}</button>
                  ))}
                </div>

                <div className={styles.skillTags}>
                  {profile.skills.length === 0
                    ? <p className={styles.emptySkills}>No skills added yet.</p>
                    : profile.skills.map(s => (
                      <span key={s} className={styles.skillTag}>
                        {s}
                        <button onClick={() => removeSkill(s)}><X size={12} /></button>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
