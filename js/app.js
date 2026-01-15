import { GomokuGame } from './game.js';
import { NetworkManager } from './network.js';

class GomokuApp {
    constructor() {
        this.game = new GomokuGame(15);
        this.network = new NetworkManager();

        // DOM Elements
        this.menuScreen = document.getElementById('menu-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.btnCreate = document.getElementById('btn-create-room');
        this.btnJoin = document.getElementById('btn-join-room');
        this.btnLeave = document.getElementById('btn-leave-room');
        this.joinInput = document.getElementById('join-room-id');
        this.boardEl = document.getElementById('game-board');
        this.displayRoomId = document.getElementById('display-room-id');
        this.statusEl = document.getElementById('game-status');
        this.p1Info = document.getElementById('p1-info');
        this.p2Info = document.getElementById('p2-info');
        this.createNameInput = document.getElementById('create-player-name');
        this.joinNameInput = document.getElementById('join-player-name');

        if (this.p1Info) {
            this.p1Name = this.p1Info.querySelector('.name');
            this.p1Avatar = this.p1Info.querySelector('.avatar');
        }
        if (this.p2Info) {
            this.p2Name = this.p2Info.querySelector('.name');
            this.p2Avatar = this.p2Info.querySelector('.avatar');
        }

        // Modal Elements
        this.gameOverModal = document.getElementById('game-over-modal');
        this.winnerText = document.getElementById('winner-text');
        this.rematchInfo = document.getElementById('rematch-info');
        this.btnRematch = document.getElementById('btn-rematch');
        this.btnModalLeave = document.getElementById('btn-modal-leave');

        this.previousPlayers = null;
        this.initEventListeners();
        this.renderBoard();
    }

    initEventListeners() {
        this.btnCreate.addEventListener('click', () => this.handleCreateRoom());
        this.btnJoin.addEventListener('click', () => this.handleJoinRoom());
        this.btnLeave.addEventListener('click', () => this.handleLeaveRoom());
        this.btnModalLeave.addEventListener('click', () => this.handleLeaveRoom());
        this.btnRematch.addEventListener('click', () => this.handleRematchRequest());

        this.boardEl.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (cell) {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                this.handleCellClick(row, col);
            }
        });
    }

    async handleCreateRoom() {
        const name = this.createNameInput.value.trim();
        try {
            const id = await this.network.createRoom(name);
            this.showGameScreen(id);
            this.network.onRoomUpdate((data) => this.handleRoomUpdate(data));
        } catch (error) {
            alert("Lỗi khi tạo phòng: " + error.message);
        }
    }

    async handleJoinRoom() {
        const name = this.joinNameInput.value.trim();
        const id = this.joinInput.value.trim();
        if (!id || id.length !== 4) {
            alert("Vui lòng nhập mã phòng 4 số!");
            return;
        }

        try {
            await this.network.joinRoom(id, name);
            this.showGameScreen(id);
            this.network.onRoomUpdate((data) => this.handleRoomUpdate(data));
        } catch (error) {
            alert("Lỗi khi vào phòng: " + error.message);
        }
    }

    handleLeaveRoom() {
        this.network.leaveRoom();
        this.showMenuScreen();
        this.game.reset();
        this.gameOverModal.classList.remove('active');
        this.btnRematch.disabled = false;
        this.btnRematch.textContent = "Chơi tiếp";
        this.renderBoard();
    }

    showGameScreen(id) {
        this.menuScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
        this.displayRoomId.textContent = id;
    }

    showMenuScreen() {
        this.gameScreen.classList.remove('active');
        this.menuScreen.classList.add('active');
    }

    handleRoomUpdate(data) {
        // Sync board
        this.game.reset();
        if (data.board) {
            Object.entries(data.board).forEach(([key, player]) => {
                const [r, c] = key.split('_').map(Number);
                this.game.placeStone(r, c, player);
            });
        }
        this.renderBoard();

        // Detect player departure
        if (this.previousPlayers && data.status !== 'waiting') {
            const opponentId = this.network.playerId === 'p1' ? 'p2' : 'p1';
            if (this.previousPlayers[opponentId] && !data.players[opponentId]) {
                const opponentName = this.previousPlayers[opponentId].name || 'Đối thủ';
                alert(`${opponentName} vừa thoát phòng chơi, chờ người chơi mới.`);
                this.gameOverModal.classList.remove('active'); // Close modal if open
            }
        }
        this.previousPlayers = data.players;

        // Update player info
        if (data.players) {
            this.updatePlayerDisplay('p1', data.players.p1);
            this.updatePlayerDisplay('p2', data.players.p2);
        }

        // Sync turn and status header
        if (data.status === 'waiting') {
            this.statusEl.textContent = "Đang chờ người chơi...";
        } else if (data.status === 'playing') {
            this.gameOverModal.classList.remove('active');
            const currentTurnPlayer = data.turn === 'p1' ? (data.players?.p1?.name || 'P1') : (data.players?.p2?.name || 'P2');
            const isMyTurn = data.turn === this.network.playerId;
            this.statusEl.textContent = isMyTurn ? "Lượt của BẠN" : `Lượt của ${currentTurnPlayer}`;

            // Highlight active player avatar glow
            this.p1Info.classList.toggle('active', data.turn === 'p1');
            this.p2Info.classList.toggle('active', data.turn === 'p2');
        } else if (data.status === 'finished') {
            if (data.winner === 'draw') {
                this.statusEl.textContent = "TRẬN ĐẤU HÒA! 🤝";
            } else {
                const winnerName = data.winner === 'p1' ? (data.players?.p1?.name || 'P1') : (data.players?.p2?.name || 'P2');
                this.statusEl.textContent = `${winnerName} CHIẾN THẮNG! 🏆`;
            }
            this.showWinModal(data);
        }
    }

    updatePlayerDisplay(pid, pData) {
        const info = pid === 'p1' ? this.p1Info : this.p2Info;
        const nameEl = pid === 'p1' ? this.p1Name : this.p2Name;
        const avatarEl = pid === 'p1' ? this.p1Avatar : this.p2Avatar;
        const isMe = this.network.playerId === pid;
        const symbol = pid === 'p1' ? '✕' : '◯';

        if (pData) {
            info.classList.add('joined');
            info.classList.toggle('is-me', isMe);

            nameEl.innerHTML = `${pData.name} ${isMe ? '<span class="badge-me">BẠN</span>' : ''}<br><span class="piece-label">${symbol} Quân của ${isMe ? 'bạn' : pid}</span>`;

            // Only update avatar if image is missing to prevent flickering
            if (!avatarEl.querySelector('img')) {
                avatarEl.innerHTML = `<img src="./assets/${pid}.png" alt="${pid} Avatar">`;
            }
            if (pid === 'p2') info.classList.add('active');
        } else {
            info.classList.remove('joined', 'is-me');
            nameEl.textContent = "Chờ người chơi...";
            avatarEl.innerHTML = symbol;
            if (pid === 'p2') info.classList.remove('active');
        }
    }

    showWinModal(data) {
        if (data.winner === 'draw') {
            this.winnerText.textContent = "HÒA NHA! 🤝";
        } else {
            const winnerName = data.winner === 'p1' ? (data.players?.p1?.name || 'P1') : (data.players?.p2?.name || 'P2');
            this.winnerText.textContent = `${winnerName} CHIẾN THẮNG! 🏆`;
        }
        this.gameOverModal.classList.add('active');

        // Update rematch status
        const rematchCount = Object.values(data.rematch || {}).filter(v => v).length;
        this.rematchInfo.textContent = `Sẵn sàng? (${rematchCount}/2)`;

        // If both want rematch, one player (p1) triggers room reset
        if (rematchCount === 2 && this.network.playerId === 'p1') {
            this.network.resetRoom();
        }
    }

    async handleRematchRequest() {
        this.btnRematch.disabled = true;
        this.btnRematch.textContent = "Đã sẵn sàng...";
        await this.network.updateRematchStatus(this.network.playerId, true);
    }

    async handleCellClick(row, col) {
        // Validation: Must be my turn, room must be active, game not over
        if (this.game.gameOver) return;

        // We need the latest room state to check turn
        const snapshot = await this.network.getRoomData();
        if (!snapshot || snapshot.status !== 'playing' || snapshot.turn !== this.network.playerId) {
            return;
        }

        // Try local move first
        if (this.game.placeStone(row, col, this.network.playerId)) {
            // Success, sync to network
            await this.network.makeMove(row, col, this.network.playerId);

            // Check if win (local check)
            if (this.game.gameOver) {
                await this.network.setWinner(this.network.playerId);
            } else if (this.game.checkDraw()) {
                await this.network.setDraw();
            }
        }
    }

    renderBoard() {
        this.boardEl.innerHTML = '';
        const boardState = this.game.getBoardState();

        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                const player = boardState[r][c];
                if (player) {
                    const stone = document.createElement('div');
                    stone.className = `stone ${player === 'p1' ? 'x' : 'o'}`;
                    cell.appendChild(stone);
                }

                // Highlight winner
                if (this.game.winningLine.some(([wr, wc]) => wr === r && wc === c)) {
                    cell.classList.add('winner');
                }

                this.boardEl.appendChild(cell);
            }
        }
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.app = new GomokuApp();
    } catch (e) {
        console.error("Lỗi khởi tạo ứng dụng:", e);
        if (window.location.protocol === 'file:') {
            alert("Ứng dụng không thể chạy trực tiếp từ file HTML. Vui lòng chạy ứng dụng thông qua một máy chủ web (Local Server).");
        } else {
            alert("Đã có lỗi xảy ra khi khởi tạo ứng dụng. Vui lòng kiểm tra console.");
        }
    }
});
