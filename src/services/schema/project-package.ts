import _ from 'lodash';
import { makeBundleManifest } from './bundle-manifest';
import { IProjectPackage } from './types';

export class ProjectPackage {
  data: IProjectPackage;

  constructor(data: IProjectPackage) {
    this.data = data;
  }

  projectId() {
    return this.data.project.info.id;
  }

  groupId() {
    return this.data.group.info.id;
  }

  planId() {
    return this.data.spacePlan.info.id;
  }

  makeBundleManifest() {
    const groupId = this.groupId();
    const projectId = this.projectId();
    const manifest = makeBundleManifest({ groupId, projectId });

    // basic items
    manifest.addAppItem('viewer/', 'html');
    manifest.addAppItem('viewer/bundle.js', 'js');
    manifest.addAppItem('viewer/config/page.json', 'json');
    manifest.addSiteItem('favicon.icon', 'bin');
    manifest.addAppItem('resources/lebombo_1k.hdr', 'bin');

    // project items
    manifest.addPartItem('group', this.data.group);
    manifest.addPartItem('project', this.data.project);
    manifest.addPartItem('spacePlan', this.data.spacePlan);
    manifest.addPartItem('tags', this.data.tags);
    manifest.addPartItem('tagGroups', this.data.tagGroups);

    // space items
    _.each(
      this.data.spacePlan.plan.spaces,
      (space) => {
        // find 3d models (*.glb)
        _.each(
          space.shape?.data?.parts,
          (part) => {
            let url = part.data?.file?.url;
            if (url) {
              manifest.addS3Item(url)
            }
          }
        )
      }
    );

    return manifest;
  }
}
