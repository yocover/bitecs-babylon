import consola from 'consola';
enum LogLevel {
  Debug,
  Info,
  Warn,
  Error
}

export class Logger {
  static level: LogLevel = LogLevel.Debug;

  static debug(message: string, ...optionalParams: any[]) {
    if (Logger.level <= LogLevel.Debug) {
      consola.debug(`[Debug]: ${message}`, ...optionalParams);
    }
  }

  static info(message: string, ...optionalParams: any[]) {
    if (Logger.level <= LogLevel.Info) {
      consola.debug(`[Info]: ${message}`, ...optionalParams);
    }
  }

  static warn(message: string, ...optionalParams: any[]) {
    if (Logger.level <= LogLevel.Warn) {
      consola.warn(`[Warn]: ${message}`, ...optionalParams);
    }
  }

  static error(message: string, ...optionalParams: any[]) {
    if (Logger.level <= LogLevel.Error) {
      consola.error(`[Error]: ${message}`, ...optionalParams);
    }
  }

  // Function to set the logger level from outside
  static setLevel(level: LogLevel) {
    Logger.level = level;
  }
}
