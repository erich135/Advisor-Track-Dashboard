import { useEffect, useState } from 'react';
import {
  forgetAllDexMemories,
  forgetDexMemory,
  getDexMemoryPreference,
  listDexMemories,
  setDexMemoryPreference,
  type DexMemoryFact,
} from '../../api/assistantApi';
import { ApiError } from '../../api/apiClient';
import { Button, ConfirmModal } from '../../components/ui';
import { DEX_MEMORY_CHANGED_EVENT } from '../../lib/dexConversationStorage';

const UNAVAILABLE_CODES = new Set([
  'MEMORY_FEATURE_DISABLED',
  'MEMORY_UNAVAILABLE',
  'MEMORY_ENCRYPTION_UNAVAILABLE',
]);

const UNAVAILABLE_COPY =
  'Persistent Dex memory is not currently available. Dex can still follow this visit. Facts are not saved across logins until this feature is enabled.';

function isUnavailableError(caught: unknown): boolean {
  return caught instanceof ApiError && UNAVAILABLE_CODES.has(caught.code);
}

function memoryError(caught: unknown, fallback: string): string {
  if (caught instanceof ApiError) {
    if (UNAVAILABLE_CODES.has(caught.code)) return UNAVAILABLE_COPY;
    if (caught.code === 'NO_COMPANY') return 'Dex memory needs an organisation.';
    return caught.message || fallback;
  }
  return fallback;
}

