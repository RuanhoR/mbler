const http = require('http');
const path = require('path');
const net = require('net');
let DATAPATH;
function safeJoin(base, ...paths) {
  const result = path.join(base, ...paths);
  const resolved = path.resolve(result);
  if (resolved.startsWith(path.resolve(base))) {
    return resolved;
  }
  return result
}

function Exit(...args) {
  args.forEach(console.log);
  process.exit(0);
}
const i = path.join(__dirname,'../../public')
const server = http.createServer((req, res) => {
  let cleanup = () => {};
  req.on('close', cleanup);
  req.on('error', cleanup);

  try {
    const {
      parsedUrl,
      handleApi
    } = createHandlerContext(req, res);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

    switch (pathSegments[0]) {
      case 'file':
        (async () => {
          try {
            const filePath = safeJoin(i, ...pathSegments.slice(1));
            await sendFile(req, res, filePath);
          } catch (err) {
            console.log(err)
            res.writeHead(403).end('Forbidden');
          }
        })();
        break;

      case 'api':
        handleApi().catch(err => {
          console.log('[HandleApi Error]', err);
          if (!res.headersSent) {
            res.writeHead(500).end('Internal Error');
          }
        });
        break;

      default:
        res.writeHead(302, {
          Location: '/file/index.html'
        });
        res.end();
    }
  } catch (err) {
    console.log(err)
    if (!res.headersSent) {
      res.writeHead(500).end('Internal Server Error');
    }
  }
});
module.exports = class HttpServer {
  constructor(config) {
    DATAPATH = config.PATH;
    const {
      sendFile,
      createHandlerContext
    } = require('./http_utils.js')(DATAPATH)
    global.sendFile = sendFile
    global.createHandlerContext = createHandlerContext
    this.PORT = config.PORT || 1025;
    this.start();
  }

  async isPortAvailable(port) {
    return new Promise(resolve => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      server.listen(port, '0.0.0.0');
    });
  }

  async getAvailablePort(startPort) {
    let port = startPort;
    while (port < 65535) {
      if (await this.isPortAvailable(port)) return port;
      port++;
    }
    throw new Error('No available port');
  }

  async start() {
    if (typeof this.PORT !== 'number') {
      Exit('配置文件错误：PORT 的值非数字');
    }

    try {
      const port = await this.getAvailablePort(Math.floor(this.PORT));
      server.listen(port, '0.0.0.0', () => {
        console.log(`本地开发编辑器运行在本地：http://localhost:${port} (Port: ${port})`);
      });
    } catch (err) {
      Exit('启动失败:', err.message);
    }
  }
};