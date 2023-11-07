import * as Babylon from '@babylonjs/core';

import {
  createWorld,
  Types,
  defineComponent,
  defineQuery,
  addEntity,
  addComponent,
  pipe,
  getAllEntities
} from 'bitecs';

export function createApp(canvas: HTMLCanvasElement) {
  const engine = new Babylon.Engine(canvas, true);
  const scene = new Babylon.Scene(engine);
  scene.clearColor = Babylon.Color4.FromHexString('#3c3c3c');

  const camera = new Babylon.ArcRotateCamera(
    'camera',
    -Math.PI / 2,
    Math.PI / 2,
    800,
    Babylon.Vector3.Zero(),
    scene
  );
  camera.setTarget(Babylon.Vector3.Zero());
  camera.lowerRadiusLimit = 0;
  camera.upperRadiusLimit = 2000;
  camera.panningSensibility = 50;

  camera.attachControl(canvas, true);
  const light = new Babylon.HemisphericLight('light', new Babylon.Vector3(0, 1, 0), scene);

  // test///////////////////////////////////对比测试

  // ------------------------------------
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  const SPEED_MULTIPLIER = 0.3;
  const SHAPE_SIZE = 50;
  const SHAPE_HALF_SIZE = SHAPE_SIZE / 2;
  const canvasHalfWidth = canvasWidth / 2;
  const canvasHalfHeight = canvasHeight / 2;

  function getRandomPosition(canvasWidth: number, canvasHeight: number) {
    return {
      x: (Math.random() - 0.5) * canvasWidth,
      y: (Math.random() - 0.5) * canvasHeight,
      z: Math.random() * 100 - 50
    };
  }

  function getRandomVelocity() {
    return {
      x: SPEED_MULTIPLIER * (2 * Math.random() - 1),
      y: SPEED_MULTIPLIER * (2 * Math.random() - 1),
      z: SPEED_MULTIPLIER * (2 * Math.random() - 1)
    };
  }
  // ------------------------------------

  class Vector3Proxy {
    eid: any;
    store: any;
    constructor(store: any, eid: any) {
      this.eid = eid;
      this.store = store;
    }
    get x() {
      return this.store.x[this.eid];
    }
    set x(val) {
      this.store.x[this.eid] = val;
    }
    get y() {
      return this.store.y[this.eid];
    }
    set y(val) {
      this.store.y[this.eid] = val;
    }
    get z() {
      return this.store.z[this.eid];
    }
    set z(val) {
      this.store.z[this.eid] = val;
    }
  }

  class PositionProxy extends Vector3Proxy {
    constructor(eid: any) {
      super(Position, eid);
    }
  }

  class VelocityProxy extends Vector3Proxy {
    constructor(eid: any) {
      super(Velocity, eid);
    }
  }

  const BoxComponent = defineComponent({
    position: {
      x: Types.f32,
      y: Types.f32,
      z: Types.f32
    },
    boxId: Types.ui32,
    entity: Types.eid
  });

  const Vector3 = { x: Types.f32, y: Types.f32, z: Types.f32 };
  const Position = defineComponent(Vector3);
  const Velocity = defineComponent(Vector3);

  const movementQuery = defineQuery([Position, Velocity, BoxComponent]);

  const movementSystem = (world: any) => {
    const {
      time: { delta }
    } = world;

    const ents = movementQuery(world);

    for (let i = 0; i < ents.length; i++) {
      const eid = ents[i];

      Position.x[eid] += Velocity.x[eid] * delta * SPEED_MULTIPLIER;
      Position.y[eid] += Velocity.y[eid] * delta * SPEED_MULTIPLIER;

      if (Position.x[eid] > canvasHalfWidth + SHAPE_HALF_SIZE) {
        Position.x[eid] = -canvasHalfWidth - SHAPE_HALF_SIZE;
      }
      if (Position.x[eid] < -canvasHalfWidth - SHAPE_HALF_SIZE) {
        Position.x[eid] = canvasHalfWidth + SHAPE_HALF_SIZE;
      }
      if (Position.y[eid] > canvasHalfHeight + SHAPE_HALF_SIZE) {
        Position.y[eid] = -canvasHalfHeight - SHAPE_HALF_SIZE;
      }
      if (Position.y[eid] < -canvasHalfHeight - SHAPE_HALF_SIZE) {
        Position.y[eid] = canvasHalfHeight + SHAPE_HALF_SIZE;
      }

      const box = enittyMeshMap.get(eid);
      box.position.x = Position.x[eid];
      box.position.y = Position.y[eid];
      // const box = scene.getMeshByUniqueId(BoxComponent.boxId[eid]);
      // if (box) {
      //   box.position.x = Position.x[eid];
      //   box.position.x = Position.x[eid];
      // }
    }
    return world;
  };

  const timeSystem = (world: any) => {
    const { time } = world;
    const now = performance.now();
    const delta = now - time.then;
    time.delta = engine.getDeltaTime();
    time.elapsed += delta;
    time.then = now;
    return world;
  };

  const pipeline = pipe(movementSystem, timeSystem);

  const world = createWorld() as any;
  world.time = { delta: 0, elapsed: 0, then: performance.now() };

  const enittyMeshMap = new Map();

  for (let i = 0; i < 10000; i++) {
    const eid = addEntity(world);
    addComponent(world, Position, eid);
    addComponent(world, Velocity, eid);
    addComponent(world, BoxComponent, eid);

    const position = new PositionProxy(eid);
    const velocity = new VelocityProxy(eid);

    const randomVelocity = getRandomVelocity();
    velocity.x = randomVelocity.x;
    velocity.y = randomVelocity.y;
    velocity.z = randomVelocity.z;

    const randowPosition = getRandomPosition(canvasWidth, canvasHeight);
    position.x = randowPosition.x;
    position.y = randowPosition.y;
    position.z = randowPosition.z;

    const box = Babylon.MeshBuilder.CreateBox('box', { size: 6 });

    box.position.x = position.x;
    box.position.y = position.y;
    box.position.z = position.z;

    BoxComponent.position.x[eid] = box.position.x;
    BoxComponent.position.y[eid] = box.position.y;
    BoxComponent.position.z[eid] = box.position.z;

    enittyMeshMap.set(eid, box);
  }

  const entities = getAllEntities(world);

  engine.runRenderLoop(() => {
    pipeline(world);

    scene.render();
  });

  // ------------------------------------

  const select = document.querySelector('select');

  const boxOptions = {
    size: 6
  };

  // select?.addEventListener('change', syncBoxes);
  // ------------------------------------

  // test///////////////////////////////////对比测试
}