export default function DexMemorySettings() {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [facts, setFacts] = useState<DexMemoryFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'disable' | 'forget-all' | 'forget-one' | null>(null);
  const [pendingForgetId, setPendingForgetId] = useState<string | null>(null);

  async function load() {
    const preference = await getDexMemoryPreference();
    if (preference.available === false) {
      setAvailable(false);
      setEnabled(false);
      setFacts([]);
      return;
    }
    setAvailable(true);
    setEnabled(preference.enabled);
    if (!preference.enabled) {
      setFacts([]);
      return;
    }
    const list = await listDexMemories();
    setFacts(list.facts);
  }

  useEffect(() => {
    let cancelled = false;

    async function refresh(isInitial: boolean) {
      if (isInitial) setLoading(true);
      try {
        await load();
        if (!cancelled) setError(null);
      } catch (caught) {
        if (!cancelled) {
          if (isUnavailableError(caught)) {
            setAvailable(false);
            setEnabled(false);
            setFacts([]);
            setError(null);
          } else {
            setAvailable(false);
            setError(memoryError(caught, 'Dex memory could not be loaded.'));
          }
        }
      } finally {
        if (isInitial && !cancelled) setLoading(false);
      }
    }

    void refresh(true);
    function onChanged() {
      void refresh(false);
    }
    function onVisible() {
      if (document.visibilityState === 'visible') void refresh(false);
    }
    window.addEventListener(DEX_MEMORY_CHANGED_EVENT, onChanged);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener(DEX_MEMORY_CHANGED_EVENT, onChanged);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  async function onToggle(next: boolean) {
    if (!available) return;
    if (!next) {
      setConfirm('disable');
      return;
    }
    setBusy(true);
    setError(null);
    setBanner(null);
    try {
      const preference = await setDexMemoryPreference(true);
      setEnabled(preference.enabled);
      setBanner('Persistent Dex memory is on. Dex will only save facts you ask it to remember.');
      const list = await listDexMemories();
      setFacts(list.facts);
    } catch (caught) {
      if (isUnavailableError(caught)) {
        setAvailable(false);
        setEnabled(false);
        setFacts([]);
        setError(null);
      } else {
        setError(memoryError(caught, 'Dex memory could not be updated.'));
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable() {
    setConfirm(null);
    setBusy(true);
    setError(null);
    setBanner(null);
    try {
      const preference = await setDexMemoryPreference(false);
      setEnabled(preference.enabled);
      setFacts([]);
      setBanner('Persistent Dex memory is off and saved facts for this organisation have been cleared.');
    } catch (caught) {
      if (isUnavailableError(caught)) {
        setAvailable(false);
        setEnabled(false);
        setFacts([]);
        setError(null);
      } else {
        setError(memoryError(caught, 'Dex memory could not be updated.'));
      }
    } finally {
      setBusy(false);
    }
  }

  async function onForget(id: string) {
    if (!available) return;
    setPendingForgetId(id);
    setConfirm('forget-one');
  }

  async function confirmForgetOne() {
    const id = pendingForgetId;
    setConfirm(null);
    setPendingForgetId(null);
    if (!id || !available) return;
    setBusy(true);
    setError(null);
    setBanner(null);
    try {
      const result = await forgetDexMemory(id);
      if (!result.forgotten) {
        setError('That memory was already gone.');
      } else {
        setFacts((current) => current.filter((fact) => fact.id !== id));
        setBanner('That saved fact has been forgotten.');
      }
    } catch (caught) {
      if (isUnavailableError(caught)) {
        setAvailable(false);
        setEnabled(false);
        setFacts([]);
        setError(null);
      } else {
        setError(memoryError(caught, 'Dex could not forget that fact.'));
      }
    } finally {
      setBusy(false);
    }
  }

  async function confirmForgetAll() {
    setConfirm(null);
    if (!available) return;
    setBusy(true);
    setError(null);
    setBanner(null);
    try {
      const result = await forgetAllDexMemories();
      setFacts([]);
      setBanner(
        result.forgotten
          ? `Forgotten ${result.forgotten} saved ${result.forgotten === 1 ? 'fact' : 'facts'}.`
          : 'There were no saved facts to clear.',
      );
    } catch (caught) {
      if (isUnavailableError(caught)) {
        setAvailable(false);
        setEnabled(false);
        setFacts([]);
        setError(null);
      } else {
        setError(memoryError(caught, 'Dex could not clear saved facts.'));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="advisor-config-card" data-testid="dex-memory-settings">
      <h3>Dex Memory</h3>
      <p className="advisor-home-muted">
        Dex can remember a small number of facts you explicitly ask it to save — for example that you
        prefer concise answers, or that you speak Afrikaans. Memory is off until you turn it on. Facts
        are stored for you in this organisation only, encrypted, and never include client records or
        sensitive disclosures. Dex uses them only when they are relevant.
      </p>
      {loading ? <p className="advisor-home-muted">Loading Dex memory…</p> : null}
      {!loading && error ? <p className="advisor-config-error">{error}</p> : null}
      {!loading && !error && !available ? (
        <p className="advisor-home-muted" data-testid="dex-memory-unavailable">
          {UNAVAILABLE_COPY}
        </p>
      ) : null}
      {banner ? <p className="advisor-config-banner">{banner}</p> : null}
      {!loading && !error && available ? (
        <>
          <label className="advisor-config-check">
            <input
              type="checkbox"
              data-testid="dex-memory-toggle"
              checked={enabled}
              disabled={busy}
              onChange={(event) => void onToggle(event.target.checked)}
            />
            Remember facts I ask Dex to save, across logins on this organisation
          </label>
          {enabled ? (
            <>
              {facts.length === 0 ? (
                <p className="advisor-home-muted">No saved facts yet. Ask Dex to remember something.</p>
              ) : (
                <ul className="advisor-config-list" data-testid="dex-memory-facts">
                  {facts.map((fact) => (
                    <li key={fact.id}>
                      <span>{fact.text}</span>
                      <Button type="button" disabled={busy} onClick={() => void onForget(fact.id)}>
                        Forget
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="advisor-config-actions">
                <Button type="button" disabled={busy || facts.length === 0} onClick={() => setConfirm('forget-all')}>
                  Forget all facts
                </Button>
              </div>
            </>
          ) : null}
        </>
      ) : null}
      <ConfirmModal
        title={
          confirm === 'disable'
            ? 'Turn Dex memory off?'
            : confirm === 'forget-one'
              ? 'Forget this fact?'
              : 'Forget all saved facts?'
        }
        message={
          confirm === 'disable'
            ? 'Dex will stop saving facts and forget everything currently saved for this organisation. This visit’s chat stays until you start a new conversation.'
            : confirm === 'forget-one'
              ? 'Dex will forget this saved fact. This visit’s chat is unchanged.'
              : 'This forgets every saved Dex fact for you in this organisation. This visit’s chat is unchanged.'
        }
        open={confirm !== null && available}
        confirmLabel={confirm === 'disable' ? 'Turn off' : 'Forget'}
        onConfirm={() => {
          if (confirm === 'disable') void confirmDisable();
          else if (confirm === 'forget-one') void confirmForgetOne();
          else void confirmForgetAll();
        }}
        onClose={() => {
          setConfirm(null);
          setPendingForgetId(null);
        }}
      />
    </section>
  );
}
