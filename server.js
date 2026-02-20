// server.js
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: "*", // Permite que o PlayCanvas se conecte de qualquer domínio
        methods: ["GET", "POST"]
    }
});

let players = {};

io.on('connection', (socket) => {
    console.log('Novo jogador conectado: ' + socket.id);

    // Quando o PlayCanvas chama socket.emit('initialize')
    socket.on('initialize', () => {
        let id = socket.id;
        // Cria o jogador inicial na origem
        players[id] = { id: id, x: 0, y: 0, z: 0, deleted: false };
        
        // Envia todos os jogadores existentes para quem acabou de entrar
        socket.emit('playerData', { id: id, players: players });
        
        // Avisa aos outros que alguém novo entrou
        socket.broadcast.emit('playerJoined', players[id]);
    });

    // Quando o PlayCanvas chama socket.emit('positionUpdate')
    socket.on('positionUpdate', (data) => {
        if(players[data.id]) {
            players[data.id].x = data.x;
            players[data.id].y = data.y;
            players[data.id].z = data.z;
            
            // Repassa a nova posição para os outros jogadores
            socket.broadcast.emit('playerMoved', data);
        }
    });

    // Quando o jogador fecha a aba ou cai do PlayCanvas
    socket.on('disconnect', () => {
        console.log('Jogador desconectou: ' + socket.id);
        if(players[socket.id]) {
            // Avisa aos outros para deletarem a entidade
            socket.broadcast.emit('killPlayer', socket.id);
            delete players[socket.id];
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
