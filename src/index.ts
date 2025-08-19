import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Games, Events, Ack } from 'flashmatch-multiplayer-shared';
import { sendPlayerJoinedInfo } from './utils';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

const ROOMS: Record<string, { lastUpdated: number; players: Record<string, number>; connected: number }> = {};
// interval check if no one is in the room for > 10 minutes...
setInterval(() => {
  const now = performance.now();
  let toDelete: string[] = [];
  Object.keys(ROOMS).forEach((roomId) => {
    if (ROOMS[roomId].connected == 0 && Math.round(now - ROOMS[roomId].lastUpdated) > 30000) {
      toDelete.push(roomId);
    }
  });
  console.log('before delete ', ROOMS);
  console.log('to delete', toDelete);
  toDelete.forEach((roomId) => {
    delete ROOMS[roomId];
  });
  console.log('after delete ', ROOMS);
}, 30000);

// events
const joinRoom: Events['joinRoom']['name'] = 'joinRoom';
const playerJoined: Events['playerJoined']['name'] = 'playerJoined';

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on(joinRoom, (payload: Events['joinRoom']['payload'], callback: (response: Ack) => void) => {
    const roomName = `${payload.gameName}-${payload.roomid}`;

    if (ROOMS[roomName]) {
      const players = ROOMS[roomName].players;
      ROOMS[roomName].lastUpdated = performance.now();
      if (players[payload.playerName]) {
        ROOMS[roomName].connected += 1;
        socket.join(roomName);
        socket.data.room = roomName;
        callback({ success: true, order: players[payload.playerName] });
        sendPlayerJoinedInfo(socket, roomName, playerJoined, {
          number: players[payload.playerName],
          playerName: payload.playerName,
        });
      } else {
        if (Object.values(ROOMS[roomName].players).length == Games[payload.gameName].maxPlayers) {
          callback({ success: false, error: 'This room is full. Try another.' });
        } else {
          const order = Object.values(players).length + 1;
          ROOMS[roomName].players[payload.playerName] = order;
          ROOMS[roomName].connected += 1;
          socket.join(roomName);
          socket.data.room = roomName;
          callback({ success: true, order });
          sendPlayerJoinedInfo(socket, roomName, playerJoined, {
            number: order,
            playerName: payload.playerName,
          });
        }
      }
    } else {
      ROOMS[roomName] = { lastUpdated: 0, players: {}, connected: 1 };
      ROOMS[roomName].players[payload.playerName] = 1;
      ROOMS[roomName].lastUpdated = performance.now();
      socket.join(roomName);
      socket.data.room = roomName;
      callback({ success: true, order: 1 });
      sendPlayerJoinedInfo(socket, roomName, playerJoined, {
        number: 1,
        playerName: payload.playerName,
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const roomName: string = socket.data.room || '';
    if (ROOMS[roomName]) ROOMS[roomName].connected -= 1;
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
