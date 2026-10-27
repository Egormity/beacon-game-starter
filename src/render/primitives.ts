import {
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  type BufferGeometry,
  type ColorRepresentation,
  type Material,
  type Object3D,
} from 'three';
import type { Vec3 } from '../game/types';
import type { RenderResources } from './resources';

export const material = (
  resources: RenderResources,
  color: ColorRepresentation,
  roughness = 0.85,
) => resources.track(new MeshStandardMaterial({ color, roughness, metalness: 0.03 }));

export const mesh = (
  parent: Object3D,
  geometry: BufferGeometry,
  surface: Material | Material[],
  position?: Vec3,
) => {
  const object = new Mesh(geometry, surface);
  if (position) object.position.set(position.x, position.y, position.z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
};

export const box = (
  resources: RenderResources,
  parent: Object3D,
  size: Vec3,
  position: Vec3,
  surface: Material | Material[],
) => mesh(parent, resources.track(new BoxGeometry(size.x, size.y, size.z)), surface, position);
