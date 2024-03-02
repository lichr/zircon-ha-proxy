import _ from 'lodash';
import { Database } from 'sqlite3';
import { ILocalBranchData } from '../../schema';

export function getLocalProject(
  db: Database,
  projectId: string
): Promise<ILocalBranchData | null> {
  return new Promise((resolve, reject) => {
    db.get(
      `
        select
          e.id,
          e.body->>'groupId' as groupId,
          s.id is not null as active,
          e.body as entity,
          b.body as bundle,
          p.body as project,
          sp.body as spacePlan
          from project_entry e
            inner join bundle b
              on b.id = e.body->>'bundleId'
            inner join bundle_resource p
              on p.bundle_id = b.id
                and p.url = 'parts/project'
                and json_valid(p.body)
            inner join bundle_resource sp
              on sp.bundle_id = b.id
                and sp.url = 'parts/spacePlan'
                and json_valid(sp.body)
            left join setting s
              on s.id = 'active_project'
                and s.body ->> 'projectId' = e.id
          where e.id = ?
      `,
      [projectId],
      (err, row: any) => {
        if (err) {
          console.error("Error getting local projects", err);
          reject(err);
        } else {
          resolve(
            row ? {
              projectId: row.id,
              groupId: row.groupId,
              active: row.active,
              entry: JSON.parse(row.entity),
              bundle: JSON.parse(row.bundle),
              project: JSON.parse(new TextDecoder().decode(row.project)),
              spacePlan: JSON.parse(new TextDecoder().decode(row.spacePlan))
            } : null
          );
        }
      }
    );
  });
}
