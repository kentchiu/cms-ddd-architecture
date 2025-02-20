import { Module } from '@nestjs/common'
import { JwtModule, JwtService } from '@nestjs/jwt'
import { TOKEN_SECRET } from '../constants'
import { TokenService } from './token.service'
import { CacheModule } from '../cache'

@Module({
  imports: [CacheModule, JwtModule.register({ secretOrPrivateKey: TOKEN_SECRET })],
  providers: [JwtService, TokenService],
  exports: [JwtService, TokenService],
})
export class TokenModule {}
