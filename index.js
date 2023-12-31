import http from 'http';
import fs from 'fs';
import url from 'url';
import ws, { WebSocketServer } from 'ws';
import 'dotenv/config'
import OpenAI from "openai";
import { randomUUID } from 'crypto';

const openai = new OpenAI();

const httpServer = http.createServer((req, res) => {
    let pathname = url.parse(req.url).pathname;
    if (pathname == '/' || pathname == "/index.html") {
        fs.createReadStream("public/index.html").pipe(res);
    }else{
        res.writeHead(404);
        res.end(`<h1>Error 404</h1>Not Found.`);
    }
});
httpServer.listen(process.env.PORT || 8080);

const wss = new WebSocketServer({
    server: httpServer
});

function formatTime(){
    return new Date().toLocaleString("af")
}

wss.on("connection", sock => {
    sock.messages = [{ role: "system", content: "You are the philosopher Plato. Respond as if you're him." }];
    sock.id = randomUUID();
    console.log(`[${formatTime()}] Started conversation with id ${sock.id}.`);
    sock.on("message", async msg => {
        msg = msg.toString();
        sock.messages.push({ role: "user", content: msg });

        const completion = await openai.chat.completions.create({
            messages: sock.messages,
            model: "gpt-3.5-turbo",
        });
        const assMsg = completion.choices[0].message;
        sock.messages.push(assMsg);
        sock.send(assMsg.content);
    });
    sock.on("close", ()=>{
        console.log(`[${formatTime()}] Ended conversation with id   ${sock.id}.`);
        delete sock.messages;
    });
});