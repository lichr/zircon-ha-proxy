import { Database } from 'sqlite3';
import { IProjectEntry } from '../../schema';

export class ProjectEntryTable {
  getDB: () => Database;

  constructor(getDB: () => Database) {
    this.getDB = getDB;
  }

  async create(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getDB().run(
        `
          CREATE TABLE IF NOT EXISTS project_entry (
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
    body: IProjectEntry
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getDB().run(
        `
          INSERT INTO project_entry (id, body)
            VALUES (?, ?)
            ON CONFLICT(id) DO UPDATE SET body = excluded.body
        `,
        [
          body.projectId,
          JSON.stringify(body)
        ],
        (err) => {
          if (err) {
            console.error("Error inserting project_entry", err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async get(id: string): Promise<IProjectEntry | null> {
    return new Promise((resolve, reject) => {
      this.getDB().get(
        `
          SELECT body
            FROM project_entry
            WHERE id = ?
        `,
        [id],
        (err, row) => {
          if (err) {
            console.error("Error getting project_entry", err);
            reject(err);
          } else {
            resolve(row ? JSON.parse((row as any).body) : null);
          }
        }
      );
    });
  }

  async delete(
    id: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getDB().run(
        `
          DELETE FROM project_entry WHERE id = ?
        `,
        [id],
        (err) => {
          if (err) {
            console.error("Error deleting project_entry", err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async query(): Promise<IProjectEntry[]> {
    return new Promise((resolve, reject) => {
      this.getDB().all(
        `
          SELECT body
            FROM project_entry
        `,
        [],
        (err, rows) => {
          if (err) {
            console.error("Error getting project_entries", err);
            reject(err);
          } else {
            resolve(rows.map((row) => JSON.parse((row as any).body)));
          }
        }
      );
    });
  }
}