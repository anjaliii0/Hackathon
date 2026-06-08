import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { authService } from '../../services/services';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

export default function VerifyEmail() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);
  const navigate = useNavigate();

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length < 6) { toast.error('Enter all 6 digits'); return; }
    setLoading(true);
    try {
      await authService.verifyEmail(fullCode);
      toast.success('Email verified successfully!');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authService.resendVerification();
      toast.success('Verification code resent!');
    } catch {
      toast.error('Could not resend code');
    }
  };

  return (
    <div className={styles.centeredPage}>
      <div className={styles.centeredCard}>
        <div className={styles.iconCircle}><MailCheck size={28} /></div>
        <h2 className={styles.formTitle}>Verify your email</h2>
        <p className={styles.formSub} style={{ marginTop: 8 }}>
          We sent a 6-digit code to your email. Enter it below.
        </p>

        <form onSubmit={handleSubmit}>
          <div className={styles.otpRow}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => refs.current[i] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={styles.otpInput}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
              />
            ))}
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? <span className={styles.btnSpinner} /> : 'Verify Email'}
          </button>
        </form>

        <button className={styles.resendBtn} onClick={handleResend}>
          Didn't receive it? Resend code
        </button>
      </div>
    </div>
  );
}
