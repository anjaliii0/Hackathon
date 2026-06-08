import { useState, useEffect, useCallback } from 'react';
import { Loader2, Award, Sparkles, Printer, Download } from 'lucide-react';
import { organizerService } from '../../../services/services';
import toast from 'react-hot-toast';
import s from '../Organizer.module.css';

const TYPE_BADGE = { participation: s.badgeGray, finalist: s.badgeBlue, winner: s.badgeYellow };

// Render certificates into a print window → user saves as PDF.
function printCertificates(certs, hackathonTitle) {
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const cards = certs.map(c => `
    <div class="cert">
      <div class="border">
        <div class="seal">★</div>
        <p class="eyebrow">Certificate of ${esc(c.type)}</p>
        <h1>${esc(c.recipient?.name || 'Participant')}</h1>
        <p class="body">has been awarded this certificate${c.awardTitle ? ` as <strong>${esc(c.awardTitle)}</strong>` : ''}
          for participation in</p>
        <h2>${esc(hackathonTitle)}</h2>
        <p class="meta">Certificate ID: ${esc(c.certificateId)} &nbsp;·&nbsp; Issued ${new Date(c.issuedAt || c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
    </div>`).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Certificates</title>
    <style>
      @page { size: A4 landscape; margin: 0; }
      body { margin: 0; font-family: Georgia, 'Times New Roman', serif; color: #2c3a47; }
      .cert { width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; page-break-after: always; background: #f8f9fc; }
      .border { width: 86%; height: 80%; border: 3px double #6A89A7; border-radius: 12px; padding: 48px; text-align: center;
        display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; box-shadow: 0 8px 40px rgba(56,73,89,.12); position: relative; }
      .seal { position: absolute; top: 28px; right: 36px; width: 54px; height: 54px; border-radius: 50%; background: #BDDDFC; color: #384959; display: flex; align-items: center; justify-content: center; font-size: 26px; }
      .eyebrow { letter-spacing: 4px; text-transform: uppercase; font-size: 13px; color: #6A89A7; margin: 0 0 18px; }
      h1 { font-size: 40px; margin: 0 0 14px; color: #384959; font-weight: 600; }
      h2 { font-size: 26px; margin: 8px 0 22px; color: #6A89A7; font-style: italic; }
      .body { font-size: 16px; color: #5a6a78; margin: 0; max-width: 540px; }
      .meta { font-size: 12px; color: #8a9baa; margin-top: 30px; }
    </style></head><body>${cards}
    <script>window.onload = function(){ window.print(); }</script></body></html>`;

  const w = window.open('', '_blank');
  if (!w) return toast.error('Allow pop-ups to print certificates');
  w.document.write(html);
  w.document.close();
}

export default function CertificatesTab({ hackathon, hackathonId }) {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    organizerService.getCertificates(hackathonId)
      .then(res => setCerts(res.data.data.certificates || []))
      .catch(() => toast.error('Failed to load certificates'))
      .finally(() => setLoading(false));
  }, [hackathonId]);
  useEffect(load, [load]);

  const generate = async () => {
    if (!confirm('Auto-generate certificates for all participants (and winners, if results are published)?')) return;
    setGenerating(true);
    try {
      const res = await organizerService.generateCertificates(hackathonId);
      toast.success(res.data.message || 'Certificates generated');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setGenerating(false); }
  };

  return (
    <div>
      <div className={s.cardHead}>
        <h3 className={s.cardTitle}>Certificates ({certs.length})</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {certs.length > 0 && (
            <button className={s.btn} onClick={() => printCertificates(certs, hackathon.title)}>
              <Download size={15} /> Download All
            </button>
          )}
          <button className={`${s.btn} ${s.btnPrimary}`} onClick={generate} disabled={generating}>
            {generating ? <Loader2 size={15} className={s.spinner} /> : <Sparkles size={15} />} Auto-Generate
          </button>
        </div>
      </div>

      <p className={s.hint} style={{ marginBottom: 14 }}>
        Participation certificates go to every team member. Winner/finalist certificates are derived from published results.
        Use “Download All” to open a print view and save as PDF.
      </p>

      {loading ? (
        <div className={s.loading}><Loader2 size={24} className={s.spinner} /></div>
      ) : certs.length === 0 ? (
        <div className={s.empty}><Award size={36} style={{ opacity: 0.25 }} /><p>No certificates generated yet.</p></div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr><th>Recipient</th><th>Type</th><th>Award</th><th>Certificate ID</th><th>Issued</th><th></th></tr></thead>
            <tbody>
              {certs.map(c => (
                <tr key={c._id}>
                  <td><strong style={{ color: 'var(--navy)' }}>{c.recipient?.name || '—'}</strong><div className={s.hint}>{c.recipient?.email}</div></td>
                  <td><span className={`${s.badge} ${TYPE_BADGE[c.type]}`}>{c.type}</span></td>
                  <td>{c.awardTitle || '—'}</td>
                  <td className={s.hint}>{c.certificateId}</td>
                  <td className={s.hint}>{new Date(c.issuedAt || c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td><button className={`${s.btn} ${s.btnSm}`} onClick={() => printCertificates([c], hackathon.title)}><Printer size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
