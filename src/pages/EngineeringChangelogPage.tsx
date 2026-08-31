import { useMemo, useState } from 'react';
import { NotebookPen } from 'lucide-react';
import { ApiError } from '../api/apiClient';
import {
  createEngineeringEntry,
  listEngineeringChangelog,
  listEngineeringDecisions,
  type CreateEngineeringEntryInput,
  type EngineeringEntry,
} from '../api/engineeringApi';
import { isPermissionDeniedError, PermissionDenied } from '../components/PermissionDenied';
import { PageIntro, Pill, SelectInput, SkeletonRows, Button, Field, TextInput, TextArea, DateInput } from '../components/ui';
import { useAsync } from '../lib/useAsync';

const REPOSITORIES = [
  'advisor_track_backend',
  'Advisor-Track-Dashboard',
  'advisortrack-demo-backend',
  'advisortrack-demo-frontend',
  'advisortrack-android',
] as const;

const ENTRY_TYPES = ['change', 'deployment', 'decision', 'correction'] as const;
const CHANGE_TYPES = [
  'Feature',
  'Fix',
  'Schema',
  'Refactor',
  'Deployment',
  'Configuration',
  'Documentation',
  'Test',
  'Security',
] as const;

function formatWhen(value: string): string {
  return new Date(value).toLocaleString('en-ZA');
}

