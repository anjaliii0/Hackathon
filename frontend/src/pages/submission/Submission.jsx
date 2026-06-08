import { useState, useEffect } from 'react';
import { GitBranch, Video, FileText, Image, Link2, Send, CheckCircle, Loader2 } from 'lucide-react';
import { submissionService, hackathonService, teamService } from '../../services/services';
import toast from 'react-hot-toast';
import styles from './Submission.module.css';

export default function Submission() {
  const [hackathons, setHackathons] = useState([]);
  const [selectedHack, setSelectedHack] = useState('');
  const [team, setTeam]             = useState(null);
  const [existing, setExisting]     = useState(null);  // existing submission
  const [loading, setLoading]       = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', projectUrl: '', demoUrl: '',
  });
  const [presFile, setPresFile] = useState(null);

  // Load open hackathons
  useEffect(() => {
    hackathonService.getAll({ status: 'ongoing', limit: 20 })
      .then(res => setHackathons(res.data.data.hackathons || []))
      .catch(() => {});
  }, []);

  // When hackathon selected, load team + existing submission
  useEffect(() => {
    if (!selectedHack) { setTeam(null); setExisting(null); return; }

    teamService.getMyTeam(selectedHack)
      .then(res => setTeam(res.data.data))
      .catch(() => setTeam(null));

    submissionService.getMySubmission(selectedHack)
      .then(res => {
        const d = res.data.data;
        setExisting(d);
        setForm({
          title:      d.title       || '',
          description: d.description || '',
          projectUrl: d.projectUrl  || '',
          demoUrl:    d.demoUrl     || '',
        });
      })
      .catch(() => setExisting(null));
  }, [selectedHack]);

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('title',       form.title);
    fd.append('description', form.description);
    fd.append('projectUrl',  form.projectUrl);
    fd.append('demoUrl',     form.demoUrl);
    if (presFile) fd.append('presentation', presFile);
    return fd;
  };

  const handleSubmit = async () => {
    if (!selectedHack)         { toast.error('Select a hackathon'); return; }
    if (!team)                 { toast.error('You need to be in a team first'); return; }
    if (!form.title.trim())    { toast.error('Project title required'); return; }
    if (!form.projectUrl.trim()){ toast.error('GitHub URL required'); return; }
    if (!form.description.trim()){ toast.error('Description required'); return; }

    setLoading(true);
    try {
      if (existing) {
        await submissionService.edit(selectedHack, buildFormData());
        toast.success('Submission updated!');
      } else {
        await submissionService.submit(selectedHack, buildFormData());
        toast.success('Project submitted!');
      }
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const checklist = [
    { label: 'Hackathon selected',    done: !!selectedHack },
    { label: 'In a team',             done: !!team },
    { label: 'Team marked complete',  done: !!team?.isComplete },
    { label: 'Project title',         done: !!form.title.trim() },
    { label: 'GitHub URL',            done: !!form.projectUrl.trim() },
    { label: 'Description written',   done: form.description.length > 30 },
    { label: 'Demo video (optional)', done: !!form.demoUrl.trim() },
    { label: 'Presentation (optional)', done: !!presFile },
  ];

  if (submitted) return (
    <div className={styles.successPage}>
      <div className={styles.successCard}>
        <CheckCircle size={60} className={styles.successIcon} />
        <h2 className={styles.successTitle}>
          {existing ? 'Submission Updated!' : 'Project Submitted!'}
        </h2>
        <p className={styles.successText}>Your project has been received. Good luck! 🚀</p>
        <button className={styles.resetBtn} onClick={() => setSubmitted(false)}>
          {existing ? 'Edit Again' : 'Submit Another'}
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {existing ? 'Edit Submission' : 'Submit Project'}
        </h1>
        <p className={styles.subtitle}>
          {existing ? 'Update your project details' : 'Share your hack with the judges'}
        </p>
      </div>

      <div className={styles.layout}>
        <div className={styles.mainForm}>
          {/* Hackathon picker */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Select Hackathon</h2>
            <div className={styles.field}>
              <label className={styles.label}>Hackathon (must be ongoing) *</label>
              <select className={styles.select} value={selectedHack}
                onChange={e => setSelectedHack(e.target.value)}>
                <option value="">Choose hackathon…</option>
                {hackathons.map(h => <option key={h._id} value={h._id}>{h.title}</option>)}
              </select>
            </div>

            {selectedHack && (
              <div className={styles.teamStatus}>
                {team
                  ? <p className={styles.teamOk}>
                      ✓ Team: <strong>{team.name}</strong>
                      {team.isComplete ? ' (Complete)' : ' — mark complete before submitting'}
                    </p>
                  : <p className={styles.teamWarn}>⚠ You are not in a team for this hackathon. Go to <a href="/teams">Teams</a> first.</p>
                }
                {existing && <p className={styles.editNote}>📝 Editing existing submission — changes will overwrite previous.</p>}
              </div>
            )}
          </div>

          {/* Project details */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Project Details</h2>
            <div className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.label}>Project Title *</label>
                <input className={styles.input} placeholder="My Awesome Hack"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>

              {[
                { key: 'projectUrl', icon: GitBranch, label: 'GitHub Repository *', placeholder: 'https://github.com/team/project' },
                { key: 'demoUrl',    icon: Video,     label: 'Demo Video URL',       placeholder: 'https://youtube.com/watch?v=…' },
              ].map(({ key, icon: Icon, label, placeholder }) => (
                <div key={key} className={styles.field}>
                  <label className={styles.label}>{label}</label>
                  <div className={styles.inputWrap}>
                    <Icon size={16} className={styles.icon} />
                    <input className={styles.input} style={{ paddingLeft: 38 }}
                      placeholder={placeholder}
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Project Description *</h2>
            <textarea className={styles.textarea} rows={6}
              placeholder="Describe what you built, the problem it solves, technologies used, and what makes it stand out…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <p className={styles.charCount}>{form.description.length} / 2000</p>
          </div>

          {/* Presentation upload */}
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>
              Presentation / PPT <span className={styles.optional}>(Optional)</span>
            </h2>
            <label className={styles.uploadArea}>
              <FileText size={22} className={styles.uploadIcon} />
              <span>{presFile ? presFile.name : 'Click to upload PPT / PDF'}</span>
              <span className={styles.uploadSub}>PDF, PPTX · max 10 MB</span>
              <input type="file" accept=".pdf,.ppt,.pptx" hidden
                onChange={e => setPresFile(e.target.files[0] || null)} />
            </label>
          </div>
        </div>

        {/* Sidebar checklist + submit */}
        <div className={styles.sidebar}>
          <div className={styles.checklistCard}>
            <h3 className={styles.checklistTitle}>Submission Checklist</h3>
            {checklist.map(({ label, done }) => (
              <div key={label} className={`${styles.checkItem} ${done ? styles.done : ''}`}>
                <div className={styles.checkDot} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
            {loading
              ? <><Loader2 size={16} className={styles.spinner} /> Submitting…</>
              : <><Send size={16} /> {existing ? 'Update Submission' : 'Submit Project'}</>
            }
          </button>

          <p className={styles.submitNote}>
            Only team leaders can submit. Team must be marked complete first.
          </p>
        </div>
      </div>
    </div>
  );
}
