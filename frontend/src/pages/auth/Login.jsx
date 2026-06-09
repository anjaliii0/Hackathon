import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService, homeService } from '../../services/services';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

const money = (n) => !n ? '—' : n >= 100000 ? `₹${(n / 100000).toFixed(0)}L+` : n >= 1000 ? `₹${(n / 1000).toFixed(0)}K+` : `₹${n}`;
const compact = (n) => !n ? '0' : n >= 1000 ? `${(n / 1000).toFixed(1)}K+` : `${n}+`;

export default function Login() {
  const [form, setForm]     = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats]   = useState(null);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  // Real platform stats for the decorative panel
  useEffect(() => {
    homeService.getHomeData()
      .then(res => setStats(res.data.data.stats))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authService.login(form);
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`Welcome back, ${user.name}!`);
      // Route based on role
      if (user.role === 'admin')                              navigate('/admin');
      else if (user.role === 'college' || user.role === 'company') navigate('/organizer');
      else                                                    navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.decorPanel}>
        <div className={styles.decorContent}>
          <div className={styles.logoLarge}><Trophy size={32} /></div>
          <h1 className={styles.decorTitle}>HackPortal</h1>
          <p className={styles.decorSub}>Where ideas become innovations</p>
          <div className={styles.decorStats}>
            <div className={styles.stat}><span>{compact(stats?.hackathons)}</span><p>Hackathons</p></div>
            <div className={styles.stat}><span>{compact(stats?.students)}</span><p>Students</p></div>
            <div className={styles.stat}><span>{money(stats?.prizePool)}</span><p>Prizes</p></div>
          </div>
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Welcome back</h2>
            <p className={styles.formSub}>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Email address</label>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.icon} />
                <input type="email" className={styles.input}
                  placeholder="you@example.com" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Password</label>
                <Link to="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
              </div>
              <div className={styles.inputWrap}>
                <Lock size={16} className={styles.icon} />
                <input type={showPwd ? 'text' : 'password'} className={styles.input}
                  placeholder="••••••••" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd(p => !p)}>
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.btnSpinner} /> : 'Sign In'}
            </button>
          </form>

          <p className={styles.switchText}>
            New here?{' '}
            <Link to="/register" className={styles.switchLink}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
