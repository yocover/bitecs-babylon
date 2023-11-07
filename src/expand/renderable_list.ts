import { InstanceArrayComponent } from '@/components';
import { IDisposable } from '@babylonjs/core';
import { Attributes, Component, ComponentConstructor, Entity } from 'ecsy';
import { Constructor } from '@/types/types';
import { BaseSystem } from './base';
import { BaseWorld } from './world';
import { Ensure } from '@/tools';

/**
 * Extend BaseSystem for managing Babylon.js
 * Lifecycle of releasable resources (such as meshes, lights, etc.).
 * Allowing handling of different types of components and instances
 * @param C: A Component that contains the data required to create an instance.
 * @param D: Holds the reference associated with the Babylon.js instance.
 * @param I: When the component is removed, it can be properly cleaned and destroyed
 */
export abstract class RenderableListSystem<
  C extends Component<unknown>,
  D extends InstanceArrayComponent<D, I>,
  I extends IDisposable
> extends BaseSystem {
  protected abstract create(component: C): I;
  protected abstract instanceComponentConstructor: ComponentConstructor<D>;
  protected factoryComponentConstructor: ComponentConstructor<C>;
  protected abstract instanceConstructor: Constructor<I>;

  constructor(world: BaseWorld, attributes?: Attributes) {
    super(world, attributes);

    Ensure(
      'System derived from RenderableSystem must define "factory" query',
      typeof (this.constructor as typeof RenderableListSystem).queries.factory !== 'undefined'
    );

    this.factoryComponentConstructor = (this.constructor as typeof RenderableListSystem).queries
      .factory.components[0] as ComponentConstructor<C>;
  }

  /**
   * Abstract method that creates an IDisposable instance based on the given Component.
   * @param component Component
   */
  execute(): void {
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
  setup(entity: Entity): void {
    const c = entity.getComponent(this.factoryComponentConstructor)!;

    const instance = this.create(c);
    this.addInstance(entity, instance);
  }

  /**
   * Set new properties for the instance
   * @param entity
   */
  update(entity: Entity): void {
    const c = entity.getComponent(this.factoryComponentConstructor)!;
    const instanceComponent = entity.getComponent(this.instanceComponentConstructor);
    Ensure('No instance component found', instanceComponent);
    const ic = instanceComponent as InstanceArrayComponent<unknown, I>;
    Ensure('Existing instance array component has invalid value', ic.value);
    const instance = ic.value.find((i) => i instanceof this.instanceConstructor);
    Ensure('No instance found', instance);
    this.updateInstance(entity, instance, c);
  }

  /**
   * Remove entity
   * @param entity 
   */
  remove(entity: Entity): void {
    this.removeInstance(entity);
  }

  /**
   * Update instance
   * Can be overridden by subclasses to implement specific update logic
   * @param entity 
   * @param instance 
   * @param c 
   */
  protected updateInstance(entity: Entity, instance: I, c: C): void {
    this.world.animationManager.setProperties(entity, instance, c as never);
  }

  /**
   * Adds a new instance to an entity's instance array
   * @param entity 
   * @param instance 
   */
  private addInstance(entity: Entity, instance: I): void {
    const instanceComponent = entity.getMutableComponent(this.instanceComponentConstructor);
    if (instanceComponent) {
      const ic = instanceComponent as InstanceArrayComponent<unknown, I>;
      Ensure('Existing instance array component has invalid value', ic.value);
      ic.value = [...ic.value, instance];
    } else {
      entity.addComponent(
        this.instanceComponentConstructor as ComponentConstructor<InstanceArrayComponent<D, I>>,
        {
          value: [instance]
        }
      );
    }
  }

  /**
   * Remove instance
   * @param entity 
   */
  private removeInstance(entity: Entity): void {
    const instanceComponent = entity.getComponent(this.instanceComponentConstructor, true);
    Ensure('No instance component found', instanceComponent?.value);

    const ic = instanceComponent as InstanceArrayComponent<unknown, I>;
    Ensure('Existing instance array component has invalid value', ic.value);
    const removedInstance = ic.value.find((i) => i instanceof this.instanceConstructor);
    Ensure('No instance found to remove', removedInstance);
    const instances = ic.value.filter((i) => i !== removedInstance);

    if (instances.length > 0) {
      const _instanceComponent = entity.getMutableComponent(
        this.instanceComponentConstructor
      ) as InstanceArrayComponent<unknown, I>;
      _instanceComponent.value = instances;
    } else {
      entity.removeComponent(this.instanceComponentConstructor);
    }
    removedInstance.dispose();
  }
}
