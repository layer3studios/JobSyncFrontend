'use client';
// FILE: settings/assignments/parts/AssignmentsTable.tsx
// The library table. Structure mirrors settings/team/parts/TeamMembersTable.tsx —
// same cell styles, same EmptyState-on-zero-rows, same role-derived action gating.
//
// THE EDIT CONTROL IS NEVER HIDDEN. When a task is in use it renders DISABLED with
// the reason in visible text beside it, plus a Clone button. Hiding it would make
// the capability undiscoverable — someone would conclude the product cannot edit
// assignments at all — and disabling it silently makes the page feel broken. The
// same rule applies to role gating: an Interviewer sees Create disabled with a
// reason, not an absent button.

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/feedback';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  canEditAssignment, canCloneAssignment, canArchiveAssignment,
} from '@/lib/team-permissions';
import type { Role } from '@/types/employer-team';
import type { EmployerAssignment, AssignmentUsage } from '@/types/employer-assignments';

const cell: React.CSSProperties = { padding: '12px 14px', textAlign: 'left', verticalAlign: 'middle', fontSize: '0.875rem', color: 'var(--ink)' };
const headCell: React.CSSProperties = { ...cell, fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', background: 'var(--surface-sunken)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };
const reasonStyle: React.CSSProperties = { fontSize: '0.72rem', color: 'var(--ink-muted)', margin: '4px 0 0', lineHeight: 1.45, maxWidth: 260 };

/** The single source of the in-use sentence, so the table and the modal never drift. */
export function inUseReason(count: number): string {
  return `In use by ${count} ${count === 1 ? 'posting' : 'postings'}. `
    + 'Editing is locked so candidates answering it all see the same task. Clone it to make changes.';
}

const ROLE_REASON = {
  edit: 'Only Members and above can edit assignments.',
  clone: 'Only Members and above can clone assignments.',
  archive: 'Only Owners can archive assignments.',
} as const;

interface Props {
  assignments: EmployerAssignment[];
  usageByAssignmentId: Record<string, AssignmentUsage[]>;
  currentRole: Role;
  showArchived: boolean;
  busyId: string | null;
  onToggleArchived: (next: boolean) => void;
  onCreate: () => void;
  onEdit: (assignment: EmployerAssignment) => void;
  onView: (assignment: EmployerAssignment) => void;
  onClone: (assignment: EmployerAssignment) => void;
  onArchive: (assignment: EmployerAssignment) => void;
  onUnarchive: (assignment: EmployerAssignment) => void;
}

/** Count with the posting titles behind a native <details> expander. */
function UsedByCell({ usage }: { usage: AssignmentUsage[] }) {
  if (usage.length === 0) return <span style={{ color: 'var(--ink-muted)' }}>—</span>;
  return (
    <details>
      <summary style={{ cursor: 'pointer', color: 'var(--link)' }}>
        {`${usage.length} ${usage.length === 1 ? 'posting' : 'postings'}`}
      </summary>
      <ul style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
        {usage.map((job) => (
          <li key={job.id}>{job.title ?? 'Untitled posting'}{job.status ? ` · ${job.status}` : ''}</li>
        ))}
      </ul>
    </details>
  );
}

