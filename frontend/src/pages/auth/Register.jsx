import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, Trophy, GraduationCap, Building2, Code2 } from 'lucide-react';
import { authService } from '../../services/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

const ROLES = [
  {
    value: 'student',
    label: 'Student',
    sub: 'Participate in hackathons, form teams',
    icon: Code2,
  },
  {
    value: 'college',
    label: 'University',
    sub: 'Host hackathons for students',
    icon: GraduationCap,
  },
  {
    value: 'company',
    label: 'Company',
    sub: 'Sponsor & conduct industry hackathons',
    icon: Building2,
  },
];

export default function Register() {
  const [role, setRole]   = useState('student');
  const [form, setForm]   = useState({ name: '', email: '', password: '', confirmPwd: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPwd) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await authService.register({
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
        role,                       // 'student' | 'college' | 'company'
      });
      const { token, user } = res.data.data;
      login(token, user);
      toast.success('Account created! Please verify your email.');
      navigate('/verify-email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLES.find(r => r.value === role);

  return (
    <div className={styles.page}>
      <div className={styles.decorPanel}>
        <div className={styles.decorContent}>
          <div className={styles.logoLarge}><Trophy size={32} /></div>
          <h1 className={styles.decorTitle}>HackPortal</h1>
          <p className={styles.decorSub}>Join the innovation community</p>
          <div className={styles.decorSteps}>
            {['Choose your role', 'Create your account', 'Verify your email', 'Start building!'].map((s, i) => (
              <div key={i} className={styles.step}>
                <span className={styles.stepNum}>{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Create account</h2>
            <p className={styles.formSub}>Join HackPortal — choose how you want to participate</p>
          </div>

          {/* Role picker */}
          <div className={styles.rolePicker}>
            {ROLES.map(r => {
              const Icon = r.icon;
              return (
                <button
                  key={r.value}
                  type="button"
                  className={`${styles.roleCard} ${role === r.value ? styles.roleCardActive : ''}`}
                  onClick={() => setRole(r.value)}
                >
                  <Icon size={20} className={styles.roleIcon} />
                  <span className={styles.roleLabel}>{r.label}</span>
                  <span className={styles.roleSub}>{r.sub}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>
                {role === 'student' ? 'Full name' : role === 'college' ? 'University name' : 'Company name'}
              </label>
              <div className={styles.inputWrap}>
                <User size={16} className={styles.icon} />
                <input type="text" className={styles.input}
                  placeholder={
                    role === 'student'  ? 'Anjali Sharma' :
                    role === 'college'  ? 'IIT Delhi' : 'Infosys Ltd.'
                  }
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Email address</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.icon} />
                <input type="email" className={styles.input}
                  placeholder={
                    role === 'student'  ? 'you@university.edu' :
                    role === 'college'  ? 'admin@iitd.ac.in' : 'hr@company.com'
                  }
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.icon} />
                <input type={showPwd ? 'text' : 'password'} className={styles.input}
                  placeholder="Min. 8 characters" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={8} />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd(p => !p)}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Confirm password</label>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.icon} />
                <input type="password" className={styles.input}
                  placeholder="Repeat password" value={form.confirmPwd}
                  onChange={e => setForm(f => ({ ...f, confirmPwd: e.target.value }))} required />
              </div>
            </div>

            {(role === 'college' || role === 'company') && (
              <p className={styles.approvalNote}>
                ℹ️ {role === 'college' ? 'University' : 'Company'} accounts require admin approval before you can host hackathons.
              </p>
            )}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.btnSpinner} /> : `Create ${selectedRole?.label} Account`}
            </button>
          </form>

          <p className={styles.switchText}>
            Already have an account?{' '}
            <Link to="/login" className={styles.switchLink}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
