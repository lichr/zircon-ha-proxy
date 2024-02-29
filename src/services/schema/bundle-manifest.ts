import { makeNow, makeUid } from '../../tools';
import { BundleResourceType, IBundleManifest } from '../../types';

export function makeBundleManifest(
  props: {
    groupId: string;
    projectId: string;
  }
) {
  const { groupId, projectId } = props;
  const now = makeNow();
  const id = makeUid();

  const data: IBundleManifest = {
    info: {
      id,
      groupId,
      projectId,
      create_time: now,
      version: '1.0.0'
    },
    items: {}
  };
  return new BundleManifest(data);
}

export class BundleManifest {
  data: IBundleManifest;
  constructor(data: IBundleManifest) {
    this.data = data;
  }

  addAppItem(url: string, itemType: BundleResourceType) {
    this.data.items[url] = {
      target: {
        scope: 'app',
        url
      },
      type: itemType
    };

  }

  addSiteItem(url: string, itemType: BundleResourceType) {
    this.data.items[url] = {
      target: {
        scope: 'site',
        url
      },
      type: itemType
    };
  }

  addApiItem(url: string, targetUrl: string, itemType: BundleResourceType) {
    this.data.items[`api/${url}`] = {
      target: {
        scope: 'api',
        url: targetUrl
      },
      type: itemType
    };

  }

  addS3Item(targetUrl: string) {
    this.data.items[`s3/${targetUrl}`] = {
      target: {
        scope: 's3',
        url: targetUrl
      },
      type: 'bin'
    };
  }
  addPartItem(url: string, data: any) {
    this.data.items[`parts/${url}`] = {
      target: {
        scope: 'part',
        url
      },
      type: 'bin',
      data
    };
  }  
}