function EntryBody({ entry, onCorrect }: { entry: EngineeringEntry; onCorrect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="card card-pad" style={{ marginBottom: 12 }}>
      <div className="row" style={{ justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <Pill tone="blue">{entry.entryType}</Pill>
            {entry.changeType ? <Pill tone="grey">{entry.changeType}</Pill> : null}
            {entry.environment ? <Pill tone="green">{entry.environment}</Pill> : null}
            {entry.area ? <span className="subtle">{entry.area}</span> : null}
          </div>
          <h3 style={{ margin: 0, fontSize: 16 }}>{entry.summary}</h3>
          <div className="subtle" style={{ marginTop: 6, fontSize: 12 }}>
            {formatWhen(entry.createdAt)} · {entry.authorName} · {entry.repository}
          </div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <Button type="button" variant="secondary" size="sm" onClick={() => setOpen((value) => !value)}>
            {open ? 'Hide detail' : 'Show detail'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onCorrect(entry.id)}>
            Add correction
          </Button>
        </div>
      </div>
      {open ? (
        <dl className="engineering-entry-detail">
          {entry.reason ? (
            <>
              <dt>Reason</dt>
              <dd>{entry.reason}</dd>
            </>
          ) : null}
          {entry.branch ? (
            <>
              <dt>Branch</dt>
              <dd>
                <code>{entry.branch}</code>
              </dd>
            </>
          ) : null}
          {entry.commitHash ? (
            <>
              <dt>Commit</dt>
              <dd>
                <code>{entry.commitHash}</code>
              </dd>
            </>
          ) : null}
          {entry.migrationRefs.length ? (
            <>
              <dt>Migrations</dt>
              <dd>{entry.migrationRefs.join(', ')}</dd>
            </>
          ) : null}
          {entry.compatibilityNotes ? (
            <>
              <dt>Compatibility</dt>
              <dd>{entry.compatibilityNotes}</dd>
            </>
          ) : null}
          {entry.risksDependencies ? (
            <>
              <dt>Risks / dependencies</dt>
              <dd>{entry.risksDependencies}</dd>
            </>
          ) : null}
          {entry.tests ? (
            <>
              <dt>Tests</dt>
              <dd>{entry.tests}</dd>
            </>
          ) : null}
          {entry.relatedEntryId ? (
            <>
              <dt>Related entry</dt>
              <dd>
                <code>{entry.relatedEntryId}</code>
              </dd>
            </>
          ) : null}
        </dl>
      ) : null}
    </article>
  );
}

const emptyForm = (): CreateEngineeringEntryInput => ({
  entryType: 'change',
  repository: 'advisor_track_backend',
  changeType: 'Feature',
  summary: '',
  area: '',
  branch: '',
  commitHash: '',
  environment: 'local',
  reason: '',
  tests: '',
  compatibilityNotes: '',
  risksDependencies: '',
});

export default function EngineeringChangelogPage() {
  const [filters, setFilters] = useState({
    repository: '',
    area: '',
    entryType: '',
    environment: '',
    changeType: '',
    author: '',
    createdFrom: '',
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CreateEngineeringEntryInput>(emptyForm);
  const [relatedEntryId, setRelatedEntryId] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const decisions = useAsync(() => listEngineeringDecisions(), [reloadKey]);
  const changelog = useAsync(
    () =>
      listEngineeringChangelog({
        repository: filters.repository || undefined,
        area: filters.area || undefined,
        entryType: filters.entryType || undefined,
        environment: filters.environment || undefined,
        changeType: filters.changeType || undefined,
        author: filters.author || undefined,
        createdFrom: filters.createdFrom ? new Date(filters.createdFrom).toISOString() : undefined,
      }),
    [filters, reloadKey]
  );

  const pinned = decisions.data?.decisions ?? [];
  const entries = changelog.data?.entries ?? [];
  const areas = useMemo(() => {
    const values = new Set<string>();
    for (const entry of entries) {
      if (entry.area) values.add(entry.area);
    }
    return [...values].sort();
  }, [entries]);

  async function submit(kind: 'change' | 'correction') {
    setSaving(true);
    setFormError(null);
    try {
      const entryType = kind === 'correction' ? 'correction' : form.entryType;
      const payload: CreateEngineeringEntryInput = {
        ...form,
        entryType,
        area: form.area || undefined,
        branch: form.branch || undefined,
        commitHash: form.commitHash || undefined,
        reason: form.reason || undefined,
        tests: form.tests || undefined,
        compatibilityNotes: form.compatibilityNotes || undefined,
        risksDependencies: form.risksDependencies || undefined,
        relatedEntryId: entryType === 'correction' ? relatedEntryId : undefined,
      };
      await createEngineeringEntry(payload);
      setForm(emptyForm());
      setRelatedEntryId('');
      setFormOpen(false);
      setReloadKey((value) => value + 1);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Unable to save the entry.');
    } finally {
      setSaving(false);
    }
  }

  function startCorrection(id: string) {
    setRelatedEntryId(id);
    setForm((current) => ({ ...current, entryType: 'correction' }));
    setFormOpen(true);
  }

  if (isPermissionDeniedError(decisions.error) || isPermissionDeniedError(changelog.error)) {
    return <PermissionDenied />;
  }

  if ((decisions.loading || changelog.loading) && !changelog.data && !decisions.data) {
    return <SkeletonRows rows={8} cols={4} />;
  }

  return (
    <>
      <PageIntro>
        Internal engineering history for AdvisorTrack. Read pinned decisions before changing code. After a reviewed
        commit, add a Change entry. Do not include credentials, tokens, keys or secrets.
      </PageIntro>

      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <NotebookPen size={18} />
          <strong>Engineering Change Log</strong>
        </div>
        <Button type="button" variant="primary" onClick={() => setFormOpen((value) => !value)}>
          {formOpen ? 'Close form' : 'Add Change Entry'}
        </Button>
      </div>

      {formOpen ? (
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>Add entry</h3>
          <p className="subtle" style={{ color: 'var(--red)' }}>
            Do not include credentials, tokens, keys or secrets in the Engineering Change Log.
          </p>
          <div className="form-grid cols-2">
            <Field label="Entry type">
              <SelectInput
                value={form.entryType}
                onChange={(event) => setForm((current) => ({ ...current, entryType: event.target.value as EngineeringEntry['entryType'] }))}
              >
                {ENTRY_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Repository">
              <SelectInput
                value={form.repository}
                onChange={(event) => setForm((current) => ({ ...current, repository: event.target.value }))}
              >
                {REPOSITORIES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Change type">
              <SelectInput
                value={form.changeType ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, changeType: event.target.value }))}
              >
                {CHANGE_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Environment">
              <SelectInput
                value={form.environment ?? ''}
                onChange={(event) => setForm((current) => ({ ...current, environment: event.target.value }))}
              >
                <option value="local">local</option>
                <option value="production">production</option>
                <option value="demo">demo</option>
              </SelectInput>
            </Field>
            <Field label="Summary">
              <TextInput value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} />
            </Field>
            <Field label="Area">
              <TextInput value={form.area ?? ''} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))} />
            </Field>
            <Field label="Branch">
              <TextInput value={form.branch ?? ''} onChange={(event) => setForm((current) => ({ ...current, branch: event.target.value }))} />
            </Field>
            <Field label="Commit hash">
              <TextInput value={form.commitHash ?? ''} onChange={(event) => setForm((current) => ({ ...current, commitHash: event.target.value }))} />
            </Field>
          </div>
          <Field label="Reason">
            <TextArea rows={3} value={form.reason ?? ''} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} />
          </Field>
          <Field label="Compatibility notes">
            <TextArea
              rows={2}
              value={form.compatibilityNotes ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, compatibilityNotes: event.target.value }))}
            />
          </Field>
          <Field label="Risks / dependencies">
            <TextArea
              rows={2}
              value={form.risksDependencies ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, risksDependencies: event.target.value }))}
            />
          </Field>
          <Field label="Tests">
            <TextInput value={form.tests ?? ''} onChange={(event) => setForm((current) => ({ ...current, tests: event.target.value }))} />
          </Field>
          <Field label="Related entry id (required for Add correction)" hint="Paste the id of the entry being corrected.">
            <TextInput value={relatedEntryId} onChange={(event) => setRelatedEntryId(event.target.value)} />
          </Field>
          {formError ? <p className="subtle" style={{ color: 'var(--red)' }}>{formError}</p> : null}
          <div className="row" style={{ gap: 8, marginTop: 12 }}>
            <Button type="button" variant="primary" disabled={saving} onClick={() => void submit('change')}>
              {saving ? 'Saving…' : 'Save entry'}
            </Button>
            <Button type="button" variant="secondary" disabled={saving || !relatedEntryId} onClick={() => void submit('correction')}>
              Add correction
            </Button>
          </div>
        </div>
      ) : null}

      <h2 style={{ fontSize: 18, marginBottom: 10 }}>Pinned Engineering Decisions</h2>
      {pinned.length === 0 ? (
        <div className="card card-pad" style={{ marginBottom: 20 }}>
          <div className="empty">No active pinned decisions.</div>
        </div>
      ) : (
        <div className="grid grid-2" style={{ marginBottom: 24 }}>
          {pinned.map((decision) => (
            <div key={decision.id} className="card card-pad">
              <Pill tone="blue">decision</Pill>
              <h3 style={{ margin: '8px 0 6px', fontSize: 16 }}>{decision.summary}</h3>
              <p className="subtle" style={{ marginTop: 0 }}>{decision.reason}</p>
              <div className="subtle" style={{ fontSize: 12 }}>
                {formatWhen(decision.createdAt)} · {decision.authorName}
                {decision.supersedesEntryId ? ' · supersedes a previous decision' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 18, marginBottom: 10 }}>Recent Changes</h2>
      <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <SelectInput value={filters.repository} onChange={(event) => setFilters((current) => ({ ...current, repository: event.target.value }))}>
          <option value="">All repositories</option>
          {REPOSITORIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={filters.entryType} onChange={(event) => setFilters((current) => ({ ...current, entryType: event.target.value }))}>
          <option value="">All entry types</option>
          {ENTRY_TYPES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={filters.environment} onChange={(event) => setFilters((current) => ({ ...current, environment: event.target.value }))}>
          <option value="">All environments</option>
          <option value="production">production</option>
          <option value="local">local</option>
          <option value="demo">demo</option>
        </SelectInput>
        <SelectInput value={filters.area} onChange={(event) => setFilters((current) => ({ ...current, area: event.target.value }))}>
          <option value="">All areas</option>
          {areas.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={filters.changeType} onChange={(event) => setFilters((current) => ({ ...current, changeType: event.target.value }))}>
          <option value="">All change types</option>
          {CHANGE_TYPES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </SelectInput>
        <TextInput
          placeholder="Author"
          value={filters.author}
          onChange={(event) => setFilters((current) => ({ ...current, author: event.target.value }))}
        />
        <DateInput
          value={filters.createdFrom}
          onChange={(event) => setFilters((current) => ({ ...current, createdFrom: event.target.value }))}
          title="Created from"
        />
      </div>

      {entries.length === 0 ? (
        <div className="card card-pad">
          <div className="empty">No matching engineering entries.</div>
        </div>
      ) : (
        entries.map((entry) => <EntryBody key={entry.id} entry={entry} onCorrect={startCorrection} />)
      )}
    </>
  );
}
