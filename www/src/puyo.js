import { puyoSize, stageRows } from "./config.js";

// ぷよの色を表す数字。各色のぷよ画像のファイル名と合わせる
const GREEN = 1;
const BLUE = 2;
const PURPLE = 3;
const RED = 4;
const YELLOW = 5;

class Tsumo {
    constructor(jikuColor, dependentColor) {
        this.jikuColor = jikuColor;
        this.dependentColor = dependentColor;
        this.groundingTime = 0; // 接地累計時間

        // ツモが落ちてくる初期位置の設定。親要素内での相対位置
        this.jikuPositionX = 3 * puyoSize;
        this.jikuPositionY = -1 * puyoSize;
    }
}

const puyoFallingSpeed = 0.4; // 1フレームでぷよ何個分自由落下するか

// ステージ上に設置されたぷよのクラス
export class StagePuyo {

    /**
     * @param {string} id dom要素の識別などに利用する識別子
     * @param {number} color 色を表す整数
     * @param {number} positionX ステージ左端を基準とする左右の表示位置
     * @param {number} positionY ステージ上端を基準とする上下の表示位置
     */
    constructor(id, color, positionX, positionY) {
        this.id = id;
        this.color = color;
        this.positionX = positionX;
        this.positionY = positionY;

        this.destinationRowHeight = 1; // 何段目まで自由落下するか
    }

    /**
     * 自由落下の終着点を設定する 
     * @param {number} row 下から何段目まで落ちる？
     */
    setDestinationHeight(row) {
        this.destinationRowHeight = row;
    }

    /**
     * ぷよを1フレーム分自由落下させる
     * @returns {boolean} 落下でぷよの位置が変化した場合ははtrueを返す
     */
    fall() {
        const destinationPosition = calculatePuyoPosition(this.destinationRowHeight);
        if (this.positionY >= destinationPosition) {
            return false;
        }
        this.positionY = Math.min(
            destinationPosition,
            this.positionY + puyoFallingSpeed * puyoSize
        );
        return true;
    }
}

/**
 * n段目のぷよが置かれる位置を表す
 * @param {number} rowHeight 何段目？
 * @returns {number} ぷよが置かれる位置。画面上端をゼロとする
 */
function calculatePuyoPosition(rowHeight) {
    return puyoSize * (stageRows - rowHeight);
}


export class TsumoGenerator {
    colorCount = 4;
    generatingUinitSize = 16; // 何手で色が均等になるように生成するか
    tsumoColorSet = [];
    moveCount = 0;

    observers = [];

    constructor() {
        this._createNewTsumoUnit;
        // TODO 初手が3色以下になるようにツモ補正
    }

    addOvserver(ov) {
        this.observers.push(ov);
    } 

    // 一手進める
    proceed() {
        this.moveCount++;
        // 　足りなくなったら先のツモを生成する
        if (this.tsumoColorSet.length < this.moveCount * 2 + 3) {
            this._createNewTsumoUnit();
        }
        this.observers.forEach(o => o.updateTsumo(this))
    }

    getCurrentTsumo() {
        if (this.moveCount === 0) {
            return new Tsumo(GREEN, GREEN); // 開始前の仮の値
        }
        return new Tsumo(
            this.tsumoColorSet[this.moveCount * 2 - 2],
            this.tsumoColorSet[this.moveCount * 2 - 1]
        );
    }

    getNextTsumo() {
        return new Tsumo(
            this.tsumoColorSet[this.moveCount * 2],
            this.tsumoColorSet[this.moveCount * 2 + 1]
        );
    }

    getNextNextTsumo() {
        return new Tsumo(
            this.tsumoColorSet[this.moveCount * 2 + 2],
            this.tsumoColorSet[this.moveCount * 2 + 3]
        );
    }

    _createNewTsumoUnit() {
        const colorUnit = [GREEN, RED, BLUE, YELLOW, PURPLE].slice(0, this.colorCount);
        const repeatCount = Math.floor(this.generatingUinitSize * 2 / this.colorCount);
        const unitSet = Array(repeatCount).fill(colorUnit).flat();

       // Fisher–Yates shuffle
        for (let i = unitSet.length - 1; i >= 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [unitSet[i], unitSet[j]] = [unitSet[j], unitSet[i]];
        }

        this.tsumoColorSet = this.tsumoColorSet.concat(unitSet);
    }
}