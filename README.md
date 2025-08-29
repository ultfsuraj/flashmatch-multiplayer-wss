# [FlashMatch multiplayer 🔗](https://flashmatch-multiplayer.vercel.app/)

#### online multiplayer game website, choose game, join room, share room with friends

## Usage

1. Right now TWO games are available. CHESS, COLOR WARS (fast and fun)
2. Swipe icons up/down or click on arrows, click on icon for the game you want to play
3. Choose a ROOM name and player name, share the ROOM for others to join
4. Indicators shows whose turn it is, to avoid confusion
5. In case of network failure, accidentally closing the game or other issues, you can rejoin with same ROOM name and player name to restore the latest game state.
6. Both of you can use the same ROOM name and player names to play another game, new room name creates an entirely new game.
7. The game is reset with new room name, or only if all the players in a room are disconnected for more than 5-10 minutes.

## Developer

`React.js` `Next.js` `Redux toolkit` `Socket.io` `Node.js` `motion` `TypeScript` ` Tailwind CSS `

This project consists of 3 repos

1. [flashmatch-multiplayer](https://github.com/ultfsuraj/flashmatch-multiplayer) home website frontend
2. [flashmatch-multiplayer-wss](https://github.com/ultfsuraj/flashmatch-multiplayer-wss) backend with socket.io wrapper
3. [flashmatch-multiplayer-shared](https://github.com/ultfsuraj/flashmatch-multiplayer-shared) dependency package for shared types in frontend and backend

### Run locally

1. clone / zip wss backend, install and run it
2. clone / zip frontend, install and run it
3. any update you make on shared types, push it then do `npm update 'shared types repo'` on both backend and frontend repo on editor

Game state is managed on client side. Which makes syncing game turns and events a bit complex, but reduces server load.

Broadcasting only moves and not entire game state reduces bandwidth usage during game play but complexity increases to manage turn sync, possibility of state out sync due to animation timing mismatchs and handling interference of socket event listeners from other games.

Play the games with your friends and comment any issues you face. 😊
