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

    async setDraw() {
        if (!this.roomRef) return;
        await update(this.roomRef, {
            status: 'finished',
            winner: 'draw'
        });
    }

    async updateRematchStatus(playerId, wantsRematch) {
        if (!this.roomRef) return;
        await update(this.roomRef, {
            [`rematch/${playerId}`]: wantsRematch
        });
    }

    async resetRoom() {
        if (!this.roomRef) return;
        await update(this.roomRef, {
            board: null,
            status: 'playing',
            turn: 'p1',
            winner: null,
            lastMove: null,
            rematch: null // Clear rematch status for new game
        });
    }

    async getRoomData() {
        if (!this.roomRef) return null;
        const snapshot = await get(this.roomRef);
        return snapshot.exists() ? snapshot.val() : null;
    }

    async leaveRoom() {
        if (!this.roomRef) return;

        const updates = {};
        updates[`players/${this.playerId}`] = null;

        // If the room becomes empty, consider resetting status or cleaning up
        // For now, if anyone leaves during 'playing', set status back to 'waiting'
        const snapshot = await get(this.roomRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.status === 'playing' || data.status === 'finished') {
                updates['status'] = 'waiting';
                updates['board'] = null;
                updates['winner'] = null;
                updates['rematch'] = null;
            }
        }

        await update(this.roomRef, updates);

        this.roomId = null;
        this.playerId = null;
        this.roomRef = null;
    }
}
