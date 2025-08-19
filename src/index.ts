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

// events
const joinRoom: Events['joinRoom']['name'] = 'joinRoom';
const playerJoined: Events['playerJoined']['name'] = 'playerJoined';

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on(joinRoom, (payload: Events['joinRoom']['payload'], callback: (response: Ack) => void) => {
    const roomName = `${payload.gameName}-${payload.roomid}`;
    ROOMS[roomName].lastUpdated = performance.now();
    if (ROOMS[roomName]) {
      const players = ROOMS[roomName].players;
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
    const roomName = socket.data.room;
    ROOMS[roomName].connected -= 1;
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
