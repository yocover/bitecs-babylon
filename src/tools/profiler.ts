import consola from 'consola';
import chalk from 'chalk';

export class Profiler {
  private startTime: number;
  private lastTime: number;

  constructor() {
    this.startTime = performance.now();
    this.lastTime = this.startTime;
  }

  start(): void {
    this.startTime = performance.now();
    this.lastTime = this.startTime;
    consola.log(chalk.red('Profiler started.'));
  }

  checkpoint(label: string = 'Checkpoint'): number {
    const currentTime = performance.now();
    const timeTaken = currentTime - this.lastTime;
    this.lastTime = currentTime;
    consola.log(chalk.red(`${label}: ${timeTaken.toFixed(3)}ms`));
    return timeTaken;
  }

  end(label: string = 'Total'): number {
    const currentTime = performance.now();
    const totalTimeTaken = currentTime - this.startTime;
    consola.log(chalk.red(`${label}: ${totalTimeTaken.toFixed(3)}ms`));
    return totalTimeTaken;
  }
}
