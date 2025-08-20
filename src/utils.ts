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

export const sendMoveInfo = (
  socket: Socket,
  roomName: string,
  evt: Events['makeMove']['name'],
  payload: Events['makeMove']['payload']
) => {
  socket.to(roomName).emit(evt, payload);
};

export const sendGameState = (
  socket: Socket,
  roomName: string,
  evt: Events['syncGameState']['name'],
  payload: Events['syncGameState']['payload']
) => {
  socket.to(roomName).emit(evt, payload);
};
