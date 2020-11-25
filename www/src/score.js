const rensaBonuses = [0, 8, 16, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 480, 512, 544, 576, 608, 640, 672];
const pieceBonuses = [0, 0, 0, 0, 2, 3, 4, 5, 6, 7, 10, 10];
const colorBonuses = [0, 0, 3, 6, 12, 24];

export const zenkeshiBonus = 3600;

export function calculatePoppingScore(rensa, piece, color) {
    rensa = Math.min(rensa, Score.rensaBonus.length - 1);
    piece = Math.min(piece, Score.pieceBonus.length - 1);
    color = Math.min(color, Score.colorBonus.length - 1);
    const scale = Score.rensaBonus[rensa] + Score.pieceBonus[piece] + Score.colorBonus[color];
    return Math.max(scale, 1) * piece * 10;
}
