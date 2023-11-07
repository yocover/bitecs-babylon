import platform from 'platform';

/**
 * PlatformDetector object for storing the detected device and browser information using the platform library.
 */
export const PlatformDetector = {
  /** Operating system name */
  os: platform.os?.family,
  /** Operating system version */
  osVersion: platform.os?.version,
  /** Operating system architecture (e.g., 64-bit) */
  osArchitecture: platform.os?.architecture + '-bit',
  /** Browser name */
  browser: platform.name,
  /** Browser version */
  browserVersion: platform.version
};

/**
 * The PlatformUtil class provides static methods for retrieving and checking the platform information of the current device.
 */
export class PlatformUtil {
  /**
   * Retrieves the name of the current browser.
   * @returns {string} The name of the browser or 'unknown'.
   */
  public static getBrowser(): string {
    return PlatformDetector.browser ?? 'unknown';
  }

  /**
   * Retrieves the name of the current operating system.
   * @returns {string} The name of the operating system or 'unknown'.
   */
  public static getOS(): string {
    return PlatformDetector.os ?? 'unknown';
  }

  /**
   * Retrieves the version of the current operating system.
   * @returns {string} The version of the operating system or 'unknown'.
   */
  public static getOSVersion(): string {
    return PlatformDetector.osVersion ?? 'unknown';
  }

  /**
   * Tries to retrieve the current device model, especially for iOS and Android devices.
   * @returns {string} The model of the device or 'unknown'.
   */
  public static getDevice(): string {
    const os: string | undefined = PlatformDetector.os;
    if (os?.toLowerCase() === 'ios' || os?.toLowerCase() === 'android') {
      return platform.product ?? platform.manufacturer ?? 'unknown';
    }
    return 'unknown';
  }

  /**
   * Checks whether the current device is a mobile device.
   * @returns {boolean} Whether the device is a mobile device.
   */
  public static isMobile(): boolean {
    return ['ios', 'android'].includes(PlatformDetector.os?.toLowerCase() ?? '');
  }

  /**
   * Checks if the current operating system is Android.
   * @returns {boolean} Whether the system is Android.
   */
  public static isAndroid(): boolean {
    return PlatformDetector.os?.toLowerCase() === 'android';
  }

  /**
   * Checks if the current operating system is iOS.
   * @returns {boolean} Whether the system is iOS.
   */
  public static isIOS(): boolean {
    return PlatformDetector.os?.toLowerCase() === 'ios';
  }
}
