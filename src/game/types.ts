export interface Vec3 {
  x: number;
  y: number;
  z: number;
}
export interface Solid {
  id: string;
  position: Vec3;
  size: Vec3;
  kind: 'ground' | 'stone' | 'platform';
}
export interface Pickup {
  id: string;
  position: Vec3;
}
export interface LevelDefinition {
  id: string;
  name: string;
  description: string;
  spawn: Vec3;
  goal: { position: Vec3; radius: number };
  solids: Solid[];
  pickups: Pickup[];
  fallY: number;
}
export interface GameInput {
  moveX: number;
  moveZ: number;
  jump: boolean;
  sprint: boolean;
}
export type GamePhase = 'ready' | 'playing' | 'paused' | 'won';
export interface GameSnapshot {
  phase: GamePhase;
  levelId: string;
  player: { position: Vec3; previousPosition: Vec3; yaw: number; grounded: boolean };
  collectedIds: string[];
  totalPickups: number;
  elapsed: number;
  falls: number;
}
export interface GameSimulation {
  step: (input: GameInput, dt: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  snapshot: () => GameSnapshot;
  dispose: () => void;
}
