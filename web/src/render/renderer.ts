import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import type { GameSnapshot, LevelDefinition } from '../game/types';
import { palette } from './palette';
import { createPlayer } from './player';
import { RenderResources } from './resources';
import { createWorldView } from './world';

export interface RendererOptions {
  lowQuality: boolean;
  reducedMotion: boolean;
}
export interface GameRenderer {
  render: (snapshot: GameSnapshot, alpha: number, delta: number) => void;
  resize: () => void;
  setQuality: (low: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  stats: () => { drawCalls: number; triangles: number };
  dispose: () => void;
}

/** Presentation only. The engine owns frame scheduling, resize observation, and context events. */
export const createGameRenderer = (
  canvas: HTMLCanvasElement,
  level: LevelDefinition,
  options: RendererOptions,
): GameRenderer => {
  const resources = new RenderResources();
  const scene = new Scene();
  const sun = new DirectionalLight(palette.sun, 3.1);
  let renderer: WebGLRenderer | undefined;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    const view = renderer;
    let lowQuality = options.lowQuality;
    let reducedMotion = options.reducedMotion;
    let disposed = false;
    view.outputColorSpace = SRGBColorSpace;
    view.toneMapping = ACESFilmicToneMapping;
    view.toneMappingExposure = 1.05;
    view.shadowMap.type = PCFSoftShadowMap;
    scene.background = new Color(palette.sky);
    scene.fog = new Fog(palette.sky, 45, 120);
    scene.add(new HemisphereLight(0xe9f6eb, 0x406567, 2.2));
    sun.position.set(-12, 25, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 28;
    sun.shadow.camera.bottom = -28;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 80;
    sun.shadow.normalBias = 0.04;
    scene.add(sun, sun.target);

    const world = createWorldView(resources, level);
    const player = createPlayer(resources);
    scene.add(world.group, player.group);
    const camera = new PerspectiveCamera(45, 1, 0.1, 180);
    const position = new Vector3(level.spawn.x, level.spawn.y, level.spawn.z);
    const previousViewPosition = position.clone();
    const focus = new Vector3(level.spawn.x, 0.2, level.spawn.z - 2.3);
    const desiredFocus = focus.clone();
    const cameraOffset = new Vector3(0, 16, 20);
    let firstFrame = true;

    const resize = () => {
      if (disposed) return;
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      camera.aspect = width / height;
      camera.fov = camera.aspect < 0.8 ? 54 : 45;
      camera.updateProjectionMatrix();
      view.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowQuality ? 1 : 1.75));
      view.setSize(width, height, false);
    };
    const setQuality = (low: boolean) => {
      if (disposed) return;
      lowQuality = low;
      view.shadowMap.enabled = !low;
      sun.castShadow = !low;
      resize();
    };
    setQuality(lowQuality);

    return {
      render: (snapshot, alpha, delta) => {
        if (disposed) return;
        const current = snapshot.player.position;
        const previous = snapshot.player.previousPosition;
        const blend = Math.max(0, Math.min(1, alpha));
        position.set(
          previous.x + (current.x - previous.x) * blend,
          previous.y + (current.y - previous.y) * blend,
          previous.z + (current.z - previous.z) * blend,
        );
        const teleported = position.distanceToSquared(previousViewPosition) > 64;
        player.group.position.copy(position);
        const angle = Math.atan2(
          Math.sin(snapshot.player.yaw - player.group.rotation.y),
          Math.cos(snapshot.player.yaw - player.group.rotation.y),
        );
        player.group.rotation.y +=
          angle *
          (reducedMotion || firstFrame || teleported ? 1 : 1 - Math.exp(-Math.max(0, delta) * 18));
        const moving = Math.hypot(current.x - previous.x, current.z - previous.z) > 0.0005;
        player.animate(snapshot.elapsed, moving, snapshot.player.grounded, reducedMotion);
        world.update(snapshot, reducedMotion);
        desiredFocus.set(
          position.x,
          Math.max(0.2, Math.min(2, position.y * 0.2)),
          position.z - 2.3,
        );
        focus.lerp(
          desiredFocus,
          firstFrame || teleported || reducedMotion ? 1 : 1 - Math.exp(-Math.max(0, delta) * 5),
        );
        camera.position.copy(focus).add(cameraOffset);
        camera.lookAt(focus);
        previousViewPosition.copy(position);
        firstFrame = false;
        view.render(scene, camera);
      },
      resize,
      setQuality,
      setReducedMotion: (value) => {
        reducedMotion = value;
      },
      stats: () => ({ drawCalls: view.info.render.calls, triangles: view.info.render.triangles }),
      dispose: () => {
        if (disposed) return;
        disposed = true;
        scene.clear();
        sun.shadow.dispose();
        resources.dispose();
        view.dispose();
      },
    };
  } catch (error) {
    scene.clear();
    sun.shadow.dispose();
    resources.dispose();
    renderer?.dispose();
    throw error;
  }
};
