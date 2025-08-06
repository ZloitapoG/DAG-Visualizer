const http = require('http');
const fs = require('fs');
const path = require('path');
const graphDir = path.join(__dirname, 'graphs')

function ensureGraphsDirExists() {
    try {
        if (!fs.existsSync(graphDir)) {
            fs.mkdirSync(graphDir, { recursive: true });
            console.log('Папка "graphs" создана');
        }
    } catch (err) {
        console.error('Ошибка при создании файла:', err.message);
        throw err;
    }
}

function generateBeautifulID() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getDate() + 1).padStart(2, '0');
    const year = now.getFullYear();

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${day}.${month}.${year} - ${hours}.${minutes}.${seconds}`;
}
let graphData = {
    nodes: [],
    edges: []
};
try {
    graphData = JSON.parse(fs.readFileSync('graph.json'));
} catch (err) {
    fs.writeFileSync('graph.json', JSON.stringify(graphData));
}
try {

    ensureGraphsDirExists();
    const server = http.createServer((req, res) => {

        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        console.log(`Received request for: ${req.url}`);
        // GET
        if (req.url === '/graph' && req.method === 'GET') {
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(graphData));
        }
        // POST
        if (req.url === '/graph' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    if (!body.trim()) {
                        throw new Error("Не правильно, ты дядя Федор, бутерброд ешь...Пустой");
                    }
                    let parseData;
                    try {
                        parseData = JSON.parse(body);
                    } catch (parseError) {
                        throw new Error(`Не правильно! Широкую  на широкую:${parseError.message}`);
                    }

                    if (!parseData.nodes || !parseData.edges || !Array.isArray(parseData.nodes) || !Array.isArray(parseData.edges)) {
                        throw new Error("Ожидается граф с полями nodes и edges(массивы)");
                    }
                    graphData = parseData;
                    fs.writeFileSync('graph.json', JSON.stringify(graphData));
                    const id = generateBeautifulID();

                    if (!fs.existsSync('graphs')) {
                        fs.mkdirSync('graphs');
                    }
                    fs.writeFileSync(path.join(graphDir, `${id}.json`), JSON.stringify(graphData, null, 2));
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end("Граф сохранен!");
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: err.message
                    }));
                }
            });
        }
    });

    server.listen(3001, () => {
        console.log('Сервер запущен на http://localhost:3001');
    });
} catch (err) {
    console.error("Сервера не будет:", err.message);
}