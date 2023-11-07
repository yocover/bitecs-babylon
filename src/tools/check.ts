export class WebGLCompatibilityChecker {
  /**
   * Checks if WebGL is available and returns a boolean
   * @returns
   */
  public static isWebGLAvailable(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Checks if WebGL 2 is available and returns a boolean
   * @returns
   */
  public static isWebGL2Available(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
    } catch (e) {
      return false;
    }
  }

  /**
   * Get a string message about the availability of WebGL
   * @returns
   */
  public static getWebGLStatusMessage(): string {
    if (this.isWebGL2Available()) {
      return 'WebGL 2 is supported';
    } else if (this.isWebGLAvailable()) {
      return 'WebGL is supported, but WebGL 2 is not';
    } else {
      return 'WebGL is not supported';
    }
  }
}
