import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Task } from './task.entity';

@WebSocketGateway({ cors: { origin: '*' } })
export class TodoGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('joinGroup')
  handleJoinGroup(
    @MessageBody() data: { groupId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.groupId);
    console.log(`User joined group: ${data.groupId}`);
  }

  @SubscribeMessage('leaveGroup')
  handleLeaveGroup(
    @MessageBody() data: { groupId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.groupId);
    console.log(`User left group: ${data.groupId}`);
  }

  @SubscribeMessage('addTask')
  handleAddTask(
    @MessageBody() { groupId, task }: { groupId: string; task: Task },
  ) {
    this.server.to(`GROUP-${groupId}`).emit('taskAdded', task);
  }

  @SubscribeMessage('updateTask')
  handleUpdateTask(@MessageBody() task: any) {
    this.server.to(task.groupId).emit('taskUpdated', task);
  }

  @SubscribeMessage('deleteTask')
  handleDeleteTask(@MessageBody() data: { taskId: string; groupId: string }) {
    this.server.to(data.groupId).emit('taskDeleted', data.taskId);
  }
}
