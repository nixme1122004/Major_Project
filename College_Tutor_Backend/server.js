const http = require('http');
const app = require('./src/app');
const socket = require('./src/socket');

const server = http.createServer(app);

// initialize socket.io
socket.init(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
