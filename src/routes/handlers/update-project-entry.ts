import { ProxyCore } from '../../services';
import { IProjectEntry } from '../../schema';

// export async function updateProjectEntry(
//   core: ProxyCore,
//   projectId: string,
//   updater: (entry: IProjectEntry) => void
// ) {
//   let entry = await core.getDb().projectEntry.get(projectId);
//   if (!entry) {
//     const bundle = await core.bundler.getLatestBundle(projectId);
//     entry = {
//       id: projectId,
//       bundleId: bundle?.id,
//       localOnly: false
//     }
//   }
//   updater(entry);
//   await core.getDb().projectEntry.upsert(entry);
// }
