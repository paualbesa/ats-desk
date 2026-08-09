import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { buildSessionHash, rustdeskWebUrl } from '@/config/desk';

export default function RemotePage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const password = params.get('password') ?? undefined;

  const src = useMemo(() => {
    const peer = String(id ?? '').replace(/\D/g, '').slice(0, 6);
    if (peer.length < 6) return null;
    const hash = buildSessionHash(peer, password);
    return rustdeskWebUrl(hash);
  }, [id, password]);

  if (!src) {
    return (
      <div className="card">
        <p>ID inválido.</p>
        <Link to="/">Volver</Link>
      </div>
    );
  }

  return (
  <>
      <div className="row" style={{ marginBottom: 12 }}>
        <Link to="/" className="btn btn-ghost" style={{ textDecoration: 'none' }}>← Volver</Link>
        <span className="meta">Sesión · {id}</span>
      </div>
      <iframe title="ATS Desk remoto" className="remote-frame" src={src} allow="fullscreen" />
    </>
  );
}
