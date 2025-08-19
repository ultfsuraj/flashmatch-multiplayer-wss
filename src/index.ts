import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Games, Events, Ack } from 'flashmatch-multiplayer-shared';
import { sendPlayerJoinedInfo, sendMoveInfo } from './utils';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000', // only allow this origin
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const ROOMS: Record<
  string,
  { lastUpdated: number; players: Record<string, { order: number; connected: boolean }>; connected: number }
> = {};
// interval check if no one is in the room for > 10 minutes...
setInterval(() => {
  const now = performance.now();
  let toDelete: string[] = [];
  Object.keys(ROOMS).forEach((roomId) => {
    if (ROOMS[roomId].connected == 0 && Math.round(now - ROOMS[roomId].lastUpdated) > 600000) {
      toDelete.push(roomId);
    }
  });
  console.log('before delete ', ROOMS);
  console.log('to delete', toDelete);
  toDelete.forEach((roomId) => {
    delete ROOMS[roomId];
  });
  console.log('after delete ', ROOMS);
}, 600000);

// events
const joinRoom: Events['joinRoom']['name'] = 'joinRoom';
const playerJoined: Events['playerJoined']['name'] = 'playerJoined';
const makeMove: Events['makeMove']['name'] = 'makeMove';
const exitRoom: Events['exitRoom']['name'] = 'exitRoom';

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on(joinRoom, (payload: Events['joinRoom']['payload'], callback: (response: Ack) => void) => {
    const roomName = `${payload.gameName}-${payload.roomid}`;

    if (ROOMS[roomName]) {
      const players = ROOMS[roomName].players;

      if (players[payload.playerName]) {
        console.log('trying to connect ', players[payload.playerName]);
        if (players[payload.playerName].connected == true) {
          callback({ success: false, error: `Player ${payload.playerName} has already joined, use another name` });
          return;
        }
        ROOMS[roomName].connected += 1;
        ROOMS[roomName].players[payload.playerName].connected = true;
        socket.join(roomName);
        socket.data.room = roomName;
        socket.data.playerName = payload.playerName;
        ROOMS[roomName].lastUpdated = performance.now();
        callback({ success: true, order: players[payload.playerName].order });
        sendPlayerJoinedInfo(socket, roomName, playerJoined, {
          order: players[payload.playerName].order,
          playerName: payload.playerName,
        });
      } else {
        if (Object.values(ROOMS[roomName].players).length == Games[payload.gameName].maxPlayers) {
          callback({ success: false, error: 'This room is full. Try another.' });
        } else {
          const order = Object.values(players).length + 1;
          ROOMS[roomName].connected += 1;
          ROOMS[roomName].players[payload.playerName] = { order, connected: true };
          socket.join(roomName);
          socket.data.room = roomName;
          socket.data.playerName = payload.playerName;
          ROOMS[roomName].lastUpdated = performance.now();
          callback({ success: true, order });
          sendPlayerJoinedInfo(socket, roomName, playerJoined, {
            order: order,
            playerName: payload.playerName,
          });
        }
      }
    } else {
      ROOMS[roomName] = { lastUpdated: 0, players: {}, connected: 1 };
      ROOMS[roomName].players[payload.playerName] = { order: 1, connected: true };
      ROOMS[roomName].lastUpdated = performance.now();
      socket.join(roomName);
      socket.data.room = roomName;
      socket.data.playerName = payload.playerName;
      callback({ success: true, order: 1 });
      sendPlayerJoinedInfo(socket, roomName, playerJoined, {
        order: 1,
        playerName: payload.playerName,
      });
    }
  });

  socket.on(makeMove, (payload: Events['makeMove']['payload'], callback: (resoonse: Ack) => void) => {
    sendMoveInfo(socket, socket.data.room, makeMove, payload);
  });

  socket.on(exitRoom, (payload: Events['exitRoom']['payload']) => {
    const roomName = `${payload.gameName}-${payload.roomid}`;
    const playerName = ROOMS[roomName]?.players[payload.playerName];
    const playerConnected = ROOMS[roomName]?.players[payload.playerName]?.connected;
    console.log('exiting ', { roomName, playerName, playerConnected });
    if (ROOMS[roomName] && playerName && playerConnected && ROOMS[roomName].connected > 0) {
      ROOMS[roomName].connected -= 1;
      ROOMS[roomName].players[payload.playerName].connected = false;
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    console.log(socket.data.room);
    const roomName: string = socket.data.room || '';
    const playerName: string = socket.data.playerName || '';
    const playerConnected = ROOMS[roomName]?.players[playerName]?.connected || false;
    if (ROOMS[roomName] && playerName && playerConnected && ROOMS[roomName].connected > 0) {
      ROOMS[roomName].connected -= 1;
      ROOMS[roomName].players[playerName].connected = false;
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
