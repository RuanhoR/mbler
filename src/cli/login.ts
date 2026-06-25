import { input, showText } from '../utils'
import { TokenManager } from '../publisher/tokenManager'
import { defineCommand } from './command'

export const loginCommand = defineCommand({
  name: 'login',
  aliases: [],
  description: 'mbler login <?:token>\nUse token login your pmnx account',
  args: [{ name: 'token', description: 'Auth token' }],
  options: [],
  async handler(ctx) {
    let token = ctx.args.token
    if (!token) {
      token = await input('Token: ', true)
    }

    if (!token) {
      showText('Token is required')
      return -1
    }
    try {
      const prevToken = await TokenManager.getToken()
      await TokenManager.setToken(token.trim())
      await TokenManager.waitVerify()
      if (!TokenManager.isLogin) {
        if (prevToken && typeof prevToken === 'string') {
          await TokenManager.setToken(prevToken)
          await TokenManager.waitVerify()
        }
        showText('Login failed: invalid token')
        return -1
      }
      showText(
        `Login successful: ${TokenManager.user?.name || 'unknown user'}`
      )
      return 0
    } catch (error) {
      showText(
        `Login failed: ${error instanceof Error ? error.message : String(error)}`
      )
      return -1
    }
  },
})
