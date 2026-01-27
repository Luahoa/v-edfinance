import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      const authHeader = client.handshake.headers.authorization;
      const data = context.switchToWs().getData();

      if (!authHeader) {
        throw new WsException('Missing authorization header');
      }

      const [type, token] = authHeader.split(' ');
      if (type !== 'Bearer' || !token) {
        throw new WsException('Invalid authorization type');
      }

      const payload = await this.jwtService.verifyAsync(token);

      if (typeof data === 'object' && data !== null) {
        data.user = payload;
      }

      return true;
    } catch (err) {
      this.logger.error(`WS Authorization failed: ${err.message}`);
      throw new WsException('Unauthorized access');
    }
  }
}