export default function AssignmentsTable({
  assignments, usageByAssignmentId, currentRole, showArchived, busyId,
  onToggleArchived, onCreate, onEdit, onView, onClone, onArchive, onUnarchive,
}: Props) {
  const visible = showArchived ? assignments : assignments.filter((a) => !a.archivedAt);

  const mayEdit = canEditAssignment(currentRole);
  const mayClone = canCloneAssignment(currentRole);
  const mayArchive = canArchiveAssignment(currentRole);

  const archivedToggle = (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
      <input type="checkbox" checked={showArchived} onChange={(e) => onToggleArchived(e.target.checked)} />
      Show archived
    </label>
  );

  if (visible.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>{archivedToggle}</div>
        <EmptyState
          heading="No assignments yet"
          description="Create a reusable take-home task you can attach to any posting."
          action={<Button onClick={onCreate}>Create your first assignment</Button>}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>{archivedToggle}</div>
      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th scope="col" style={headCell}>Title</th>
              <th scope="col" style={headCell}>Est. hours</th>
              <th scope="col" style={headCell}>Accepts</th>
              <th scope="col" style={headCell}>Used by</th>
              <th scope="col" style={headCell}>Status</th>
              <th scope="col" style={{ ...headCell, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((assignment, i) => {
              const usage = usageByAssignmentId[assignment.id] ?? [];
              const inUse = usage.length > 0;
              const isArchived = !!assignment.archivedAt;
              const border = i === visible.length - 1 ? 'none' : '1px solid var(--border)';
              const fileTypes = assignment.allowedFileTypes ?? [];
              const busy = busyId === assignment.id;

              // Precedence matters: the in-use lock applies to EVERY role, so it is
              // reported ahead of the role reason. Telling a Member "only Owners can
              // do this" when the real blocker is usage would send them to the wrong
              // person.
              const editBlockedReason = inUse
                ? inUseReason(usage.length)
                : !mayEdit ? ROLE_REASON.edit
                  : isArchived ? 'Unarchive this assignment before editing it.'
                    : null;
              const archiveBlockedReason = !mayArchive
                ? ROLE_REASON.archive
                : (inUse && !isArchived)
                  ? `In use by ${usage.length} ${usage.length === 1 ? 'posting' : 'postings'}. Detach it from them before archiving.`
                  : null;

              return (
                <tr key={assignment.id}>
                  <td style={{ ...cell, borderBottom: border }}>
                    <div style={{ fontWeight: 500 }}>{assignment.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', maxWidth: 380 }}>
                      {assignment.publicSummary}
                    </div>
                  </td>
                  <td style={{ ...cell, borderBottom: border, whiteSpace: 'nowrap' }}>{assignment.estimatedHours}</td>
                  <td style={{ ...cell, borderBottom: border }}>
                    {fileTypes.length > 0
                      ? <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{fileTypes.map((t) => <Badge key={t} variant="neutral" size="sm">{t.toUpperCase()}</Badge>)}</div>
                      : <span style={{ color: 'var(--ink-muted)' }}>Link only</span>}
                  </td>
                  <td style={{ ...cell, borderBottom: border }}><UsedByCell usage={usage} /></td>
                  <td style={{ ...cell, borderBottom: border }}>
                    {isArchived ? <Badge variant="neutral">Archived</Badge> : <Badge variant="success">Active</Badge>}
                  </td>
                  <td style={{ ...cell, borderBottom: border }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {/* RENDERED AND DISABLED — never removed. See the file header. */}
                      {editBlockedReason ? (
                        <Tooltip content={editBlockedReason}>
                          <Button variant="secondary" size="sm" disabled aria-describedby={`edit-reason-${assignment.id}`}>
                            Edit
                          </Button>
                        </Tooltip>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => onEdit(assignment)}>Edit</Button>
                      )}

                      {inUse && (
                        <Button variant="ghost" size="sm" onClick={() => onView(assignment)}>View</Button>
                      )}

                      {mayClone ? (
                        <Button variant="secondary" size="sm" loading={busy} onClick={() => onClone(assignment)}>Clone</Button>
                      ) : (
                        <Tooltip content={ROLE_REASON.clone}>
                          <Button variant="secondary" size="sm" disabled>Clone</Button>
                        </Tooltip>
                      )}

                      {isArchived ? (
                        mayArchive
                          ? <Button variant="ghost" size="sm" loading={busy} onClick={() => onUnarchive(assignment)}>Unarchive</Button>
                          : <Tooltip content={ROLE_REASON.archive}><Button variant="ghost" size="sm" disabled>Unarchive</Button></Tooltip>
                      ) : (
                        archiveBlockedReason
                          ? <Tooltip content={archiveBlockedReason}><Button variant="ghost" size="sm" disabled>Archive</Button></Tooltip>
                          : <Button variant="ghost" size="sm" loading={busy} onClick={() => onArchive(assignment)}>Archive</Button>
                      )}
                    </div>

                    {/* The reason as VISIBLE TEXT, not only a tooltip. A tooltip is
                        unreachable on touch and invisible to anyone who does not
                        happen to hover the disabled control. */}
                    {editBlockedReason && (
                      <p id={`edit-reason-${assignment.id}`} style={{ ...reasonStyle, marginLeft: 'auto', textAlign: 'right' }}>
                        {editBlockedReason}
                      </p>
                    )}
                    {archiveBlockedReason && archiveBlockedReason !== editBlockedReason && !isArchived && (
                      <p style={{ ...reasonStyle, marginLeft: 'auto', textAlign: 'right' }}>{archiveBlockedReason}</p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
