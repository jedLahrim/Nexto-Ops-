import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ItsmService } from '../itsm.service';
import { UserService } from '../../user/user.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../user/guards/jwt-auth.guard';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/tickets',
})
export class TicketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly itsmService: ItsmService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(client: Socket) {
    // In a real app, verify the JWT from the handshake
    const token = client.handshake.auth.token;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      // Decode the JWT (mocking standard verify logic for now)
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.id) {
        client.disconnect();
        return;
      }
      
      const user = await this.userService.findOne(decoded.id);
      if (!user) {
        client.disconnect();
        return;
      }
      
      client.data.user = user;
    } catch (err) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Optional disconnect logic
  }

  @SubscribeMessage('join_ticket')
  handleJoinTicket(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { incidentId: string }
  ) {
    if (!client.data.user) return;
    client.join(`ticket_${data.incidentId}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { incidentId: string; content: string }
  ) {
    const user = client.data.user;
    if (!user) return;

    try {
      const message = await this.itsmService.addMessage(data.incidentId, user, data.content);
      
      // Broadcast to everyone in the room (including sender)
      this.server.to(`ticket_${data.incidentId}`).emit('new_message', {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        sender: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
        }
      });
    } catch (e) {
      client.emit('error', 'Failed to send message');
    }
  }
}
