const { Client, Room } = require('colyseus.js');

async function main() {
    const client = new Client('ws://localhost:8080');
    let userData = {
        username: 'guest-bugtest-' + Date.now(),
        password: 'test',
        rePassword: 'test',
        isGuest: true,
        isNewUser: true
    };
    console.log('joining game room with:', JSON.stringify(userData));
    try {
        const room = await client.joinOrCreate('room_game', userData);
        console.log('JOINED OK room:', room.roomId, 'sessionId:', room.sessionId);
        room.onMessage('*', (msg) => console.log('MSG:', JSON.stringify(msg).slice(0, 300)));
        room.onError((code, msg) => console.log('ROOM ERROR:', code, msg));
        room.onLeave((code) => console.log('LEAVE:', code));
        // wait 5s for messages
        await new Promise((r) => setTimeout(r, 5000));
        process.exit(0);
    } catch (error) {
        console.log('JOIN FAILED:', error.message || error);
        process.exit(1);
    }
}

main();

