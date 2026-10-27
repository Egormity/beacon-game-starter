import type { LevelDefinition } from './types';

export const levels: LevelDefinition[] = [
  {
    id: 'relay-island',
    name: 'Relay island',
    description:
      'Find four energy cells. Jump onto the raised ruin, then return the light to the beacon.',
    spawn: { x: 0, y: 0.75, z: 7 },
    goal: { position: { x: 0, y: 0, z: -7 }, radius: 1.35 },
    fallY: -8,
    solids: [
      {
        id: 'island',
        position: { x: 0, y: -1, z: 0 },
        size: { x: 24, y: 2, z: 20 },
        kind: 'ground',
      },
      {
        id: 'west-ruin',
        position: { x: -2.5, y: 0.7, z: 1 },
        size: { x: 2, y: 1.4, z: 2 },
        kind: 'stone',
      },
      {
        id: 'east-ruin',
        position: { x: 2.4, y: 0.9, z: -1 },
        size: { x: 3, y: 1.8, z: 2 },
        kind: 'stone',
      },
      {
        id: 'raised-ruin',
        position: { x: 6, y: 0.5, z: -4 },
        size: { x: 3, y: 1, z: 3 },
        kind: 'platform',
      },
    ],
    pickups: [
      { id: 'west-cell', position: { x: -7, y: 0.9, z: 4 } },
      { id: 'east-cell', position: { x: 7, y: 0.9, z: 4 } },
      { id: 'garden-cell', position: { x: -6, y: 0.9, z: -4 } },
      { id: 'ruin-cell', position: { x: 6, y: 1.9, z: -4 } },
    ],
  },
  {
    id: 'sky-steps',
    name: 'Sky steps',
    description:
      'Island-hop across the water. Jump between the stepping islands to carry the signal home.',
    spawn: { x: 0, y: 0.75, z: 7 },
    goal: { position: { x: 0, y: 1.5, z: -10 }, radius: 1.35 },
    fallY: -8,
    solids: [
      {
        id: 'landing',
        position: { x: 0, y: -1, z: 7 },
        size: { x: 9, y: 2, z: 6 },
        kind: 'ground',
      },
      {
        id: 'first-step',
        position: { x: -2, y: -0.25, z: 1 },
        size: { x: 7, y: 1.5, z: 4 },
        kind: 'platform',
      },
      {
        id: 'second-step',
        position: { x: 2, y: 0.25, z: -4.5 },
        size: { x: 7, y: 2.5, z: 5 },
        kind: 'platform',
      },
      {
        id: 'beacon-island',
        position: { x: 0, y: -0.5, z: -10 },
        size: { x: 10, y: 4, z: 4 },
        kind: 'ground',
      },
    ],
    pickups: [
      { id: 'landing-cell', position: { x: -2, y: 0.9, z: 6 } },
      { id: 'first-cell', position: { x: -3, y: 1.4, z: 1 } },
      { id: 'second-cell', position: { x: 3, y: 2.4, z: -4 } },
      { id: 'beacon-cell', position: { x: -2, y: 2.4, z: -10 } },
    ],
  },
];

export const defaultLevel = levels[0];
