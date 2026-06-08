import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound } from 'lucide-react';
import { authService } from '../../services/services';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error sending reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.centeredPage}>
      <div className={styles.centeredCard}>
        <div className={styles.iconCircle}><KeyRound size={28} /></div>
        <h2 className={styles.formTitle}>{sent ? 'Check your email' : 'Reset password'}</h2>
        <p className={styles.formSub} style={{ marginTop: 8, marginBottom: 28 }}>
          {sent
            ? `We sent a reset link to ${email}. Check your inbox.`
            : 'Enter your email and we\'ll send you a reset link.'}
        </p>

        {!sent && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <div className={styles.inputWrap}>
                <Mail size={16} className={styles.icon} />
                <input
                  type="email"
                  className={styles.input}
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <span className={styles.btnSpinner} /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className={styles.switchText} style={{ marginTop: 20 }}>
          <Link to="/login" className={styles.switchLink}>← Back to login</Link>
        </p>
      </div>
    </div>
  );
}
