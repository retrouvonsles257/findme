import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NGOLayout } from './NGOLayout';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { getResultatsIA, type ResultatIA } from '../../features/ia-analysis/services/iaAPI';
import { confirmIAResult, rejectIAResult, markNeedsVerification } from '../../features/ia-analysis';

type StatusFilter = 'all' | ResultatIA['statut_validation'];

export const NGOIAAnalysisPage: React.FC = () => {
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as any)?.id as string | undefined;

  const [results, setResults] = useState<ResultatIA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusFilter>('en_attente');
  const [minScore, setMinScore] = useState(70);
  const [selected, setSelected] = useState<ResultatIA | null>(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getResultatsIA();
      setResults(data);
    } catch (e: any) {
      setError(e?.message || 'Erreur chargement IA');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return results.filter((r) => {
      const okStatus = status === 'all' ? true : r.statut_validation === status;
      const okScore = (r.score_confiance || 0) >= minScore;
      return okStatus && okScore;
    });
  }, [results, status, minScore]);

  const stats = useMemo(() => {
    const total = results.length;
    const pending = results.filter((r) => r.statut_validation === 'en_attente').length;
    const confirmed = results.filter((r) => r.statut_validation === 'confirme').length;
    const rejected = results.filter((r) => r.statut_validation === 'infirme').length;
    const needs = results.filter((r) => r.statut_validation === 'necessite_verification').length;
    return { total, pending, confirmed, rejected, needs };
  }, [results]);

  const runAction = useCallback(
    async (kind: 'confirm' | 'reject' | 'needs') => {
      if (!selected) return;
      if (!userId) {
        setError('Vous devez être connecté');
        return;
      }

      try {
        setActionLoading(true);
        setError(null);

        if (kind === 'confirm') {
          await confirmIAResult(selected.id, userId, comment || undefined);
        } else if (kind === 'reject') {
          await rejectIAResult(selected.id, userId, comment || undefined);
        } else {
          await markNeedsVerification(selected.id, userId, comment || undefined);
        }

        setSelected(null);
        setComment('');
        await load();
      } catch (e: any) {
        setError(e?.message || 'Erreur action IA');
      } finally {
        setActionLoading(false);
      }
    },
    [comment, load, selected, userId],
  );

  return (
    <NGOLayout title="IA (ONG)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {error && (
          <div style={{ padding: 12, borderRadius: 10, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
          {[
            ['Total', stats.total],
            ['En attente', stats.pending],
            ['Confirmés', stats.confirmed],
            ['Infimés', stats.rejected],
            ['À vérifier', stats.needs],
          ].map(([label, value]) => (
            <div key={String(label)} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{value as any}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={load}
            style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb' }}
            disabled={loading}
          >
            {loading ? 'Chargement…' : 'Rafraîchir'}
          </button>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            Statut:
            <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="all">Tous</option>
              <option value="en_attente">En attente</option>
              <option value="confirme">Confirmé</option>
              <option value="infirme">Infirme</option>
              <option value="incertain">Incertain</option>
              <option value="necessite_verification">Nécessite vérification</option>
            </select>
          </label>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            Score min:
            <input
              type="number"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value || '0', 10))}
              style={{ width: 90 }}
            />
          </label>
        </div>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb', fontWeight: 700 }}>
            Résultats ({filtered.length})
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: 12, color: '#6b7280' }}>Aucun résultat.</div>
          ) : (
            <div>
              {filtered.slice(0, 50).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelected(r)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: 12,
                    border: 'none',
                    borderBottom: '1px solid #f3f4f6',
                    background: selected?.id === r.id ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ fontWeight: 700 }}>
                      {r.type_analyse} • {Math.round(r.score_confiance)}%
                    </div>
                    <div style={{ color: '#6b7280' }}>{r.statut_validation}</div>
                  </div>
                  <div style={{ color: '#6b7280', marginTop: 4, fontSize: 12 }}>
                    dossier: {r.id_dossier || '—'} • signalement: {r.id_signalement || '—'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontWeight: 800 }}>
                Action sur résultat • {selected.type_analyse} • {Math.round(selected.score_confiance)}%
              </div>
              <button type="button" onClick={() => setSelected(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                Fermer
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#6b7280' }}>Commentaire (optionnel)</label>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ width: '100%', borderRadius: 10, border: '1px solid #d1d5db', padding: 10 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => runAction('confirm')}
                style={{ padding: '10px 12px', borderRadius: 10, border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer' }}
              >
                Confirmer
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => runAction('reject')}
                style={{ padding: '10px 12px', borderRadius: 10, border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer' }}
              >
                Infirmer
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => runAction('needs')}
                style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer' }}
              >
                Marquer “à vérifier”
              </button>
            </div>
          </div>
        )}
      </div>
    </NGOLayout>
  );
};

