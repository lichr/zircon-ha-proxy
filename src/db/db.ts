import { Database } from "sqlite3";
import { BundleTable } from './tables';

export interface IZirconDBConfig {
  path: string;
}

export class ZirconDB {
  db: Database | null = null;
  config: IZirconDBConfig;
  getDB = (): Database =>  {
    if (!this.db) {
      throw new Error("Database is not initialized");
    }
    return this.db;
  }
  bundle: BundleTable = new BundleTable(this.getDB);

  constructor(config: IZirconDBConfig) {
    this.config = config;
  }

  dispose(): void {
    if (this.db) {
      this.db.close();
    }
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new Database(
        this.config.path,
        (err) => {
          if (err) {
            console.error("Could not open database", err);
            reject(err);
          }
          console.log("Connected to the SQLite database.");

          this.bundle.create().then().catch(reject);

          resolve();
        }
      );
    });
  };
}
