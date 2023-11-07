import { PlatformUtil } from '@/tools';
import * as Babylon from '@babylonjs/core';
import * as BabylonGui from '@babylonjs/gui';

// Enum defining the metrics for performance helper
enum HelperPerformanceEnum {
  Fps = 'fps',
  TotalVertices = 'total vertices',
  TotalFace = 'total face',
  TotalMaterials = 'total materials',
  TotalMeshs = 'total meshs',
  TotalTextures = 'total textures',
  TotalLights = 'total lights',
  ActiveMeshs = 'active meshs',
  DrawCalls = 'draw calls',
  Memory = 'memory',
  RenderSize = 'render size',
  DevicePixelRatio = 'device pixel ratio',
  GpuFrameTime = 'gpu frame time',
  LoadingTime = 'loading time'
}
type HelperPerformanceType = keyof typeof HelperPerformanceEnum;

/**
 * Class to assist with performance monitoring in a Babylon.js scene
 */
export class HelperPerformance {
  private _engine: Babylon.Engine;
  private _scene: Babylon.Scene;
  private _ui: BabylonGui.AdvancedDynamicTexture;

  // private _fontSize = 12;
  private _fontSize = 24;
  private _fontFamily = '微软雅黑';

  private _textBloackListLength = Object.values(HelperPerformanceEnum).length;
  private _textBlockList: BabylonGui.TextBlock[] = [];

  private _totalDelta = 0;

  private _2dContext: CanvasRenderingContext2D;
  private _textWidthList: number[] = [];

  private _rectangle: BabylonGui.Rectangle;

  private _drawCalls = 0;
  private _onBeforeAnimationsObserver: any;
  private _onAfterRenderObserver: any;

  private _engineInstrumentation: Babylon.EngineInstrumentation;

  /**
   * Constructs the performance helper class.
   * @param scene The BABYLON.Scene instance.
   * @param ui The BABYLON.GUI.AdvancedDynamicTexture instance for UI display.
   */
  constructor(scene: Babylon.Scene, ui: BabylonGui.AdvancedDynamicTexture) {
    if (PlatformUtil.isMobile()) {
      this._fontSize = 24;
    }
    this._rectangle = new BabylonGui.Rectangle();
    this._rectangle.width = 0;
    this._rectangle.cornerRadius = 5;
    this._rectangle.thickness = 0.001;
    this._rectangle.background = 'rgba(0.3, 0.3, 0.3, 0.001)';
    this._rectangle.horizontalAlignment = BabylonGui.Control.HORIZONTAL_ALIGNMENT_LEFT;
    this._rectangle.verticalAlignment = BabylonGui.Control.VERTICAL_ALIGNMENT_TOP;
    this._rectangle.top = '10px';
    this._rectangle.left = '10px';

    this._2dContext = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
    this._2dContext.font = this._fontSize + 'px ' + this._fontFamily;

    this._engine = scene.getEngine();
    this._scene = scene;
    this._ui = ui;
    this._ui.addControl(this._rectangle);

    for (let i = 0; i < this._textBloackListLength; i++) {
      const textBlock = this._createTextBlock(i);
      textBlock.name = Object.values(HelperPerformanceEnum)[i];
      this._textBlockList.push(textBlock);
      this._rectangle.addControl(textBlock);
    }

    this._scene.registerAfterRender(this._updateHandler);
    window.addEventListener('resize', this._resizeHandler);

    // gpu frame time
    this._engineInstrumentation = new Babylon.EngineInstrumentation(this._scene.getEngine());
    this._engineInstrumentation.captureGPUFrameTime = true;

    // draw calls
    this._onBeforeAnimationsObserver = this._scene.onBeforeAnimationsObservable.add(() => {
      this._scene.getEngine()._drawCalls.fetchNewFrame();
    });
    this._onAfterRenderObserver = this._scene.onAfterRenderObservable.add(() => {
      this._drawCalls = this._scene.getEngine()._drawCalls.current;
    });
  }

  /**
   * Disposes of the resources used by the performance helper.
   */
  dispose() {
    this._scene.unregisterAfterRender(this._updateHandler);
    this._scene.onBeforeAnimationsObservable.remove(this._onBeforeAnimationsObserver);
    this._scene.onAfterRenderObservable.remove(this._onAfterRenderObserver);
    this._rectangle.dispose();
    this._engineInstrumentation.dispose();
    window.removeEventListener('resize', this._resizeHandler);
  }

  setLoadingTime(value: number) {
    this._updateTextBlock('LoadingTime', value.toFixed(2) + 's');
  }

