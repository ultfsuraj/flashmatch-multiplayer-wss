import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Games, Events, Ack } from 'flashmatch-multiplayer-shared';
// import { sendPlayerJoinedInfo } from './utils';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

// events
const joinRoom: Events['joinRoom']['name'] = 'joinRoom';
// const playerJoined: Events['playerJoined']['name'] = 'playerJoined';

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on(joinRoom, (payload: Events['joinRoom']['payload'], callback: (response: Ack) => void) => {
    const roomName = `${payload.gameName}-${payload.roomid}`;
    const count = io.of('/').adapter.rooms.get(roomName)?.size || 0;
    if (count < Games[payload.gameName].maxPlayers) {
      socket.join(roomName);
      callback({ success: true });
      // sendPlayerJoinedInfo(socket, roomName, playerJoined, { number: count, playerName: payload.playerName });
    } else {
      callback({ success: false, error: 'This room is full. Try another.' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
