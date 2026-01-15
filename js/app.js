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
        this.createNameInput = document.getElementById('create-player-name');
        this.joinNameInput = document.getElementById('join-player-name');
        this.p1Name = this.p1Info.querySelector('.name');
        this.p2Name = this.p2Info.querySelector('.name');
        this.p1Avatar = this.p1Info.querySelector('.avatar');
        this.p2Avatar = this.p2Info.querySelector('.avatar');

        this.initEventListeners();
        this.renderBoard();
    }

    initEventListeners() {
        this.btnCreate.addEventListener('click', () => this.handleCreateRoom());
        this.btnJoin.addEventListener('click', () => this.handleJoinRoom());
        this.btnLeave.addEventListener('click', () => this.handleLeaveRoom());

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

        // Update player info
        if (data.players) {
            if (data.players.p1) {
                this.p1Name.textContent = data.players.p1.name;
                this.p1Avatar.innerHTML = '<img src="assets/p1.png" alt="P1 Avatar">';
            }
            if (data.players.p2) {
                this.p2Name.textContent = data.players.p2.name;
                this.p2Avatar.innerHTML = '<img src="assets/p2.png" alt="P2 Avatar">';
            } else {
                this.p2Name.textContent = "Chờ người chơi...";
                this.p2Avatar.innerHTML = 'O';
            }
        }
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
