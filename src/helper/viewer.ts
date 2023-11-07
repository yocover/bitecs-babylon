import * as Babylon from '@babylonjs/core';
import * as BabylonGui from '@babylonjs/gui';
import * as BabylonMaterials from '@babylonjs/materials';
import { HelperPerformance } from './performance';

/**
 * The Viewer class provides a collection of tools for visual debugging, performance monitoring,
 * and other auxiliary features within a Babylon.js scene.
 */
export class Viewer {
  // Performance monitor object for collecting and displaying performance data.
  private performanceMonitor: HelperPerformance | null = null;

  // Axes viewer object for displaying reference axes within the scene.
  private axesViewer: Babylon.AxesViewer | null = null;

  // Grid object for creating a ground reference grid within the scene.
  private grid: Babylon.Mesh | null = null;

  /**
   * Constructs a Viewer instance.
   * @param scene The BABYLON.Scene instance.
   * @param ui Optional, an instance of BABYLONGUI.AdvancedDynamicTexture for adding UI elements within the scene.
   */
  constructor(
    private scene: Babylon.Scene,
    private ui?: BabylonGui.AdvancedDynamicTexture
  ) {}

  /**
   * Initializes the performance monitor, should be called when UI is provided.
   */
  initPerformanceMonitor() {
    if (!this.ui) {
      throw new Error('UI not provided for performance monitor initialization.');
    }
    this.performanceMonitor = new HelperPerformance(this.scene, this.ui);
  }

  /**
   * Disposes of the performance monitor resources.
   */
  disposePerformanceMonitor() {
    this.performanceMonitor?.dispose();
    this.performanceMonitor = null;
  }

  /**
   * Toggles the visibility of the performance monitor.
   * @param shouldShow Boolean indicating whether to show the performance monitor.
   */
  togglePerformanceMonitor(shouldShow: boolean) {
    if (shouldShow) {
      this.initPerformanceMonitor();
    } else {
      this.disposePerformanceMonitor();
    }
  }

  /**
   * Attaches a control event to a UI element.
   * @param buttonElementId The ID of an HTML button element.
   * @param action The action function to execute on button click.
   */
  attachControlToUI(buttonElementId: string, action: () => void) {
    const button = document.getElementById(buttonElementId) as HTMLElement;
    button.addEventListener('click', () => {
      action();
    });
  }

  /**
   * Sets the loading time, updating the performance monitor's data.
   * @param value The numerical value of the loading time.
   */
  setLoadingTime(value: number) {
    this.performanceMonitor?.setLoadingTime(value);
  }

  /**
   * Displays axes in the scene.
   * @param size The size of the axes.
   */
  showAxes(size: number) {
    if (!this.axesViewer) {
      this.axesViewer = new Babylon.AxesViewer(this.scene, size);
    }
  }

  /**
   * Disposes of the axes viewer resources.
   */
  disposeAxes() {
    this.axesViewer?.dispose();
    this.axesViewer = null;
  }

  /**
   * Logs a message to the console.
   * @param message The message to log.
   * @param level The log level, defaults to 'info'.
   */
  log(message: any, level = 'info') {
    switch (level) {
      case 'info':
        console.warn(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'error':
        console.error(message);
        break;
      default:
        console.warn(message);
    }
  }

  /**
   * Displays a grid in the scene.
   * @param size The size of the grid.
   */
  showGrid(size: number) {
    this.disposeGrid(); // Ensure any existing grid is disposed before creating a new one.

    const gridMaterial = new BabylonMaterials.GridMaterial('gridMaterial', this.scene);
    this.applyGridMaterialProperties(gridMaterial);

    this.grid = Babylon.MeshBuilder.CreateGround('grid', { width: size, height: size }, this.scene);
    this.grid.material = gridMaterial;
  }

  /**
   * Applies properties to the grid material.
   * @param gridMaterial The grid material object.
   */
  private applyGridMaterialProperties(gridMaterial: BabylonMaterials.GridMaterial) {
    gridMaterial.majorUnitFrequency = 10;
    gridMaterial.minorUnitVisibility = 0.45;
    gridMaterial.gridRatio = 1;
    gridMaterial.backFaceCulling = false;
    gridMaterial.mainColor = new Babylon.Color3(0.2, 0.2, 0.5);
    gridMaterial.lineColor = new Babylon.Color3(0.0, 0.0, 0.0);
    gridMaterial.opacity = 0.8;
  }

  /**
   * Disposes of the grid resources.
   */
  disposeGrid() {
    if (this.grid) {
      this.scene.removeMesh(this.grid);
      this.grid.dispose();
      this.grid = null;
    }
  }

  /**
   * Displays the skeleton structure in the scene.
   * @param scene The BABYLON.Scene instance.
   * @param skeleton The BABYLON.Skeleton instance to be visualized.
   * @param mesh The BABYLON.Mesh instance to which the skeleton is attached.
   */
  public static showSkeleton(
    scene: Babylon.Scene,
    skeleton: Babylon.Skeleton,
    mesh: Babylon.Mesh
  ): void {
    const options = {
      pauseAnimations: false, // Whether to pause animations or not.
      returnToRest: false, // Whether the skeleton should return to the rest position.
      computeBonesUsingShaders: true, // Whether to compute bone transformations using shaders.
      useAllBones: false, // Whether to use all bones for the skeleton viewer.
      displayMode: Babylon.SkeletonViewer.DISPLAY_SPHERE_AND_SPURS, // Display mode for the skeleton.
      displayOptions: {
        // Visual options for the skeleton display.
        sphereBaseSize: 1, // Base size for spheres.
        sphereScaleUnit: 10, // Scaling unit for spheres.
        sphereFactor: 0.9, // Factor for scaling spheres.
        midStep: 0.25, // Intermediate step for linear interpolation.
        midStepFactor: 0.05 // Factor for the intermediate step.
      }
    };
    // Create a new SkeletonViewer instance.
    const skeletonView = new Babylon.SkeletonViewer(
      skeleton,
      mesh,
      scene,
      false, // Should the bone matrices auto-update?
      mesh.renderingGroupId > 0 ? mesh.renderingGroupId + 1 : 1, // Determine the rendering group ID.
      options
    );
  }
}
