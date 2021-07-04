const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const http = require('http')
const path = require('path');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users');

// socket.emit -> send message to user who is joined
// io.emit -> send message to every user who are joined
// socket.broadcast.emit -> send messsage to evey user who are joined except the user who is sending the message
// io.to(room).emit -> send message to every user who are joined in a specific chat room
// socket.broadcast.to(room).emit -> send message to every user who are joined in a specific chat room excpet the user who is sending the message



// Create the Express application
const app = express();

// Create the HTTP server using the Express app
const server = http.createServer(app);

// Connect socket.io to the HTTP Server
const io = socketio(server);

const port = process.env.PORT || 80;
const publicDirectoryPath = path.join(__dirname, '../public');


app.use(express.static(publicDirectoryPath));

app.get('/', (req, res) => {
    res.render('index');
})


// Listen for the new connection to Socket.io
io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    socket.on('join', (options, callback) => {

        const {error, user} = addUser({id: socket.id, ...options})

        // If error, send messge back to the client
        if(error){
            return callback(error);
        }

        // Joining the room
        socket.join(user.room) // this event can only be used in server side

        // Welcome to the user room
        socket.emit('message', generateMessage('Admin', 'Welcome!'));

        // broadcast an event to everyone in the room
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));

        
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUserInRoom(user.room)
        })

        callback();
    })
    
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        const filter = new Filter();

        if(filter.isProfane(message)){
            return callback('Profanity not allowed!');
        }

        io.to(user.room).emit('message', generateMessage(user.username, message));
        callback();
    })

    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    })

    // When user get disconnected
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if(user){
            io.to(user.room).emit('message', generateMessage('Admin' ,`${user.username} has left!`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }
        
    })
    
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
})