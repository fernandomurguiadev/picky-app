import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import type { Order } from './entities/order.entity.js';
import type { StatusHistoryEntry } from './entities/order.entity.js';

@WebSocketGateway({
  cors: { origin: '*' }, // Se valida por tenant en handleConnection
  namespace: '/',
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket): void {
    const token = client.handshake.auth?.token as string | undefined;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        algorithms: ['RS256'],
      });
      client.data['tenantId'] = payload.tenantId;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket): void {
    // Socket.io gestiona el cleanup automáticamente
  }

  @SubscribeMessage('join-tenant')
  handleJoinTenant(
    @MessageBody() data: { tenantId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    const socketTenantId = client.data['tenantId'] as string | undefined;
    if (!socketTenantId || socketTenantId !== data.tenantId) {
      client.disconnect();
      return;
    }
    void client.join(`tenant:${data.tenantId}`);
  }

  emitOrderNew(tenantId: string, order: Order): void {
    this.server.to(`tenant:${tenantId}`).emit('order:new', order);
  }

  emitOrderStatusChanged(
    tenantId: string,
    payload: { orderId: string; newStatus: string; statusHistory: StatusHistoryEntry[] },
  ): void {
    this.server.to(`tenant:${tenantId}`).emit('order:status-changed', payload);
  }
}
