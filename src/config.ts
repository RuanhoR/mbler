import { tmpdir } from 'node:os'
import * as path from 'node:path'

const config = {
  tmpdir: path.join(tmpdir(), '.mbler'),
  defaultPmnxBASE: 'https://d.pmnx.qzz.io',
}
export default config
