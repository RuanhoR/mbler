const http = require('http');
const fs = require('fs');
const fsPromises = require('fs').promises;
const mime = require('mime-types');
const path = require('path')
let DATAPATH;
async function fileExists(filePath) {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function sendFile(req, res, filePath) {
  let stats;
  try {
    stats = await fsPromises.stat(filePath);
    if (stats.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      if (await fileExists(indexPath)) {
        filePath = indexPath;
        stats = await fsPromises.stat(filePath);
      } else {
        throw new Error('No index.html');
      }
    }
  } catch (err) {
    res.writeHead(200, {
      'Content-type': 'text/html'
    });
    return res.end('404');
  }

  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  const fileName = path.basename(filePath);
  const isInline = mimeType.startsWith('text/') ||
    mimeType.includes('application/json') || [
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp'
    ]
    .includes(mimeType);
  if (isInline) {
    try {
      const content = await fsPromises.readFile(filePath, 'utf8');
      res.writeHead(200, {
        'Content-Type': `${mimeType};charset=utf-8`,
      });
      res.end(content);
    } catch (err) {
      console.log('[Read Error]', filePath, err);
      res.writeHead(500).end('Internal Server Error');
    }
    return;
  }
  res.writeHead(200, {
    'Content-Type': mimeType,
    'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
    'Content-Length': stats.size,
  });

  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);

  readStream.on('error', (err) => {
    console.log(`[Stream Error] ${filePath}:`, err);
    if (!res.headersSent) {
      res.writeHead(500).end('File stream failed');
    } else {
      res.end();
    }
  });
}

function createHandlerContext(req, res) {
  let parsedUrl;
  try {
    const host = req.headers.host || 'localhost';
    parsedUrl = new URL(req.url, `http://${host}`);
  } catch (err) {
    parsedUrl = new URL(req.url, 'http://localhost');
  }

  const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
  const query = parsedUrl.searchParams;

  const json = (obj, status = 200) => {
    res.writeHead(status, {
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify(obj));
  };

  const cors = () => res.setHeader('Access-Control-Allow-Origin', '*');

  let bodyCache = null;
  const DATA = (limit = 1e6) => {
    return new Promise((resolve, reject) => {
      if (bodyCache !== null) resolve(bodyCache)
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        if (body.length > limit) {
          req.destroy();
          return reject(new Error('Request body too large'));
        }
      });
      req.on('end', () => {
        try {
          bodyCache = JSON.parse(body);
        } catch {
          bodyCache = body;
        }
        resolve(bodyCache);
      });
      req.on('error', reject);
    });
  };

  const handleApi = async () => {
    const subpath = parsedUrl.pathname.replace(/^\/api\//, '');
    if (!subpath || subpath.includes('../')) {
      return json({
        code: -1,
        msg: 'ERR_INPUT'
      }, 400);
    }

    let apiPath;
    const baseApiDir = './../editor-api'
    const tryFiles = [
      path.join(__dirname, baseApiDir, `${subpath}.js`),
      path.join(__dirname, baseApiDir, subpath, 'index.js'),
    ];

    for (const p of tryFiles) {
      if (await fileExists(p)) {
        apiPath = p;
        break;
      }
    }

    if (!apiPath) {
      return json({
        code: -1,
        msg: 'API not found'
      }, 404);
    }

    try {
      const ApiModule = require(apiPath);
      const param = {
        query,
        cors,
        param: DATAPATH,
        pathSegments,
        parsedUrl,
        DATA,
        req,
        res
      };

      let result;
      if (typeof ApiModule === 'function') {
        result = await ApiModule(param);
      } else if (typeof ApiModule.main === 'function') {
        result = await new ApiModule(param).main();
      } else {
        result = {
          code: -1,
          msg: 'Invalid API module'
        };
      }

      if (result && typeof result.headers === 'object' && result.content !== undefined) {
        res.writeHead(200, result.headers);
        res.end(result.content);
      } else {
        json(result, 200);
      }
    } catch (err) {
      json({
        code: -1,
        msg: 'API not found'
      }, 500);
    }
  };

  return {
    parsedUrl,
    json,
    cors,
    DATA,
    query,
    pathSegments,
    handleApi,
  };
}
module.exports = (e) => {
  DATAPATH = e;
  return {
    sendFile,
    createHandlerContext
  }
}