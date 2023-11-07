import { World, WorldOptions } from 'ecsy';
import { AnimationManager } from './animation';

/**
 * Extend World and inherit the manager attribute to associate Babylon with Ecsy
 */
export class BaseWorld extends World {
  /**
   * Babylon.js related rendering tasks
   */
  public animationManager: AnimationManager;

  constructor(options?: WorldOptions) {
    super(options);

    this.animationManager = new AnimationManager();
  }
}
