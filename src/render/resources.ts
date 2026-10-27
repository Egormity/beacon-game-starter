import type { BufferGeometry, Material, Texture } from 'three';

type Resource = BufferGeometry | Material | Texture;

/** Own resources explicitly: shared geometry/materials are released exactly once. */
export class RenderResources {
  private readonly owned = new Set<Resource>();
  private disposed = false;

  track = <T extends Resource>(resource: T): T => {
    if (this.disposed) throw new Error('Cannot add a resource after renderer disposal.');
    this.owned.add(resource);
    return resource;
  };

  dispose = () => {
    if (this.disposed) return;
    this.disposed = true;
    this.owned.forEach((resource) => resource.dispose());
    this.owned.clear();
  };
}
