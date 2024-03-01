import { Database } from 'sqlite3';
import { IBundleLogEntry } from '../../schema';
import _ from 'lodash';

export class BundleLogTable {
  getDB: () => Database;

  constructor(getDB: () => Database) {
    this.getDB = getDB;
  }

  async create(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getDB().run(
        `
          CREATE TABLE IF NOT EXISTS bundle_log (
            id              text PRIMARY KEY,
            bundle_id       text NOT NULL,
            level           text NOT NULL,
            created         text NOT NULL,
            message         text NOT NULL,
            data            jsonb,
            error           jsonb
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
    entry: IBundleLogEntry
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getDB().run(
        `
          INSERT INTO bundle_log (id, bundle_id, level, created, message, data, error)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET data = excluded.data, error = excluded.error
        `,
        [
          entry.id,
          entry.bundle_id,
          entry.level,
          entry.created,
          entry.message,
          _.isNil(entry.data) ? null : JSON.stringify(entry.data),
          _.isNil(entry.error) ? null : JSON.stringify(entry.error),
        ],
        (err) => {
          if (err) {
            console.error("Error inserting bundle log", err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async get(id: string): Promise<IBundleLogEntry> {
    return new Promise((resolve, reject) => {
      this.getDB().get(
        `
          SELECT id, bundle_id, level, created, message, data, error
            FROM bundle_log
            WHERE id = ?
        `,
        [id],
        (err, row: any) => {
          if (err) {
            console.error("Error getting bundle log", err);
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  async query(): Promise<IBundleLogEntry[]> {
    return new Promise((resolve, reject) => {
      this.getDB().all(
        `
          SELECT id, bundle_id, level, created, message, data, error
            FROM bundle_log
        `,
        [],
        (err, rows: any[]) => {
          if (err) {
            console.error("Error getting bundle logs", err);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }
}