  /**
   * The update handler for the performance helper. Called after each render of the scene.
   */
  private _updateHandler = (): void => {
    this._totalDelta += this._engine.getDeltaTime();
    if (this._totalDelta < 1000) {
      return;
    }

    let memoryText;
    // memory
    // @ts-ignore: chrome performance has memory property
    if (performance && performance.memory) {
      // @ts-ignore: chrome performance has memory property
      const memory = performance.memory;
      memoryText =
        (memory.usedJSHeapSize / 1048576).toFixed() +
        ' / ' +
        (memory.jsHeapSizeLimit / 1048576).toFixed();
    } else {
      memoryText = 'unknown';
    }
    // loading time
    this._textBlockList[6].text = 'loading time: ' + 0 + 's';

    // total faces
    let faceCount = 0;
    for (let i = 0; i < this._scene.meshes.length; i++) {
      const mesh = this._scene.meshes[i];
      if (mesh instanceof Babylon.Mesh) {
        const geometry = mesh.geometry;
        if (geometry) {
          const indices = geometry.getIndices();
          if (indices) {
            faceCount += indices.length / 3;
          }
        }
      }
    }
    this._totalDelta = 0;

    const frameTime = Math.max(
      this._engineInstrumentation.gpuFrameTimeCounter.current * 1e-6,
      0
    ).toFixed(2);

    this._updateTextBlock('Fps', this._engine.getFps().toFixed(2));
    this._updateTextBlock('TotalVertices', this._scene.getTotalVertices());
    this._updateTextBlock('TotalFace', faceCount);
    this._updateTextBlock('TotalMaterials', this._scene.materials.length);
    this._updateTextBlock('TotalMeshs', this._scene.meshes.length);
    this._updateTextBlock('TotalTextures', this._scene.textures.length);
    this._updateTextBlock('TotalLights', this._scene.lights.length);
    this._updateTextBlock('ActiveMeshs', this._scene.getActiveMeshes().length);
    this._updateTextBlock('DrawCalls', this._drawCalls.toFixed(0));
    this._updateTextBlock('Memory', memoryText);
    this._updateTextBlock(
      'RenderSize',
      this._engine.getRenderWidth() + '*' + this._engine.getRenderHeight()
    );
    this._updateTextBlock('GpuFrameTime', frameTime + 'ms');
    this._updateTextBlock('DevicePixelRatio', window.devicePixelRatio);
    this._updateUI();
  };

  private _updateUI() {
    this._textWidthList = [];

    for (let i = 0; i < this._textBlockList.length; i++) {
      const block = this._textBlockList[i];
      const textWidth = this._2dContext?.measureText(block.text).width;
      this._textWidthList.push(textWidth);
    }
    const maxWidth = this._textWidthList.sort((a, b) => b - a)[0];

    this._rectangle.width = maxWidth + 22 + 'px';

    this._rectangle.height = this._textBlockList.length * 1.1 * this._fontSize + 'px';
  }

  updateLoaingTime(loadingTime: number) {
    this._textBlockList[6].text = 'loading time: ' + (loadingTime / 1000).toFixed(2) + 's';
  }

  private _updateTextBlock(type: HelperPerformanceType, value: string | number) {
    for (let i = 0; i < this._textBlockList.length; i++) {
      const textBlock = this._textBlockList[i];
      if (textBlock.name === HelperPerformanceEnum[type]) {
        textBlock.text = textBlock.name + ': ' + value;
      }
    }
  }

  /**
   * Handles resizing of the UI elements when the window size changes.
   */
  private _resizeHandler = (): void => {
    for (let i = 0; i < this._textBloackListLength; i++) {
      this._setBlockPosition(this._textBlockList[i], i);
    }
  };

  /**
   * Creates a text block for displaying performance information.
   * @param index The index of the performance metric.
   * @returns A new TextBlock instance.
   */
  private _createTextBlock(sort: number): BabylonGui.TextBlock {
    const textblock = new BabylonGui.TextBlock();
    textblock.color = '#fafafa';
    textblock.fontSize = this._fontSize;
    textblock.fontFamily = this._fontFamily;
    this._setBlockPosition(textblock, sort);
    return textblock;
  }

  private _setBlockPosition(block: BabylonGui.TextBlock, sort: number): void {
    block.textHorizontalAlignment = BabylonGui.Control.HORIZONTAL_ALIGNMENT_LEFT;
    block.textVerticalAlignment = BabylonGui.Control.VERTICAL_ALIGNMENT_TOP;
    block.top = sort * this._fontSize + 10;
    block.paddingLeft = '10px';
    block.paddingRight = '10px';
  }
}
