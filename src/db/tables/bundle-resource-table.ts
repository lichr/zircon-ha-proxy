import { Database } from 'sqlite3';
import { IBundleResource, IBundleResourceInput } from '../../schema';

export class BundleResourceTable {
  getDB: () => Database;

  constructor(getDB: () => Database) {
    this.getDB = getDB;
  }

  async create(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.getDB().run(
        `
          CREATE TABLE IF NOT EXISTS bundle_resource (
            bundle_id       text NOT NULL,
            url             text NOT NULL,
            headers         jsonb NOT NULL,
            size            integer NOT NULL,
            body            blob NOT NULL,
            options         jsonb NOT NULL,
            PRIMARY KEY     (bundle_id, url)
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
    resource: IBundleResourceInput
  ): Promise<void> {
    const size = resource.body ? resource.body.byteLength : 0;
    return new Promise((resolve, reject) => {
      this.getDB().run(
        `
          INSERT INTO bundle_resource (bundle_id, url, headers, size, body, options)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(bundle_id, url) DO UPDATE SET body = excluded.body
        `,
        [
          resource.bundle_id,
          resource.url,
          JSON.stringify(resource.headers),
          size,
          resource.body,
          JSON.stringify(resource.options)
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

  async get(bundle_id: string, url: string): Promise<IBundleResource | null> {
    return new Promise((resolve, reject) => {
      this.getDB().get(
        `
          SELECT
            bundle_id,
            url,
            headers,
            size,
            body,
            options
            FROM bundle_resource
            WHERE bundle_id = ? and url = ?
        `,
        [bundle_id, url],
        (err, row: any) => {
          if (err) {
            console.error("Error getting bundle-resource", err);
            reject(err);
          } else {
            const resource = row ? {
              bundle_id: row.bundle_id,
              url: row.url,
              headers: JSON.parse(row.headers),
              size: row.size,
              body: row.body,
              options: JSON.parse(row.options)
            } : null;
            resolve(resource);
          }
        }
      );
    });
  }

  async query(): Promise<IBundleResource[]> {
    return new Promise((resolve, reject) => {
      this.getDB().all(
        `
          SELECT
            bundle_id,
            url,
            headers,
            size,
            body,
            options
            FROM bundle_resource
        `,
        [],
        (err, rows) => {
          if (err) {
            console.error("Error getting bundle-resources", err);
            reject(err);
          } else {
            const resources = rows.map((row: any) => ({
              bundle_id: row.bundle_id,
              url: row.url,
              headers: JSON.parse(row.headers),
              size: row.size,
              body: row.body,
              options: JSON.parse(row.options)
            }));
            resolve(resources);
          }
        }
      );
    });
  }
}
