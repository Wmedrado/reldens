const { Client } = require('colyseus.js');

async function main() {
    const client = new Client('ws://localhost:8080');
    let userData = {
        username: 'guest-create-' + Date.now().toString().slice(-6),
        password: 'test',
        rePassword: 'test',
        isGuest: true,
        isNewUser: true
    };
    try {
        const room = await client.joinOrCreate('room_game', userData);
        console.log('JOINED', room.roomId);
        room.onMessage('*', (msg) => {
            const s = JSON.stringify(msg);
            console.log('MSG:', s.slice(0, 150));
        });
        room.onError((c, m) => console.log('ROOM ERROR:', c, m));
        await new Promise((r) => setTimeout(r, 3000));
        // now send CREATE_PLAYER
        console.log('sending CREATE_PLAYER...');
        room.send('*', { act: 'cp', formData: {
            'new-player-name': 'TestCreate',
            'class-path-select': '1',
            'creationSelectedScene': 'vibecraft-demo'
        }});
        await new Promise((r) => setTimeout(r, 6000));
        console.log('done waiting');
        process.exit(0);
    } catch (error) {
        console.log('JOIN FAILED:', error.message);
        process.exit(1);
    }
}

main();

