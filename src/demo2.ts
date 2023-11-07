import * as Babylon from '@babylonjs/core';
import { Scene, Vector3 } from '@babylonjs/core';

import {
  createWorld,
  Types,
  defineComponent,
  defineQuery,
  addEntity,
  addComponent,
  IWorld,
  System,
  defineSystem,
  exitQuery,
  removeEntity,
  enterQuery,
  hasComponent,
  removeComponent
} from 'bitecs';

// 组
export class EntityManager {
  private constructor(
    private readonly world: IWorld,
    private readonly scene: Scene
  ) {}

  private static instance: EntityManager;

  static getInstance(world: IWorld, scene: Scene): EntityManager {
    if (!EntityManager.instance) {
      EntityManager.instance = new EntityManager(world, scene);
    }
    return EntityManager.instance;
  }

  static eidMap: Map<number, Babylon.Mesh | Babylon.AbstractMesh | null> = new Map();
  static uniqueIdMap: Map<number, number> = new Map();

  // 将mesh 和 eid 对应
  static add(key: number, value: Babylon.Mesh | Babylon.AbstractMesh | null) {
    EntityManager.eidMap.set(key, value);
  }

  // 移除entity 和 mesh
  static remove(key: number) {
    if (EntityManager.eidMap.has(key)) {
      EntityManager.eidMap.delete(key);
    }
  }

  public deleteEntity(uniqueId: number) {
    // 拿到 mesh唯一id，然后通过唯一id，找到eid，然后执行移除操作
    const entity = EntityManager.uniqueIdMap.get(uniqueId) as number;
    removeEntity(this.world, entity);
  }
}

export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32
});

export const Rotation = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32
});

export const MeshComponent = defineComponent({
  uniqueId: Types.ui16
});

