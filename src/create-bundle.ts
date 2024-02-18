import { Database } from 'sqlite3';
import { ZirconDB } from './db';


async function createBundle(db: Database): Promise<void> {
  return new Promise((resolve, reject) => {
    const bundle = {
      "name": "my-bundle",
      "version": "1.0.0",
      "description": "My first bundle",
    };

    db.run(
      `INSERT INTO bundle (id, body) VALUES (?, ?)`,
      [bundle.name, JSON.stringify(bundle)],
      (err) => {
        if (err) {
          console.error("Error inserting bundle", err);
          reject(err);
        } else {
          console.log("Bundle inserted");
          resolve();
        }
      }
    );
  });
}


async function main() {
  const db = new ZirconDB({ path: './data/zircon.db' });

  db.init();

  db.bundle.upsert(
    "my-bundle2",
    {
      "name": "my-bundle",
      "version": "1.0.0",
      "description": "My first bundle",
    }
  );

  const bundles = await db.bundle.query();
  console.log(bundles);

  db.dispose();
}

main();
