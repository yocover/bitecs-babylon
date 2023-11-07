import { Scene, SceneLoader, AbstractMesh, Nullable } from '@babylonjs/core';
import '@babylonjs/core/Loading/loadingScreen';
import '@babylonjs/loaders';

/**
 * Class to load and cache 3D assets in a Babylon.js scene.
 */
export class UniversalAssetLoader {
  private scene: Scene;
  private assetsCache: Map<string, Nullable<AbstractMesh[]>>;

  constructor(scene: Scene) {
    this.scene = scene;
    this.assetsCache = new Map<string, Nullable<AbstractMesh[]>>();
  }

  /**
   * Loads an asset into the scene and caches it. If the asset is already cached, it returns the cached asset.
   * @param name - The name used to reference the cached asset.
   * @param url - The URL to the directory of the asset.
   * @param fileName - The file name of the asset.
   * @param meshNames - An array of mesh names that should be loaded from the file.
   * @returns A promise that resolves with the loaded meshes or null if an error occurred.
   */
  public loadAsset(
    name: string,
    url: string,
    fileName: string,
    meshNames: string | string[] = ''
  ): Promise<Nullable<AbstractMesh[]>> {
    // Return from cache if available
    if (this.assetsCache.has(name)) {
      return Promise.resolve(this.assetsCache.get(name)!);
    }

    // Load and cache the asset
    return new Promise((resolve, reject) => {
      SceneLoader.ImportMesh(
        meshNames,
        url,
        fileName,
        this.scene,
        (meshes) => {
          this.assetsCache.set(name, meshes);
          resolve(meshes);
        },
        null,
        (_scene, message, exception) => {
          console.error(`Error loading asset file: ${name}`, message, exception);
          reject(new Error(`Error loading asset file: ${name}, ${message}`));
        }
      );
    });
  }

  /**
   * Retrieves meshes from the cache.
   * @param name - The name of the asset to retrieve.
   * @returns The cached meshes or null if not found.
   */
  public getMeshes(name: string): Nullable<AbstractMesh[]> {
    return this.assetsCache.get(name) || null;
  }

  /**
   * Clears the cache and optionally disposes of the assets.
   * @param disposeAssets - Whether to also dispose of the cached assets.
   */
  public clearCache(disposeAssets: boolean = false) {
    if (disposeAssets) {
      this.assetsCache.forEach((meshes) => {
        meshes?.forEach((mesh) => mesh.dispose());
      });
    }
    this.assetsCache.clear();
  }
}
