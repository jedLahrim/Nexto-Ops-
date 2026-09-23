import * as http from 'http';
import * as net from 'net';
import { URL } from 'url';

/**
 * Example of a Forward Proxy (HTTP Tunneling) using Node.js 'http' and 'net' modules.
 * This allows clients to route traffic through this server (e.g., for privacy or bypassing restrictions).
 */

const proxyServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('This is a forward proxy server. Use CONNECT method for tunneling.');
});

// Handle the CONNECT method for HTTP Tunneling
proxyServer.on('connect', (req, clientSocket, head) => {
    const { port, hostname } = new URL(`https://${req.url}`);

    console.log(`Forwarding connection to ${hostname}:${port || 80}`);

    const serverSocket = net.connect(Number(port) || 80, hostname, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n' +
            'Proxy-agent: Node-Forward-Proxy\r\n' +
            '\r\n');
        serverSocket.write(head);
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
    });

    serverSocket.on('error', (err) => {
        console.error(`Internal server error: ${err.message}`);
        clientSocket.end();
    });
});

proxyServer.listen(8080, () => {
    console.log('Forward proxy server listening on port 8080');
});
