import { db } from './firebase-config.js';
import { ref, set, onValue, update, get } from './firebase-init.js';

export class NetworkManager {
    constructor() {
        this.roomId = null;
        this.playerId = null; // 'p1' or 'p2'
        this.roomRef = null;
    }

    async createRoom(playerName) {
        const id = Math.floor(1000 + Math.random() * 9000).toString();
        this.roomId = id;
        this.playerId = 'p1';
        this.roomRef = ref(db, `rooms/${id}`);

        const initialRoomState = {
            players: {
                p1: { name: playerName || 'Người chơi 1', online: true }
            },
            status: 'waiting',
            board: null,
            turn: 'p1',
            winner: null,
            lastMove: null
        };

        await set(this.roomRef, initialRoomState);
        return id;
    }

    async joinRoom(id, playerName) {
        const snapshot = await get(ref(db, `rooms/${id}`));
        if (!snapshot.exists()) {
            throw new Error("Phòng không tồn tại!");
        }

        const roomData = snapshot.val();
        if (roomData.players.p2) {
            throw new Error("Phòng đã đầy!");
        }

        this.roomId = id;
        this.playerId = 'p2';
        this.roomRef = ref(db, `rooms/${id}`);

        await update(this.roomRef, {
            'players/p2': { name: playerName || 'Người chơi 2', online: true },
            'status': 'playing'
        });

        return id;
    }

    onRoomUpdate(callback) {
        if (!this.roomRef) return;
        onValue(this.roomRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            }
        });
    }

    async makeMove(row, col, player) {
        if (!this.roomRef) return;

        // Use a compact representation for the board in DB
        // or just update the specific cell to minimize bandwidth
        const updates = {};
        updates[`board/${row}_${col}`] = player;
        updates['turn'] = (player === 'p1' ? 'p2' : 'p1');

        await update(this.roomRef, updates);
    }

    async setWinner(player) {
        if (!this.roomRef) return;
        await update(this.roomRef, {
            status: 'finished',
            winner: player
        });
    }

    async getRoomData() {
        if (!this.roomRef) return null;
        const snapshot = await get(this.roomRef);
        return snapshot.exists() ? snapshot.val() : null;
    }

    async leaveRoom() {
        if (!this.roomRef) return;
        // In a real app, we might want to cleanup the room if both players leave
        this.roomId = null;
        this.playerId = null;
        this.roomRef = null;
    }
}
