import { InstanceComponent } from '@/components';
import { IDisposable } from '@babylonjs/core';
import { Attributes, Component, ComponentConstructor, Entity } from 'ecsy';
import { BaseSystem } from './base';
import { BaseWorld } from './world';
import { Ensure } from '@/tools';

/**
 * Abstract class define an interface for all classes that hold resources
 * Extended from BaseSystem, used to create, update and destroy instances of Babylon.js
 * Subclasses can extend this class to implement specific creation, update, and destruction logic.
 * Facilitates the management of object life cycles in programs.
 * @param C: A Component that contains the data required to create an instance.
 * @param D: Holds the reference associated with the Babylon.js instance.
 * @param I: When the component is removed, it can be properly cleaned and destroyed
 * @see https://doc.babylonjs.com/typedoc/interfaces/BABYLON.IDisposable
 */
export abstract class RenderableSystem<
  C extends Component<unknown>,
  D extends InstanceComponent<unknown, I>,
  I extends IDisposable
> extends BaseSystem {
  /**
   * Abstract method that creates an IDisposable instance based on the given Component.
   * @param component Component
   */
  protected abstract create(component: C): I;

  /**
   * Constructor used to create instance components.
   */
  protected abstract instanceComponentConstructor: ComponentConstructor<D>;

  /**
   * Constructor used to create factory components.
   */
  protected factoryComponentConstructor: ComponentConstructor<C>;

  /**
   * Defines whether instances should be recreated when the factory component is updated.
   */
  protected recreateInstanceOnUpdate = false;

  /**
   * When a component is updated and a transition exists, the target properties are applied to the instance.
   */
  protected transitionTarget?: string;

  constructor(world: BaseWorld, attributes?: Attributes) {
    super(world, attributes);

    Ensure(
      'System derived from RenderableSystem must define "factory" query',
      typeof (this.constructor as typeof RenderableSystem).queries.factory !== 'undefined'
    );

    this.factoryComponentConstructor = (this.constructor as typeof RenderableSystem).queries.factory
      .components[0] as ComponentConstructor<C>;
  }

  /**
   * Override the execute method of BaseSystem
   */
  public execute(): void {
    super.execute();

    this.queries.factory.added?.forEach((e: Entity) => this.setup(e));
    this.queries.factory.changed?.forEach((e: Entity) => this.update(e));
    this.queries.factory.removed?.forEach((e: Entity) => this.remove(e));

    super.afterExecute();
  }

  /**
   * Each new entity creates a new instance and associates it with the entity
   * @param entity
   */
  public setup(entity: Entity): void {
    const c = entity.getComponent(this.factoryComponentConstructor)!;

    const instance = this.create(c);
    this.addInstance(entity, instance);
  }

  /**
   * If recreateInstanceOnUpdate is set, the instance is recreated for the changed entity.
   * Otherwise, the instance's properties may be updated
   * @param entity
   */
  public update(entity: Entity): void {
    const c = entity.getComponent(this.factoryComponentConstructor)!;

    if (this.recreateInstanceOnUpdate) {
      const instanceComponent = entity.getMutableComponent(this.instanceComponentConstructor);
      Ensure('No instance component found', instanceComponent);

      const instance = this.create(c);
      instanceComponent.value = instance;
    } else {
      const instanceComponent = entity.getComponent(this.instanceComponentConstructor);
      Ensure('No instance found', instanceComponent?.value);
      if (this.transitionTarget) {
        this.world.animationManager.updateProperties(
          entity,
          instanceComponent.value,
          this.transitionTarget,
          c
        );
      } else {
        this.world.animationManager.setProperties(entity, instanceComponent.value, c);
      }
    }
  }

  /**
   * Clean up and destroy instances associated with entities
   * @param entity
   */
  public remove(entity: Entity): void {
    this.removeInstance(entity);
  }

  /**
   * Used to manage the addition of instances
   * @param entity
   * @param instance
   */
  private addInstance(entity: Entity, instance: I): void {
    const instanceComponent = entity.getMutableComponent(this.instanceComponentConstructor);
    if (instanceComponent) {
      instanceComponent.value = instance;
    } else {
      entity.addComponent(
        this.instanceComponentConstructor as ComponentConstructor<InstanceComponent<D, I>>,
        {
          value: instance
        }
      );
    }
  }

  /**
   * Used to manage the removal of instances
   * @param entity
   */
  private removeInstance(entity: Entity): void {
    const instanceComponent = entity.getComponent(this.instanceComponentConstructor, true);
    Ensure('No instance component found', instanceComponent?.value);

    entity.removeComponent(this.instanceComponentConstructor);
    instanceComponent.value.dispose();
  }
}
