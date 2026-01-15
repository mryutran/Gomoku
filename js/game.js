export class GomokuGame {
    constructor(size = 15) {
        this.size = size;
        this.board = Array(size).fill(null).map(() => Array(size).fill(null));
        this.gameOver = false;
        this.winner = null;
        this.winningLine = [];
    }

    reset() {
        this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(null));
        this.gameOver = false;
        this.winner = null;
        this.winningLine = [];
    }

    placeStone(row, col, player) {
        if (this.gameOver || this.board[row][col] !== null) {
            return false;
        }

        this.board[row][col] = player;

        if (this.checkWin(row, col, player)) {
            this.gameOver = true;
            this.winner = player;
        }

        return true;
    }

    checkWin(row, col, player) {
        const directions = [
            [0, 1],  // Horizontal
            [1, 0],  // Vertical
            [1, 1],  // Diagonal \
            [1, -1]  // Diagonal /
        ];

        for (const [dr, dc] of directions) {
            let count = 1;
            let line = [[row, col]];

            // Check in positive direction
            let r = row + dr;
            let c = col + dc;
            while (r >= 0 && r < this.size && c >= 0 && c < this.size && this.board[r][c] === player) {
                count++;
                line.push([r, c]);
                r += dr;
                c += dc;
            }

            // Check in negative direction
            r = row - dr;
            c = col - dc;
            while (r >= 0 && r < this.size && c >= 0 && c < this.size && this.board[r][c] === player) {
                count++;
                line.push([r, c]);
                r -= dr;
                c -= dc;
            }

            // "Bị chặn 5 hai đầu vẫn thắng" 
            if (count >= 5) {
                this.winningLine = line;
                return true;
            }
        }

        return false;
    }

    checkDraw() {
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === null) return false;
            }
        }
        return true;
    }

    getBoardState() {
        return this.board;
    }

    setBoardState(newState) {
        this.board = newState;
    }
}
