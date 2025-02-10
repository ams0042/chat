const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Conectar a MongoDB Atlas
mongoose.connect('mongodb+srv://alexms:1100alex@cluster0.r2cob.mongodb.net/chat1', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Conectado a MongoDB Atlas'))
  .catch(err => console.log(err));

// Modelos de Usuario y Mensaje
const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    password: String
}));

const Message = mongoose.model('Message', new mongoose.Schema({
    sender: String,
    receiver: String,
    content: String,
    isPrivate: Boolean,
    room: String
}));

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, './')));

// Registro de usuario (sin cifrado)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send('Faltan datos');
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).send('Usuario ya existe');
    await new User({ username, password }).save();
    res.send('Registrado correctamente');
});

// Inicio de sesión (sin cifrado)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).send('Credenciales incorrectas');
    res.send('Login exitoso');
});

const users = {}; // Almacena usuarios conectados

io.on('connection', (socket) => {
    console.log('Usuario conectado');

    socket.on('join', (username) => {
        users[username] = socket.id;
        socket.username = username;
    });

    socket.on('message', async ({ sender, content }) => {
        const message = new Message({ sender, content, isPrivate: false });
        await message.save();
        io.emit('message', { sender, content });
    });

    // Chat privado
    socket.on('join-private', (username) => {
        users[username] = socket.id;
        socket.username = username;
    });

    socket.on('create-private-room', ({ sender, receiver }) => {
        const receiverSocketId = users[receiver];
        if (!receiverSocketId) {
            socket.emit('private-room-error', 'El destinatario no está conectado');
            return;
        }
        const room = `private-${[sender, receiver].sort().join('-')}`;
        socket.join(room);
        io.to(receiverSocketId).emit('private-room-created', room);
        socket.emit('private-room-created', room);
    });

    socket.on('private-message', async ({ room, sender, receiver, content }) => {
        const message = new Message({ sender, receiver, content, isPrivate: true, room });
        await message.save();
        
        // Enviar el mensaje a TODOS en la sala, incluido el emisor
        io.to(room).emit('private-message', { room, sender, content });
    });
    
    

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
        delete users[socket.username];
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});
app.get('/ChatPublico', (req, res) => {
    res.sendFile(path.join(__dirname, 'chatpublico.html'));
});
app.get('/ChatPrivado', (req, res) => {
    res.sendFile(path.join(__dirname, 'chatprivado.html'));
});

server.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
