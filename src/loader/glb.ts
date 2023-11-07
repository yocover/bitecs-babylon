import { Scene, Nullable, MeshAssetTask, AssetsManager } from '@babylonjs/core';

export class GLBLoader {
  private scene: Scene;
  private assetsManager: AssetsManager;
  private meshesCache: Map<string, Nullable<MeshAssetTask>>;

  // Constructor is simplified and clear about its purpose
  constructor(scene: Scene) {
    this.scene = scene;
    this.assetsManager = new AssetsManager(this.scene);
    this.meshesCache = new Map();
  }

  /**
   * Loading GLB files now returns a nullable type for better type checking
   * @param name
   * @param url
   * @param fileName
   * @returns
   */
  async loadGLB(name: string, url: string, fileName: string): Promise<Nullable<MeshAssetTask>> {
    // Early return if mesh is already loaded
    const cachedTask = this.meshesCache.get(name);
    if (cachedTask) {
      return cachedTask;
    }

    // Wrapping the loading logic into a separate method for cleaner code
    try {
      const task = await this.addMeshTask(name, url, fileName);
      this.meshesCache.set(name, task); // Update the cache on success
      return task;
    } catch (error) {
      console.error(`Error loading GLB file: ${name}`, error);
      throw error; // Re-throwing the error to allow caller handling
    }
  }

  /**
   * Extracted mesh loading logic for better readability
   * @param name
   * @param url
   * @param fileName
   * @returns
   */
  private addMeshTask(name: string, url: string, fileName: string): Promise<MeshAssetTask> {
    return new Promise((resolve, reject) => {
      const meshTask = this.assetsManager.addMeshTask(name, '', url, fileName);

      meshTask.onSuccess = (task) => resolve(task);
      meshTask.onError = (_task, message) => reject(new Error(message));

      this.assetsManager.load();
    });
  }

  /**
   * Method to get the loaded mesh with explicit null if not found
   * @param name
   * @returns
   */
  getMesh(name: string): Nullable<MeshAssetTask> {
    return this.meshesCache.get(name) ?? null; // Using nullish coalescing operator
  }

  /**
   * Method to clear the cache with confirmation
   * @returns
   */
  clearCache(): boolean {
    this.meshesCache.clear();
    return this.meshesCache.size === 0; // Returns true if cache is cleared successfully
  }
}
