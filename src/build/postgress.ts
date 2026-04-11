import { showText } from "../utils";
import _chalk from "chalk"
// cjs support
const chalk = _chalk instanceof Function ? _chalk : (_chalk as unknown as typeof import("chalk")).default
export class Postgress {
  private max: number;
  constructor(max: number) {
    this.max = max;
  }

  update(current: number) {
    process.stdout.write('\x1b[1A');
    process.stdout.write('\x1b[K');
    const percentage = Math.min(current, this.max) / this.max;
    const barWidth = 30;
    const filledWidth = Math.round(barWidth * percentage);
    const emptyWidth = barWidth - filledWidth;
    const filledBar = chalk.green('█'.repeat(filledWidth));
    const emptyBar = chalk.white('█'.repeat(emptyWidth));
    const progressBar = `${filledBar}${emptyBar}`;
    const percentText = chalk.blue(`${Math.round(percentage * 100)}%`);
    const progressText = `[${progressBar}] ${percentText} (${current}/${this.max})`;
    showText(progressText);
    if (current >= this.max) {
      showText('');
    }
  }
}