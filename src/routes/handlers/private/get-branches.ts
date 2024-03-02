import { ProxyCore } from '../../../services';

export async function _getBranches(
  core: ProxyCore
) {
  // do parallel requests
  const [onlineBranches, localBranches] = await Promise.all([
    core.getOnlineBranches(),
    core.getLocalBranches()
  ]);
  return { onlineBranches, localBranches };
}
