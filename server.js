const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(__dirname)); // Sirve archivos desde la raíz

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Página de inicio
});

app.get('/ChatPublico.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'ChatPublico.html'));
});

app.get('/ChatPrivado.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'ChatPrivado.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
