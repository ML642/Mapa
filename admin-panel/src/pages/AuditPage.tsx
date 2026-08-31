import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { clearAuditRecords, readAuditRecords } from '../shared/lib/audit';
import { formatDateTime } from '../shared/lib/utils';
import type { AuditRecord } from '../shared/types';
import { Badge, Button, EmptyState, PageHeader, SectionCard } from '../shared/ui';

export const AuditPage = () => {
  const [records, setRecords] = useState<AuditRecord[]>([]);

  useEffect(() => {
    setRecords(readAuditRecords());
  }, []);

  const refresh = () => setRecords(readAuditRecords());

  return (
    <>
      <PageHeader
        eyebrow="Activity log"
        title="Audit"
        subtitle="Recent admin actions across moderation, sessions, and user management."
        actions={
          <Button
            icon={Trash2}
            onClick={() => {
              clearAuditRecords();
              refresh();
            }}
            tone="ghost"
          >
            Clear log
          </Button>
        }
      />

      <SectionCard subtitle="Recent actions recorded in this browser session." title="Recent activity">
        {records.length ? (
          <div className="audit-list">
            {records.map((record) => (
              <article className="audit-item" key={record.id}>
                <div className="audit-item__head">
                  <div>
                    <strong>{record.action}</strong>
                    <span>
                      {record.actor} → {record.target}
                    </span>
                  </div>
                  <div className="audit-item__meta">
                    <Badge tone={record.status === 'error' ? 'danger' : record.status}>{record.status}</Badge>
                    <span>{formatDateTime(record.createdAt)}</span>
                  </div>
                </div>
                {record.details ? <p>{record.details}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            description="Actions will appear here after you start using the admin panel."
            title="Log is empty"
          />
        )}
      </SectionCard>
    </>
  );
};
