import { Database } from 'sqlite3';
import { IBundle } from '../../types';

export class BundleTable {
  getDB: () => Database;

  constructor(getDB: () => Database) {
    this.getDB = getDB;
  }

  async create(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getDB().run(
        `
          CREATE TABLE IF NOT EXISTS bundle (
            id              text PRIMARY KEY,
            body            jsonb NOT NULL
          )
        `,
        [],
        (err) => {
          if (err) {
            console.error("Error creating table", err);
            reject(err);
          } else {
            console.log("Table is ready or already exists.");
            resolve();
          }
        }
      );
    });
  }

  async upsert(
    body: IBundle
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getDB().run(
        `
          INSERT INTO bundle (id, body)
            VALUES (?, ?)
            ON CONFLICT(id) DO UPDATE SET body = excluded.body
        `,
        [
          body.id,
          JSON.stringify(body)
        ],
        (err) => {
          if (err) {
            console.error("Error inserting bundle", err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async get(id: string): Promise<IBundle> {
    return new Promise((resolve, reject) => {
      this.getDB().get(
        `
          SELECT body
            FROM bundle
            WHERE id = ?
        `,
        [id],
        (err, row) => {
          if (err) {
            console.error("Error getting bundle", err);
            reject(err);
          } else {
            resolve(row ? JSON.parse((row as any).body) : null);
          }
        }
      );
    });
  }

  async query(): Promise<IBundle[]> {
    return new Promise((resolve, reject) => {
      this.getDB().all(
        `
          SELECT body
            FROM bundle
        `,
        [],
        (err, rows) => {
          if (err) {
            console.error("Error getting bundles", err);
            reject(err);
          } else {
            resolve(rows.map((row) => JSON.parse((row as any).body)));
          }
        }
      );
    });
  }

  async pruneByProject(
    projectId: string,
    bundleId: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getDB().run(
        `
          DELETE
            FROM bundle
            WHERE body->>'project' = ?
              and id <> ?;
        `,
        [projectId, bundleId],
        (err) => {
          if (err) {
            console.error("Error inserting bundle", err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }  
}
