import { describe, expect, it } from 'vitest'
import sapi from '../src/build/sapi'
import { isValidVersion } from '../src/utils'
import { Build } from '../src/build'
import { devNull } from 'node:os'
describe('sapiVersion', () => {
  it('should out vaild version', async () => {
    expect(
      isValidVersion(
        await sapi.generateVersion('@minecraft/server', '1.21.100', true, false)
      )
    ).toBe(true)
    expect(
      isValidVersion(
        await sapi.generateVersion(
          '@minecraft/server-ui',
          '1.21.100',
          true,
          false
        )
      )
    ).toBe(true)
  })
  it('should out right version', async () => {
    expect(
      await sapi.generateVersion(
        '@minecraft/server-ui',
        '1.21.100',
        false,
        false
      )
    ).toBe('2.1.0-beta')
    expect(
      await sapi.generateVersion(
        '@minecraft/server-ui',
        '1.21.100',
        false,
        true
      )
    ).toBe('2.1.0-beta.1.21.100-stable')
  })
})
