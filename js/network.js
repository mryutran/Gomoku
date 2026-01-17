import { db } from './firebase-config.js';
import { ref, set, onValue, update, get, onDisconnect, remove, push } from './firebase-init.js';

export class NetworkManager {
    constructor() {
        this.roomId = null;
        this.playerId = null; // 'p1' or 'p2'
        this.roomRef = null;
        this.unsubscribe = null; // Store listener cleanup function
    }

    async createRoom(playerName, playerUid) {
        const id = Math.floor(1000 + Math.random() * 9000).toString();
        this.roomId = id;
        this.playerId = 'p1';
        this.roomRef = ref(db, `rooms/${id}`);

        const initialRoomState = {
            players: {
                p1: { name: playerName || 'Người chơi 1', online: true, uid: playerUid }
            },
            status: 'waiting',
            board: null,
            turn: 'p1',
            winner: null,
            lastMove: null
        };

        await set(this.roomRef, initialRoomState);

        // Handle disconnection: remove player and reset status if necessary
        const p1Ref = ref(db, `rooms/${id}/players/p1`);
        onDisconnect(p1Ref).remove(); // Remove player on disconnect

        // If P1 leaves, we should also reset room status to waiting if it was playing
        // However, onDisconnect handles specific paths. 
        // For simplicity, we just remove the player, and app.js handles the rest.

        return id;
    }

    async joinRoom(id, playerName, playerUid) {
        const snapshot = await get(ref(db, `rooms/${id}`));
        if (!snapshot.exists()) {
            throw new Error("Phòng không tồn tại!");
        }

        const roomData = snapshot.val();
        const players = roomData.players || {};

        let targetId = null;
        if (!players.p1) targetId = 'p1';
        else if (!players.p2) targetId = 'p2';
        else throw new Error("Phòng đã đầy!");

        this.roomId = id;
        this.playerId = targetId;
        this.roomRef = ref(db, `rooms/${id}`);

        const updates = {};
        updates[`players/${targetId}`] = {
            name: playerName || `Người chơi ${targetId === 'p1' ? '1' : '2'}`,
            online: true,
            uid: playerUid
        };

        // If both players are now present, set status to playing
        if ((targetId === 'p1' && players.p2) || (targetId === 'p2' && players.p1)) {
            updates['status'] = 'playing';
        }

        await update(this.roomRef, updates);

        // Handle disconnection
        const pRef = ref(db, `rooms/${id}/players/${targetId}`);
        onDisconnect(pRef).remove();

        return id;
    }

    onRoomUpdate(callback) {
        if (!this.roomRef) return;

        // Cleanup existing listener if any
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        this.unsubscribe = onValue(this.roomRef, (snapshot) => {
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
        updates['lastMove'] = { row, col, player };

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

    async sendMessage(text, senderName) {
        if (!this.roomRef) return;
        const chatRef = ref(db, `rooms/${this.roomId}/chat`);
        await push(chatRef, {
            senderId: this.playerId,
            senderName: senderName,
            text: text,
            timestamp: Date.now()
        });
    }

    async sendReaction(emoji) {
        if (!this.roomRef) return;
        await update(this.roomRef, {
            [`reactions/${this.playerId}`]: {
                emoji: emoji,
                timestamp: Date.now()
            }
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
            rematch: null, // Clear rematch status for new game
            chat: null,    // Clear chat on game reset
            reactions: null // Clear reactions
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

        // Cleanup listener when leaving
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        this.roomId = null;
        this.playerId = null;
        this.roomRef = null;
    }
}
