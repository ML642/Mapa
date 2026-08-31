import { startTransition, useDeferredValue, useEffect, useState } from 'react';
import { Power, RefreshCcw, Search, ShieldBan, UserCog } from 'lucide-react';
import { deleteUser, fetchUserById, revokeUserSessions, searchUsersByUsername, updateUserRole } from '../features/users/api';
import { useSession } from '../features/session/useSession';
import { appendAuditRecord } from '../shared/lib/audit';
import { ROLE_OPTIONS } from '../shared/constants';
import {
  formatRole,
  formatSubscriptionType,
  normalizeErrorMessage,
  resolveMutualFriendsCount,
  shortId,
} from '../shared/lib/utils';
import type { UserLookupResult, UserProfile } from '../shared/types';
import {
  Badge,
  Button,
  EmptyState,
  Field,
  InlineMessage,
  Input,
  LoadingState,
  PageHeader,
  SectionCard,
  Select,
} from '../shared/ui';

export const UsersPage = () => {
  const { user } = useSession();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserLookupResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [targetRole, setTargetRole] = useState('moderator');
  const [busyAction, setBusyAction] = useState('');
  const deferredQuery = useDeferredValue(query.trim());

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (deferredQuery.length < 2) {
        setResults([]);
        setResultsError('');
        return;
      }

      setLoadingResults(true);
      setResultsError('');

      try {
        const data = await searchUsersByUsername(deferredQuery);
        if (active) {
          setResults(data);
        }
      } catch (error) {
        if (active) {
          setResults([]);
          setResultsError(normalizeErrorMessage(error, 'Failed to search users'));
        }
      } finally {
        if (active) {
          setLoadingResults(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [deferredQuery]);

  useEffect(() => {
    if (selectedUser?.role) {
      setTargetRole(selectedUser.role);
    }
  }, [selectedUser]);

  const loadProfile = async (userId: string) => {
    setSelectedUserId(userId);
    setProfileLoading(true);
    setProfileError('');

    try {
      const profile = await fetchUserById(userId);
      setSelectedUser(profile);
    } catch (error) {
      setSelectedUser(null);
      setProfileError(normalizeErrorMessage(error, 'Failed to load user profile'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRoleUpdate = async () => {
    if (!selectedUserId) {
      return;
    }

    setBusyAction('role');
    setProfileError('');

    try {
      await updateUserRole(selectedUserId, targetRole);
      appendAuditRecord({
        actor: user?.username ?? 'admin',
        action: 'Role updated',
        target: selectedUser?.username ?? selectedUserId,
        details: `New role: ${targetRole}`,
        status: 'success',
      });
      await loadProfile(selectedUserId);
    } catch (error) {
      setProfileError(normalizeErrorMessage(error, 'Failed to update user role'));
    } finally {
      setBusyAction('');
    }
  };

  const handleRevokeSessions = async () => {
    if (!selectedUserId) {
      return;
    }

    setBusyAction('revoke');
    setProfileError('');

    try {
      await revokeUserSessions(selectedUserId);
      appendAuditRecord({
        actor: user?.username ?? 'admin',
        action: 'Sessions revoked',
        target: selectedUser?.username ?? selectedUserId,
        status: 'success',
      });
    } catch (error) {
      setProfileError(normalizeErrorMessage(error, 'Failed to revoke user sessions'));
    } finally {
      setBusyAction('');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserId) {
      return;
    }

    setBusyAction('delete');
    setProfileError('');

    try {
      await deleteUser(selectedUserId);
      appendAuditRecord({
        actor: user?.username ?? 'admin',
        action: 'User deleted',
        target: selectedUser?.username ?? selectedUserId,
        status: 'success',
      });
      setSelectedUser(null);
      setSelectedUserId('');
    } catch (error) {
      setProfileError(normalizeErrorMessage(error, 'Failed to delete user'));
    } finally {
      setBusyAction('');
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Account management"
        title="Users"
        subtitle="Search accounts, review profile details, update roles, and revoke active sessions."
        actions={
          selectedUserId ? (
            <Button icon={RefreshCcw} onClick={() => void loadProfile(selectedUserId)} tone="secondary">
              Refresh profile
            </Button>
          ) : undefined
        }
      />

      <div className="two-column-layout">
        <SectionCard subtitle="Search by username and open the profile directly." title="Search">
          <Field label="Username">
            <div className="input-with-icon">
              <Search size={16} />
              <Input
                onChange={(event) => {
                  startTransition(() => {
                    setQuery(event.target.value);
                  });
                }}
                placeholder="Start typing a username"
                value={query}
              />
            </div>
          </Field>

          {resultsError ? <InlineMessage title="Search error" tone="danger">{resultsError}</InlineMessage> : null}

          {loadingResults ? (
            <LoadingState label="Searching users…" />
          ) : results.length ? (
            <div className="search-results">
              {results.map((result, index) => {
                const resolvedUserId = result.userId ?? result.id;

                return (
                  <article className="search-result" key={`${result.username}-${index}`}>
                    <div>
                      <strong>{result.username}</strong>
                      <span>Mutual contacts: {resolveMutualFriendsCount(result.mutualFriends)}</span>
                    </div>
                    <div className="search-result__actions">
                      <Badge tone={resolvedUserId ? 'success' : 'warning'}>{shortId(resolvedUserId)}</Badge>
                      <Button disabled={!resolvedUserId} onClick={() => void loadProfile(resolvedUserId ?? '')} size="sm" tone="secondary">
                        Open
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              description="Enter at least two characters to search."
              title="No results"
            />
          )}
        </SectionCard>

        <SectionCard subtitle="Profile details and account actions." title="User profile">
          {profileError ? <InlineMessage title="Profile error" tone="danger">{profileError}</InlineMessage> : null}

          {profileLoading ? (
            <LoadingState label="Loading profile…" />
          ) : selectedUser ? (
            <div className="profile-panel">
              <div className="profile-hero">
                <div className="user-avatar user-avatar--lg">
                  {selectedUser.username.slice(0, 1)}
                </div>
                <div>
                  <strong>{selectedUser.username}</strong>
                  <span>ID: {shortId(selectedUserId)}</span>
                </div>
              </div>

              <dl className="detail-list">
                <div>
                  <dt>Email</dt>
                  <dd>{selectedUser.email || 'Not available'}</dd>
                </div>
                <div>
                  <dt>Current role</dt>
                  <dd>{formatRole(selectedUser.role)}</dd>
                </div>
                <div>
                  <dt>Bio</dt>
                  <dd>{selectedUser.bio || 'No bio'}</dd>
                </div>
                <div>
                  <dt>Subscription</dt>
                  <dd>{formatSubscriptionType(selectedUser.type)}</dd>
                </div>
                <div>
                  <dt>Paid status</dt>
                  <dd>{selectedUser.isPayed ? 'Yes' : 'No'}</dd>
                </div>
                <div>
                  <dt>Mutual contacts</dt>
                  <dd>{resolveMutualFriendsCount(selectedUser.mutualFriends)}</dd>
                </div>
              </dl>

              <Field hint="Available roles come from the current admin configuration." label="Assign role">
                <div className="split-inline">
                  <Select onChange={(event) => setTargetRole(event.target.value)} value={targetRole}>
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </Select>
                  <Button
                    disabled={busyAction.length > 0}
                    icon={UserCog}
                    onClick={() => void handleRoleUpdate()}
                  >
                    Update role
                  </Button>
                </div>
              </Field>

              <div className="action-grid">
                <Button
                  disabled={busyAction.length > 0}
                  icon={Power}
                  onClick={() => void handleRevokeSessions()}
                  tone="secondary"
                >
                  Revoke sessions
                </Button>
                <Button
                  disabled={busyAction.length > 0}
                  icon={ShieldBan}
                  onClick={() => void handleDeleteUser()}
                  tone="danger"
                >
                  Delete account
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              description="Choose a user from the search results to open the profile."
              title="No user selected"
            />
          )}
        </SectionCard>
      </div>
    </>
  );
};
