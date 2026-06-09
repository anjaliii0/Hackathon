import { useState, useEffect } from 'react';
import { Award, Download, Star, CheckCircle, Loader2 } from 'lucide-react';
import { studentService } from '../../services/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import styles from './Certificates.module.css';

const TYPE_META = {
  winner:        { color: '#d4a853', label: 'Winner' },
  finalist:      { color: '#6A89A7', label: 'Finalist' },
  participation: { color: '#6aaa8a', label: 'Participation' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

// Render a certificate into a print window → user saves as PDF (no deps).
function printCertificate(cert, recipientName) {
  const meta = TYPE_META[cert.type] || TYPE_META.participation;
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const issuer = cert.hackathon?.organizer?.name || 'HackPortal';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Certificate</title>
    <style>
      @page { size: A4 landscape; margin: 0; }
      body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #2c3a47; }
      .cert { width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; background: #f8f9fc; }
      .border { width: 86%; height: 80%; border: 3px double ${meta.color}; border-radius: 12px; padding: 48px; text-align: center;
        display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; box-shadow: 0 8px 40px rgba(56,73,89,.12); position: relative; }
      .seal { position: absolute; top: 28px; right: 36px; width: 54px; height: 54px; border-radius: 50%; background: ${meta.color}; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 26px; }
      .eyebrow { letter-spacing: 4px; text-transform: uppercase; font-size: 13px; color: ${meta.color}; margin: 0 0 18px; }
      h1 { font-size: 40px; margin: 0 0 14px; color: #384959; font-weight: 600; }
      h2 { font-size: 26px; margin: 8px 0 22px; color: #6A89A7; font-style: italic; }
      .body { font-size: 16px; color: #5a6a78; margin: 0; max-width: 560px; }
      .meta { font-size: 12px; color: #8a9baa; margin-top: 30px; }
    </style></head><body>
    <div class="cert"><div class="border">
      <div class="seal">★</div>
      <p class="eyebrow">Certificate of ${esc(meta.label)}</p>
      <h1>${esc(recipientName)}</h1>
      <p class="body">has been awarded this certificate${cert.awardTitle ? ` as <strong>${esc(cert.awardTitle)}</strong>` : ''} for participation in</p>
      <h2>${esc(cert.hackathon?.title || 'Hackathon')}</h2>
      <p class="meta">Issued by ${esc(issuer)} · Certificate ID: ${esc(cert.certificateId)} · ${esc(fmtDate(cert.issuedAt || cert.createdAt))}</p>
    </div></div>
    <script>window.onload = function(){ window.print(); }</script></body></html>`;
  const w = window.open('', '_blank');
  if (!w) return toast.error('Allow pop-ups to download the certificate');
  w.document.write(html);
  w.document.close();
}

export default function Certificates() {
  const { user } = useAuth();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentService.getCertificates()
      .then(res => setCerts(res.data.data || []))
      .catch(() => toast.error('Failed to load certificates'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Certificates</h1>
        <p className={styles.subtitle}>{loading ? 'Loading…' : `${certs.length} certificate${certs.length === 1 ? '' : 's'} earned`}</p>
      </div>

      {loading ? (
        <div className={styles.empty}><Loader2 size={28} className={styles.spinner} /></div>
      ) : certs.length === 0 ? (
        <div className={styles.empty}>
          <Award size={48} style={{ opacity: 0.2 }} />
          <p>No certificates yet. Start participating in hackathons!</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {certs.map(cert => {
            const meta = TYPE_META[cert.type] || TYPE_META.participation;
            const isWinner = cert.type === 'winner';
            return (
              <div key={cert._id} className={styles.certCard} style={{ '--cert-color': meta.color }}>
                <div className={styles.certHeader}>
                  <div className={styles.certIconWrap}>
                    {isWinner ? <Star size={24} fill="currentColor" /> : <CheckCircle size={24} />}
                  </div>
                  <span className={`${styles.certBadge} ${isWinner ? styles.winner : styles.participant}`}>
                    {cert.awardTitle ? `🏆 ${cert.awardTitle}` : meta.label}
                  </span>
                </div>

                <div className={styles.certBody}>
                  <p className={styles.certLabel}>This certifies that</p>
                  <h2 className={styles.certName}>{user?.name || 'Participant'}</h2>
                  <p className={styles.certDetails}>successfully participated in</p>
                  <h3 className={styles.certHack}>{cert.hackathon?.title || 'Hackathon'}</h3>
                  <p className={styles.certMeta}>
                    Organized by {cert.hackathon?.organizer?.name || 'HackPortal'} · {fmtDate(cert.issuedAt || cert.createdAt)}
                  </p>
                </div>

                <div className={styles.certFooter}>
                  <div className={styles.certSeal}>
                    <Award size={18} />
                    <span>{cert.certificateId}</span>
                  </div>
                  <button className={styles.downloadBtn} onClick={() => printCertificate(cert, user?.name || 'Participant')}>
                    <Download size={15} /> Download PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
