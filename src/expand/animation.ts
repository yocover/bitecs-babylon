import {
  Color3,
  Color4,
  IAnimatable,
  Matrix,
  Quaternion,
  Scene,
  Vector2,
  Vector3
} from '@babylonjs/core';
import { Entity } from 'ecsy';
import { Animation } from '@babylonjs/core';
import { TransitionConfig } from '@/components';
import { Ensure, mergeProperties, updateComponentProperty } from '@/tools';

// Framerate (in frame/s)
const DEFAULT_FRAMERATE = 60;

/**
 * Handle Babylonjs animation and property transition functions
 */
export class AnimationManager {
  /**
   * Handle animation creation, keyframes, type, and startup
   */
  private transitionRegistry = new WeakMap<Entity, Map<string, TransitionConfig>>();

  /**
   * Babylon Animation
   * @see https://doc.babylonjs.com/typedoc/classes/BABYLON.Animation
   */
  private Animation?: typeof Animation;

  /**
   * Set animation class dependencies
   * @param AnimationClass
   */
  public injectAnimationDependencies(AnimationClass: typeof Animation): void {
    this.Animation = AnimationClass;
  }

  /**
   * Set more properties on the target object
   * @param _entity
   * @param target
   * @param props
   */
  public setProperties(_entity: Entity, target: object, props: Record<string, unknown>): void {
    mergeProperties(target, props);
  }

  /**
   * Set one properties on the target object
   * @param _entity
   * @param target
   * @param property
   * @param value
   */
  public setProperty(_entity: Entity, target: object, property: string, value: unknown): void {
    updateComponentProperty(target as never, property, value as never);
  }

  /**
   * Update object properties
   * @param entity
   * @param target
   * @param transitionTarget
   * @param props
   */
  public updateProperties(
    entity: Entity,
    target: object,
    transitionTarget: string,
    props: Record<string, unknown>
  ): void {
    Object.entries(props).forEach(([property, value]) =>
      this.updateProperty(entity, target, transitionTarget, property, value)
    );
  }

  /**
   * Update object properties
   * @param entity
   * @param target
   * @param transitionTarget
   * @param property
   * @param value
   */
  public updateProperty(
    entity: Entity,
    target: object,
    transitionTarget: string,
    property: string,
    value: unknown
  ): void {
    const transitionKey = transitionTarget + '.' + property;
    const transition = this.getTransition(entity, transitionKey);

    if (this.hasAnimationSupport && transition && transition.duration > 0) {
      this.transitionProperty(target as never, transition, property, value);
    } else {
      updateComponentProperty(target as never, property, value as never);
    }
  }

  /**
   * Register config
   * @param entity
   * @param config
   */
  public registerTransition(entity: Entity, config: TransitionConfig): void {
    if (!this.transitionRegistry.has(entity)) {
      this.transitionRegistry.set(entity, new Map<string, TransitionConfig>());
    }

    const transitionSet = this.transitionRegistry.get(entity)!;
    transitionSet.set(config.property, config);
  }

  /**
   * Unregister transitions
   * @param entity
   * @param config
   */
  public unregisterTransition(entity: Entity, config?: TransitionConfig): void {
    if (config) {
      const transitions = this.transitionRegistry.get(entity);
      if (transitions) {
        transitions.delete(config.property);
      }
    } else {
      this.transitionRegistry.delete(entity);
    }
  }

  /**
   * Handle animation creation, keyframes, defining types and startup
   * @param target
   * @param transitionConfig
   * @param property
   * @param value
   */
  private transitionProperty(
    target: IAnimatable & { getScene: () => Scene },
    transitionConfig: TransitionConfig,
    property: string,
    value: unknown
  ): void {
    const scene = target.getScene();
    const { frameRate = DEFAULT_FRAMERATE, duration, easingFunction } = transitionConfig;
    const { Animation } = this;

    Ensure('Cannot transition property without Animation support', Animation);

    const initial: unknown = (target as any)[property].clone
      ? (target as any)[property].clone()
      : (target as any)[property];
    const transition = new Animation(
      `${property}Transition`,
      property,
      frameRate,
      this.getAnimationType(value),
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    if (easingFunction) {
      transition.setEasingFunction(easingFunction);
    }

    const endFrame: number = frameRate * (duration / 1000);

    transition.setKeys([
      {
        frame: 0,
        value: initial
      },
      {
        frame: endFrame,
        value
      }
    ]);

    scene.beginDirectAnimation(target, [transition], 0, endFrame, false);
  }

  /**
   * Get animation type
   * @param value
   * @returns
   */
  private getAnimationType(value: unknown): number {
    const { Animation } = this;

    if (value instanceof Vector2) {
      return Animation!.ANIMATIONTYPE_VECTOR2;
    }
    if (value instanceof Vector3) {
      return Animation!.ANIMATIONTYPE_VECTOR3;
    }
    if (value instanceof Color3) {
      return Animation!.ANIMATIONTYPE_COLOR3;
    }
    if (value instanceof Color4) {
      return Animation!.ANIMATIONTYPE_COLOR4;
    }
    if (value instanceof Matrix) {
      return Animation!.ANIMATIONTYPE_MATRIX;
    }
    if (value instanceof Quaternion) {
      return Animation!.ANIMATIONTYPE_QUATERNION;
    }
    if (typeof value === 'number') {
      return Animation!.ANIMATIONTYPE_FLOAT;
    }

    throw new Error(`Could not determine animation type for value ${String(value)}`);
  }

  /**
   * Get the transition config of entity
   * @param entity
   * @param property
   * @returns
   */
  private getTransition(entity: Entity, property: string): TransitionConfig | undefined {
    const propertyMap = this.transitionRegistry.get(entity);
    if (!propertyMap) {
      return undefined;
    }

    return propertyMap.get(property);
  }

  /**
   * Check whether dependencies are injected
   */
  private get hasAnimationSupport(): boolean {
    return !!this.Animation;
  }
}
