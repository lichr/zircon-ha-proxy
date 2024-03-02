import { Database } from 'sqlite3';
import { ISettings } from '../../schema';

export class SettingTable {
  getDB: () => Database;

  constructor(getDB: () => Database) {
    this.getDB = getDB;
  }

  async create(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getDB().run(
        `
          CREATE TABLE IF NOT EXISTS setting (
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
    id: string,
    body: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getDB().run(
        `
          INSERT INTO setting (id, body)
            VALUES (?, ?)
            ON CONFLICT(id) DO UPDATE SET body = excluded.body
        `,
        [
          id,
          JSON.stringify(body)
        ],
        (err) => {
          if (err) {
            console.error("Error inserting setting", err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async get(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getDB().get(
        `SELECT body FROM setting WHERE id = ?`,
        [id],
        (err, row: any) => {
          if (err) {
            console.error("Error getting setting", err);
            reject(err);
          } else {
            resolve(row ? JSON.parse(row.body) : null);
          }
        }
      );
    });
  }

  async query(): Promise<ISettings> {
    return new Promise((resolve, reject) => {
      this.getDB().all(
        `SELECT id, body FROM setting`,
        [],
        (err, rows: any[]) => {
          if (err) {
            console.error("Error getting settings", err);
            reject(err);
          } else {
            const settings: any = {};
            rows.forEach((row) => {
              settings[row.id] = JSON.parse(row.body);
            });
            resolve(settings as ISettings);
          }
        }
      );
    });
  }
}
