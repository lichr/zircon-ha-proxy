import _ from 'lodash';
import { Database } from 'sqlite3';

export interface ILocalProject {
  groupId: string;
  projectId: string;
  bundleId: string;
  name: string;
  updateTime: string;
}

export function getLocalProjects(
  db: Database
): Promise<ILocalProject[]> {
  return new Promise((resolve, reject) => {
    db.all(
      `
      with
        -- t1 -- t3: find 1 (the most recently created) bundle for each project
        t1 as (
          select
            id,
            body->>'group' as "group",
            body->>'project' as project,
            datetime(body->>'created') as created,
            datetime(body->>'updated') as updated
            from bundle
        ),
        t2 as (
          select
            id,
            "group",
            project,
            created,
            updated,
            row_number() over (
              partition by "group", project
              order by created, id
            ) as idx
            from t1
        ),
        t3 as (
          select *
            from t2
            where idx = 1
        )
        select
          b.id as bundle_id,
          b."group",
          b.project,
          p.body->>'$.info.name' as name,
          sp.body->>'$.info.updateTime' as update_time
          from t3 b
            inner join bundle_resource p
              on p.bundle_id = b.id
                and p.url = 'parts/project'
                and json_valid(p.body)
            inner join bundle_resource sp
              on sp.bundle_id = b.id
                and sp.url = 'parts/spacePlan'
                and json_valid(sp.body)
      `,
      [],
      (err, rows: any[]) => {
        if (err) {
          console.error("Error getting local projects", err);
          reject(err);
        } else {
          resolve(
            _.map(
              rows,
              (row) => ({
                groupId: row.group,
                projectId: row.project,
                bundleId: row.bundle_id,
                name: row.name,
                updateTime: row.update_time
              })
            )
          );
        }
      }
    );
  });
}
