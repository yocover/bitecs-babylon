import { CoreComponent } from '@/components';
import { BaseWorld } from '@/expand';
import { System, SystemQueries } from 'ecsy';

/**
 * Base systems
 * Systems extension, which provides additional functionality so that the system
 * can interact directly with the Babylon.js rendering engine
 */
export class BaseSystem extends System {
  /**
   * Instance Babylonjs scene、engine、camera
   */
  public declare world: BaseWorld;

  /**
   * Contains components for rendering the core properties of the world (such as scenes, cameras, etc.)
   */
  public core?: CoreComponent;

  /**
   * Extends System，updateloop func
   */
  public execute(): void {
    if (this.queries.core.added?.length) {
      if (this.queries.core.added.length > 1) {
        throw new Error('More than 1 core has been added.');
      }
      this.core = this.queries.core.added[0].getComponent(CoreComponent);
    }
  }

  /**
   * CoreComponent method onAfterRender
   */
  public afterExecute(): void {
    if (this.queries.core.removed?.length) {
      this.core = undefined;
    }
  }

  public static queries: SystemQueries = {
    core: {
      components: [CoreComponent],
      listen: {
        added: true,
        removed: true
      }
    }
  };
}
