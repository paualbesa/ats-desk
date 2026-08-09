import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { buildSessionHash, rustdeskWebUrl } from '@/config/desk';

export default function RemotePage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const password = params.get('password') ?? undefined;

  const src = useMemo(() => {
    const peer = String(id ?? '').replace(/\D/g, '').slice(0, 6);
    if (peer.length < 6) return null;
    return rustdeskWebUrl(buildSessionHash(peer, password));
  }, [id, password]);

  if (!src) {
    return (
      <div className="remote-shell">
        <div className="remote-top">
          <Link to="/">← Volver</Link>
          <span>ID inválido</span>
        </div>
      </div>
    );
  }

  return (
    <div className="remote-shell">
      <div className="remote-top">
        <Link to="/" style={{ color: '#fff', fontWeight: 600 }}>← Volver</Link>
        <span style={{ fontWeight: 700, letterSpacing: '0.1em' }}>{id}</span>
      </div>
      <iframe title="ATS Desk remoto" className="remote-frame" src={src} allow="fullscreen" />
    </div>
  );
}
