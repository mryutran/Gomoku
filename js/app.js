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

        // Chat & Reactions
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.btnSendChat = document.getElementById('btn-send-chat');
        this.p1Reaction = this.p1Info ? this.p1Info.querySelector('.reaction-overlay') : null;
        this.p2Reaction = this.p2Info ? this.p2Info.querySelector('.reaction-overlay') : null;
        this.lastChatTimestamp = 0;

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

        // Chat Toggle
        this.chatContainer = document.getElementById('chat-container');
        this.chatHeader = document.getElementById('chat-header');
        this.btnToggleChat = document.getElementById('btn-toggle-chat');

        const toggleChat = (e) => {
            if (this._isDraggingMove && this._isDraggingMove()) return;
            if (e) e.stopPropagation();
            if (!this.chatContainer) return;
            const isCollapsed = this.chatContainer.classList.toggle('collapsed');

            // Clear unread state when opening
            if (!isCollapsed) {
                this.chatContainer.classList.remove('unread');
            }

            if (this.btnToggleChat) {
                this.btnToggleChat.textContent = isCollapsed ? '💬' : '✕';
            }
        };

        if (this.chatHeader) {
            this.chatHeader.addEventListener('click', toggleChat);
        }
        if (this.btnToggleChat) {
            this.btnToggleChat.addEventListener('click', toggleChat);
        }

        if (this.btnSendChat) {
            this.btnSendChat.addEventListener('click', () => this.handleSendMessage());
        }
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleSendMessage();
            });
        }

        document.querySelectorAll('.btn-reaction').forEach(btn => {
            btn.addEventListener('click', () => {
                const emoji = btn.getAttribute('data-emoji');
                if (emoji) {
                    this.network.sendReaction(emoji);
                }
            });
        });

        this.previousPlayers = null;
        this.currentPlayerName = ''; // Added to track name reliably
        this.playerUid = Math.random().toString(36).substring(2, 15); // Generate unique session ID
        this.setupDraggable();
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
        const name = this.createNameInput.value.trim() || 'Người chơi 1';
        this.currentPlayerName = name; // Store name
        try {
            const id = await this.network.createRoom(name, this.playerUid);
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
            const finalName = name || 'Người chơi ' + (id % 2 === 0 ? '2' : '1'); // Helper default
            this.currentPlayerName = finalName; // Store name
            await this.network.joinRoom(id, finalName, this.playerUid);
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
        // Session Validation: Ensure my slot hasn't been taken by someone else
        if (this.network.roomId && data.players) {
            const myId = this.network.playerId;
            const myDataInRoom = data.players[myId];

            if (myDataInRoom && myDataInRoom.uid !== this.playerUid) {
                alert("Phiên chơi của bạn đã hết hạn hoặc có người khác đã vào vị trí của bạn.");
                this.handleLeaveRoom();
                return;
            }
        }

        // Sync board
        this.game.reset();
        if (data.board) {
            Object.entries(data.board).forEach(([key, player]) => {
                const [r, c] = key.split('_').map(Number);
                this.game.placeStone(r, c, player);
            });
        }
        this.renderBoard(data.lastMove);

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

        // Sync Chat
        if (data.chat) {
            this.updateChat(data.chat);
        } else {
            this.chatMessages.innerHTML = '';
            this.lastChatTimestamp = 0;
        }

        // Sync Reactions
        if (data.reactions) {
            this.updateReactions(data.reactions);
        }
    }

    updateChat(chatData) {
        if (!this.chatMessages) return;
        const messages = Object.values(chatData).sort((a, b) => a.timestamp - b.timestamp);
        messages.forEach(msg => {
            if (msg.timestamp > this.lastChatTimestamp) {
                const isMe = msg.senderId === this.network.playerId;
                const msgEl = document.createElement('div');
                msgEl.className = `chat-message ${isMe ? 'me' : 'others'}`;
                // Use cleaner formatting
                msgEl.innerHTML = `<strong>${msg.senderName}:</strong> ${msg.text}`;
                this.chatMessages.appendChild(msgEl);
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
                this.lastChatTimestamp = msg.timestamp;

                // Handle unread notification
                if (!isMe && this.chatContainer.classList.contains('collapsed')) {
                    this.chatContainer.classList.add('unread');
                }
            }
        });
    }

    updateReactions(reactions) {
        Object.entries(reactions).forEach(([pid, data]) => {
            // Only show if reaction is recent (last 3 seconds)
            if (Date.now() - data.timestamp < 3000) {
                const overlay = pid === 'p1' ? this.p1Reaction : this.p2Reaction;
                if (overlay) {
                    overlay.textContent = data.emoji || '😂'; // Text emoji only
                    overlay.classList.add('active');
                    setTimeout(() => overlay.classList.remove('active'), 2500);
                }
            }
        });
    }

    handleSendMessage() {
        if (!this.chatInput) return;
        const text = this.chatInput.value.trim();
        if (!text) return;

        console.log("SENDING CHAT:", text, "FROM:", this.currentPlayerName);
        this.network.sendMessage(text, this.currentPlayerName);
        this.chatInput.value = '';
    }

    updatePlayerDisplay(pid, pData) {
        const info = pid === 'p1' ? this.p1Info : this.p2Info;
        const nameEl = pid === 'p1' ? this.p1Name : this.p2Name;
        const avatarEl = pid === 'p1' ? this.p1Avatar : this.p2Avatar;
        if (!info || !nameEl || !avatarEl) return;

        const isMe = this.network.playerId === pid;
        const symbol = pid === 'p1' ? '✕' : '◯';

        if (pData) {
            info.classList.add('joined');
            info.classList.toggle('is-me', isMe);

            // Per USER request: no "BẠN" text, use real names in piece label
            nameEl.innerHTML = `${pData.name}<br><span class="piece-label">${symbol} Quân của ${pData.name}</span>`;

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

    renderBoard(lastMove = null) {
        this.boardEl.innerHTML = '';
        const boardState = this.game.getBoardState();

        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (lastMove && lastMove.row === r && lastMove.col === c) {
                    cell.classList.add('last-move');
                }

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

    setupDraggable() {
        if (!this.chatContainer || !this.chatHeader) return;

        let isDragging = false;
        let startX, startY;
        let startLeft, startTop;
        let hasMoved = false;
        let rafId = null;

        // Cache container dimensions and viewport to avoid thrashing
        let containerWidth, containerHeight;
        let viewportWidth, viewportHeight;

        const onStart = (e) => {
            // Only allow dragging from header
            if (e.target.closest('#btn-toggle-chat')) return;

            isDragging = true;
            hasMoved = false;

            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

            startX = clientX;
            startY = clientY;

            const rect = this.chatContainer.getBoundingClientRect();
            // Start positions relative to the document
            startLeft = rect.left + window.scrollX;
            startTop = rect.top + window.scrollY;
            containerWidth = rect.width;
            containerHeight = rect.height;

            // Cache viewport dimensions
            viewportWidth = window.innerWidth;
            viewportHeight = window.innerHeight;

            // On mobile, use visualViewport if available for better accuracy with browser UI
            if (window.visualViewport) {
                viewportWidth = window.visualViewport.width;
                viewportHeight = window.visualViewport.height;
            }

            this.chatContainer.classList.add('dragging');

            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onEnd);
        };

        const onMove = (e) => {
            if (!isDragging) return;

            const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;

            if (!hasMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                hasMoved = true;
            }

            if (hasMoved) {
                if (e.cancelable) e.preventDefault();

                if (rafId) cancelAnimationFrame(rafId);

                rafId = requestAnimationFrame(() => {
                    // Calculate new position relative to document
                    let docNewLeft = startLeft + dx;
                    let docNewTop = startTop + dy;

                    // Calculate viewport-relative position for clamping
                    const scrollX = window.scrollX;
                    const scrollY = window.scrollY;

                    let viewLeft = docNewLeft - scrollX;
                    let viewTop = docNewTop - scrollY;

                    // Improved Clamping Logic (relative to viewport)
                    viewLeft = Math.max(0, Math.min(viewLeft, viewportWidth - containerWidth));
                    viewTop = Math.max(0, Math.min(viewTop, viewportHeight - containerHeight));

                    // Convert back to document-relative for style.top/left
                    this.chatContainer.style.left = `${viewLeft + scrollX}px`;
                    this.chatContainer.style.top = `${viewTop + scrollY}px`;
                    this.chatContainer.style.right = 'auto';
                    this.chatContainer.style.bottom = 'auto';
                });
            }
        };

        const onEnd = () => {
            isDragging = false;
            this.chatContainer.classList.remove('dragging');
            if (rafId) cancelAnimationFrame(rafId);

            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
        };

        this.chatHeader.addEventListener('mousedown', onStart);
        this.chatHeader.addEventListener('touchstart', onStart, { passive: false });

        this._isDraggingMove = () => hasMoved;
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
