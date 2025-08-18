import { Events } from 'flashmatch-multiplayer-shared';
import { Socket } from 'socket.io';

export const sendPlayerJoinedInfo = (
  socket: Socket,
  roomName: string,
  evt: Events['playerJoined']['name'],
  payload: Events['playerJoined']['payload']
) => {
  socket.to(roomName).emit(evt, payload);
};
