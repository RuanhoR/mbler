import { styleText } from 'node:util'
import { showText } from '../utils'
export class Progress {
  private max: number
  constructor(max: number) {
    this.max = max
  }

  update(current: number) {
    const percentage = Math.min(current, this.max) / this.max
    const barWidth = 30
    const filledWidth = Math.round(barWidth * percentage)
    const emptyWidth = barWidth - filledWidth
    const filledBar = styleText('green', '█'.repeat(filledWidth))
    const emptyBar = styleText('white', '█'.repeat(emptyWidth))
    const progressBar = `${filledBar}${emptyBar}`
    const percentText = styleText('blue', `${Math.round(percentage * 100)}%`)
    const progressText = `\n\u001B[1A\r[${progressBar}] ${percentText} (${current}/${this.max})`
    showText(progressText, false)
    if (current == this.max) {
      showText('', true)
    }
  }
}
