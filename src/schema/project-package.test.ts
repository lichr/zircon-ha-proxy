import { ProjectPackage } from './project-package';
import testData from './test-data.json';

describe('makeBundleManifest', () => {
  it('should generate the bundle manifest correctly', () => {
    const projectPackage = new ProjectPackage(testData);

    // Call the function
    const manifest = projectPackage.makeBundleManifest();

    // Assert the expected results
    expect(manifest).toBeDefined();

    const items = manifest.data.items;
    console.log('>>> items', items);
    expect(items['s3/pub/lib/device_models/WQi94Obh4ytl/shape.parts.main.mesh.glb']).toBeDefined();
  });
});
