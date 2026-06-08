import { Award, Download, Star, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Certificates.module.css';

const MOCK_CERTS = [
  { id: '1', type: 'winner', hackathon: 'HackNITR 4.0', rank: 1, date: '2025-03-10', issuer: 'NIT Rourkela', color: '#d4a853' },
  { id: '2', type: 'participation', hackathon: 'Smart India Hackathon 2024', rank: null, date: '2024-09-15', issuer: 'MoE India', color: '#6A89A7' },
  { id: '3', type: 'participation', hackathon: 'Google Solution Challenge 2024', rank: null, date: '2024-06-20', issuer: 'Google', color: '#6aaa8a' },
];

export default function Certificates() {
  const handleDownload = (cert) => {
    toast.success(`Downloading ${cert.hackathon} certificate…`);
    // In production: fetch PDF from backend and trigger download
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Certificates</h1>
        <p className={styles.subtitle}>{MOCK_CERTS.length} certificates earned</p>
      </div>

      <div className={styles.grid}>
        {MOCK_CERTS.map(cert => (
          <div key={cert.id} className={styles.certCard} style={{ '--cert-color': cert.color }}>
            <div className={styles.certHeader}>
              <div className={styles.certIconWrap}>
                {cert.type === 'winner' ? <Star size={24} fill="currentColor" /> : <CheckCircle size={24} />}
              </div>
              <span className={`${styles.certBadge} ${cert.type === 'winner' ? styles.winner : styles.participant}`}>
                {cert.type === 'winner' ? `🏆 Winner – Rank #${cert.rank}` : 'Participation'}
              </span>
            </div>

            <div className={styles.certBody}>
              <p className={styles.certLabel}>This certifies that</p>
              <h2 className={styles.certName}>Anjali Sharma</h2>
              <p className={styles.certDetails}>successfully participated in</p>
              <h3 className={styles.certHack}>{cert.hackathon}</h3>
              <p className={styles.certMeta}>Organized by {cert.issuer} · {cert.date}</p>
            </div>

            <div className={styles.certFooter}>
              <div className={styles.certSeal}>
                <Award size={18} />
                <span>Verified</span>
              </div>
              <button className={styles.downloadBtn} onClick={() => handleDownload(cert)}>
                <Download size={15} /> Download PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {MOCK_CERTS.length === 0 && (
        <div className={styles.empty}>
          <Award size={48} style={{ opacity: 0.2 }} />
          <p>No certificates yet. Start participating in hackathons!</p>
        </div>
      )}
    </div>
  );
}
