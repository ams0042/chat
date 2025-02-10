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
mongoose.connect('mongodb+srv://eal0013:eva1234@cluster0.b9ajz.mongodb.net/chatDB', {
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
    isPrivate: Boolean
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

// WebSockets para chat en tiempo real
io.on('connection', (socket) => {
    console.log('Usuario conectado');

    socket.on('join', (username) => {
        socket.username = username;
    });

    socket.on('message', async ({ sender, content }) => {
        const message = new Message({ sender, content, isPrivate: false });
        await message.save();
        io.emit('message', { sender, content });
    });

    socket.on('privateMessage', async ({ sender, receiver, content }) => {
        const message = new Message({ sender, receiver, content, isPrivate: true });
        await message.save();
        socket.broadcast.emit(`privateMessage-${receiver}`, { sender, content });
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

server.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
