import { Inject, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { CACHE_PROVIDER, CacheRepository } from '@/shared/cache'
import { ACCESS_SECRET, REFRESH_SECRET } from '@/shared/constants'
import { UserService } from './imports/user'

export interface BaseUserPayload {
  uid: number
  permissions: string[]
}

export interface UserPayload extends BaseUserPayload {
  accessToken: string
  refreshToken: string
}

export interface UserInfo {
  username: string
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_PROVIDER) private cacheRepository: CacheRepository,
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async generateTokens(uid: number) {
    const me = { uid, permissions: [] } satisfies BaseUserPayload
    const accessToken = this.jwtService.sign(me, { secret: ACCESS_SECRET, expiresIn: '1h' })
    const refreshToken = this.jwtService.sign(me, { secret: REFRESH_SECRET, expiresIn: '7d' })
    const payload = { ...me, accessToken, refreshToken }
    await Promise.all([
      this.cacheRepository.set(accessToken, JSON.stringify(payload)),
      this.cacheRepository.set(refreshToken, JSON.stringify(payload)),
    ])
    return {
      accessToken,
      refreshToken,
    }
  }

  async verifyAccessToken(token: string) {
    this.jwtService.verify(token, { secret: ACCESS_SECRET })
    return true
  }

  async verifyRefreshToken(token: string) {
    this.jwtService.verify(token, { secret: REFRESH_SECRET })
    return true
  }

  async removeToken(token: string) {
    const userPayload = await this.cacheRepository.get(token) || 'null'
    const payload = JSON.parse(userPayload) as UserPayload
    if (payload) {
      await Promise.all([
        this.cacheRepository.del(payload.accessToken),
        this.cacheRepository.del(payload.refreshToken),
      ])
      return true
    }
    return false
  }

  async getUserPayloadByToken(token: string) {
    const value = await this.cacheRepository.get(token)
    if (!value) {
      return null
    }
    return JSON.parse(value) as UserPayload
  }

  async getUserMe(id: number): Promise<UserInfo> {
    const user = await this.userService.getUserById(id)
    if (!user) {
      return null
    }
    return {
      username: user.username,
    }
  }
}
