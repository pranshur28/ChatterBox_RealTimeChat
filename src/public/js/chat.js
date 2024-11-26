document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    const userList = document.getElementById('user-list');
    const roomList = document.getElementById('room-list');
    const roomForm = document.getElementById('room-form');
    const roomInput = document.getElementById('room-input');

    socket.on('connect', () => {
        const token = localStorage.getItem('token');
        if (token) {
            socket.emit('authenticate', { token });
        }
    });

    socket.on('authenticated', () => {
        console.log('Authenticated successfully');
    });

    socket.on('unauthorized', (msg) => {
        console.error('Unauthorized:', msg);
        alert('Authentication failed. Please log in again.');
        localStorage.removeItem('token');
        location.reload();
    });

    socket.on('message', (data) => {
        const { id, username, message, timestamp } = data;
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.dataset.id = id;
        messageElement.innerHTML = `
            <span class="username">${username}</span>
            <span class="timestamp">${new Date(timestamp).toLocaleTimeString()}</span>
            <p class="text">${message}</p>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        `;
        chatMessages.appendChild(messageElement);

        // Add event listeners for edit and delete buttons
        messageElement.querySelector('.edit-btn').addEventListener('click', () => editMessage(id));
        messageElement.querySelector('.delete-btn').addEventListener('click', () => deleteMessage(id));
    });

    socket.on('userList', (users) => {
        userList.innerHTML = '';
        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.textContent = `${user.username} (${user.online ? 'Online' : 'Offline'})`;
            userList.appendChild(userElement);
        });
    });

    socket.on('roomList', (rooms) => {
        roomList.innerHTML = '';
        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.textContent = room;
            roomElement.addEventListener('click', () => {
                socket.emit('joinRoom', room);
            });
            roomList.appendChild(roomElement);
        });
    });

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = messageInput.value;
        if (message) {
            const timestamp = Date.now();
            socket.emit('message', { message, timestamp }, (ack) => {
                if (ack) {
                    console.log('Message delivered');
                } else {
                    console.error('Message delivery failed');
                }
            });
            messageInput.value = '';
        }
    });

    roomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const roomName = roomInput.value;
        if (roomName) {
            socket.emit('createRoom', roomName);
            roomInput.value = '';
        }
    });

    messageInput.addEventListener('input', () => {
        socket.emit('typing', { typing: messageInput.value.length > 0 });
    });

    socket.on('typing', (data) => {
        const typingElement = document.getElementById('typing-indicator');
        if (data.typing) {
            typingElement.textContent = `${data.username} is typing...`;
        } else {
            typingElement.textContent = '';
        }
    });

    socket.on('roomJoined', (room) => {
        console.log(`Joined room: ${room}`);
    });

    socket.on('roomLeft', (room) => {
        console.log(`Left room: ${room}`);
    });

    socket.on('disconnect', () => {
        console.warn('Disconnected from server');
        // Attempt to reconnect
        socket.io.reconnect();
    });

    socket.on('reconnect_attempt', () => {
        console.log('Attempting to reconnect...');
    });

    socket.on('reconnect', () => {
        console.log('Reconnected to server');
    });

    socket.on('reconnect_failed', () => {
        console.error('Reconnection failed');
    });

    function editMessage(id) {
        const messageElement = document.querySelector(`.message[data-id="${id}"]`);
        const newText = prompt('Edit your message:', messageElement.querySelector('.text').textContent);
        if (newText) {
            socket.emit('editMessage', { id, newText });
        }
    }

    function deleteMessage(id) {
        if (confirm('Are you sure you want to delete this message?')) {
            socket.emit('deleteMessage', { id });
        }
    }

    socket.on('messageEdited', (data) => {
        const messageElement = document.querySelector(`.message[data-id="${data.id}"]`);
        if (messageElement) {
            messageElement.querySelector('.text').textContent = data.newText;
        }
    });

    socket.on('messageDeleted', (id) => {
        const messageElement = document.querySelector(`.message[data-id="${id}"]`);
        if (messageElement) {
            messageElement.remove();
        }
    });
});