export class Application {
  private entitySystem!: System;
  private positionSystem!: System;
  private rotationSystem!: System;
  public entityManager: EntityManager;

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly engine: Babylon.Engine,
    private readonly scene: Babylon.Scene,
    private readonly world: IWorld
  ) {
    window.addEventListener('resize', this._resizeHandler);
    this.entityManager = EntityManager.getInstance(world, scene);
  }

  static createApp(canvas: HTMLCanvasElement) {
    const engine = new Babylon.Engine(canvas, true, {}, true);
    const scene = new Babylon.Scene(engine);
    const world = createWorld();

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
    return new Application(canvas, engine, scene, world);
  }

  private createEntity() {
    this.scene.onPointerDown = (evt: Babylon.IPointerEvent, pickInfo: Babylon.PickingInfo) => {
      // 中键新增组件
      if (evt.buttons === 4) {
        if (pickInfo.pickedMesh) {
          const entity = EntityManager.uniqueIdMap.get(pickInfo.pickedMesh?.uniqueId) as number;
          if (hasComponent(this.world, Rotation, entity)) {
            removeComponent(this.world, Rotation, entity);
          } else {
            addComponent(this.world, Rotation, entity);
            Rotation.y[entity] = 0.1;
          }
        }
      }
      // 左键新增
      if (evt.button === 0 && !pickInfo.pickedMesh) {
        // 获取canvas元素的矩形区域，这包含了它的绝对位置
        const rect = this.canvas.getBoundingClientRect();

        // 获取点击位置相对于页面左边和上边的位置
        const x = evt.x - rect.left;
        const y = evt.y - rect.top;

        // 计算canvas的中心点
        const centerX = this.canvas.width / window.devicePixelRatio / 2;
        const centerY = this.canvas.height / window.devicePixelRatio / 2;

        // // 转换坐标
        const centeredX = x - centerX;
        const centeredY = centerY - y; // Y轴在Canvas中向下是正方向，所以要减去

        const vec3 = {
          x: centeredX,
          y: centeredY,
          z: 0
        };
        this.createBoxEntity(new Vector3(vec3.x, vec3.y, vec3.z));
      }

      // 右键删除
      if (evt.buttons === 2) {
        const uniqueId = pickInfo.pickedMesh?.uniqueId;
        if (uniqueId) {
          this.entityManager.deleteEntity(uniqueId);
        }
      }
    };

    const PositionSystem = (scene: Babylon.Scene) => {
      const query = defineQuery([MeshComponent, Position]);
      const queryEnter = enterQuery(query);

      return defineSystem((world: IWorld) => {
        const entities = queryEnter(world);
        for (let i = 0; i < entities.length; i++) {
          const entity = entities[i];
          const uniqueId = MeshComponent.uniqueId[entity];
          const object3d = scene.getMeshByUniqueId(uniqueId);
          if (object3d) {
            object3d.position.x = Position.x[entity];
            object3d.position.y = Position.y[entity];
            object3d.position.z = Position.z[entity];
          }
        }
        return world;
      });
    };
    const RotationSystem = (scene: Babylon.Scene) => {
      const query = defineQuery([MeshComponent, Rotation]);
      const queryEnter = enterQuery(query);
      const queryExit = exitQuery(query);

      return defineSystem((world: IWorld) => {
        const entities = queryEnter(world);
        for (let i = 0; i < entities.length; i++) {
          const entity = entities[i];
          const uniqueId = MeshComponent.uniqueId[entity];
          const object3d = scene.getMeshByUniqueId(uniqueId);
          if (object3d) {
            object3d.position.x = Position.x[entity];
            object3d.position.y = Position.y[entity];
            object3d.position.z = Position.z[entity];
          }
        }

        const entitesQuery = query(world);
        for (let i = 0; i < entitesQuery.length; i++) {
          const entity = entitesQuery[i];
          const uniqueId = MeshComponent.uniqueId[entity];

          const object3d = scene.getMeshByUniqueId(uniqueId);
          if (object3d) {
            object3d.rotation.x += Rotation.x[entity];
            object3d.rotation.y += Rotation.y[entity];
            object3d.rotation.z += Rotation.z[entity];
          }
        }

        const entitesExitQuery = queryExit(world);
        for (let i = 0; i < entitesExitQuery.length; i++) {
          const entity = entitesExitQuery[i];
          console.warn('组件移除');
          const uniqueId = MeshComponent.uniqueId[entity];
          const object3d = scene.getMeshByUniqueId(uniqueId);
          if (object3d) {
            object3d.rotation.y = 0;
          }
        }

        return world;
      });
    };

    // system
    const EntitySystem = (scene: Babylon.Scene) => {
      const entityQuery = defineQuery([MeshComponent]);
      const queryEnter = enterQuery(entityQuery);
      const queryExit = exitQuery(entityQuery);

      return defineSystem((world) => {
        const entites = queryEnter(world);
        for (let i = 0; i < entites.length; i++) {
          const entity = entites[i];

          // 应该有一个物体添加处理system
          const mesh = Babylon.MeshBuilder.CreateBox(entity.toString(), { size: 50 });
          MeshComponent.uniqueId[entity] = mesh.uniqueId;
          const uniqueId = MeshComponent.uniqueId[entity];

          const object3d = scene.getMeshByUniqueId(uniqueId);
          EntityManager.add(entity, object3d);
          EntityManager.uniqueIdMap.set(uniqueId, entity);
        }

        const exite = queryExit(world);
        for (let i = 0; i < exite.length; i++) {
          const entity = exite[i];
          EntityManager.remove(entity);
          const uniqueId = MeshComponent.uniqueId[entity];
          EntityManager.uniqueIdMap.delete(uniqueId);
          const object3d = scene.getMeshByUniqueId(uniqueId);
          if (object3d) {
            scene.removeMesh(object3d);
            object3d.dispose();
          }
        }
        return world;
      });
    };

    this.entitySystem = EntitySystem(this.scene);
    this.positionSystem = PositionSystem(this.scene);
    this.rotationSystem = RotationSystem(this.scene);

    const entity = this.createBoxEntity(new Vector3(0, 0, 20));

    window.addEventListener('keydown', (e) => {
      if (e.key === '1') {
        removeEntity(this.world, entity);
      }
    });
  }

  public createBoxEntity(poisition: Vector3): number {
    const entity = addEntity(this.world);
    addComponent(this.world, MeshComponent, entity);
    addComponent(this.world, Position, entity);
    Position.x[entity] = poisition.x;
    Position.y[entity] = poisition.y;
    Position.z[entity] = poisition.z;
    return entity;
  }

  public update() {
    this.entitySystem && this.entitySystem(this.world);
    this.positionSystem && this.positionSystem(this.world);
    this.rotationSystem && this.rotationSystem(this.world);
  }

  public start() {
    this.createEntity();
    this.engine.runRenderLoop(this._renderLoopHandler);
  }

  public stop() {
    this.engine.stopRenderLoop(this._renderLoopHandler);
    window.removeEventListener('resize', this._resizeHandler);
  }

  private _renderLoopHandler = () => {
    if (this.scene.activeCamera) {
      this.update();
      this.scene.render();
    }
  };

  private _resizeHandler = () => {
    this.engine.resize();
  };
}
