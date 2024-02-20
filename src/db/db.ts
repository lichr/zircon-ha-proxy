import { Database } from "sqlite3";
import { BundleLogTable, BundleResourceTable, BundleTable } from './tables';
import { SettingTable } from './tables/setting-table';

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
  setting: SettingTable = new SettingTable(this.getDB);
  bundle: BundleTable = new BundleTable(this.getDB);
  bundleResource: BundleResourceTable = new BundleResourceTable(this.getDB);
  bundleLog: BundleLogTable = new BundleLogTable(this.getDB);

  constructor(config: IZirconDBConfig) {
    this.config = config;
  }

  dispose(): void {
    if (this.db) {
      this.db.close();
    }
  }

  async _createDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new Database(
        this.config.path,
        (err) => {
          if (err) {
            console.error("Could not open database", err);
            reject(err);
          }
          console.log("Connected to the SQLite database.");
          resolve();
        }
      );
    });
  }

  async init(): Promise<void> {
    await this._createDB();
    await this.setting.create();
    await this.bundle.create();
    await this.bundleResource.create();
    await this.bundleLog.create();
  };
}
