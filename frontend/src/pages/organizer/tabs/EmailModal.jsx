import { useState } from 'react';
import { X, Loader2, Send } from 'lucide-react';
import { organizerService } from '../../../services/services';
import toast from 'react-hot-toast';
import s from '../Organizer.module.css';

// target: 'single' | 'team' | 'all'  ·  ref: recipientId or teamId
export default function EmailModal({ hackathonId, target, refId, label, onClose }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return toast.error('Subject and message required');
    setSending(true);
    try {
      const payload = { target, subject, message };
      if (target === 'single') payload.recipientId = refId;
      if (target === 'team') payload.teamId = refId;
      const res = await organizerService.emailParticipants(hackathonId, payload);
      toast.success(res.data.message || 'Message sent');
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSending(false); }
  };

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        <div className={s.modalHead}>
          <h3 className={s.modalTitle}>Message {label}</h3>
          <button className={s.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <form className={s.form} onSubmit={send}>
          <div className={s.field}>
            <label className={s.label}>Subject</label>
            <input className={s.input} value={subject} onChange={e => setSubject(e.target.value)} required />
          </div>
          <div className={s.field}>
            <label className={s.label}>Message</label>
            <textarea className={s.textarea} style={{ minHeight: 120 }} value={message} onChange={e => setMessage(e.target.value)} required />
          </div>
          <p className={s.hint}>Delivered as an in-app notification to recipients.</p>
          <div className={s.modalActions}>
            <button type="button" className={s.btn} onClick={onClose}>Cancel</button>
            <button type="submit" className={`${s.btn} ${s.btnPrimary}`} disabled={sending}>
              {sending ? <Loader2 size={15} className={s.spinner} /> : <Send size={15} />} Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
