// ぷよの色を表す数字。各色のぷよ画像のファイル名と合わせる
const GREEN = 1;
const BLUE = 2;
const PURPLE = 3;
const RED = 4;
const YELLOW = 5;

class Tsumo {
    constructor(jikuColor, dependentColor, puyoSize) {
        this.jikuColor = jikuColor;
        this.dependentColor = dependentColor;
        this.puyoSize = puyoSize;
        this.groundingTime = 0; // 接地累計時間

        // ツモが落ちてくる初期位置の設定。親要素内での相対位置
        this.jikuPositionX = 3 * puyoSize;
        this.jikuPositionY = -1 * puyoSize;
    }
}

class FreePuyo {
    constructor(color, positionX, positionY) {
        this.color = color;
        this.positionX = positionX;
        this.positionY = positionY;
    }
}


export class TsumoGenerator {
    colorCount = 4;
    generatingUinitSize = 16; // 何手で色が均等になるように生成するか
    tsumoColorSet = [];
    moveCount = 0;

    observers = [];

    constructor(puyoSize) {
        this.puyoSize = puyoSize;
        this._createNewTsumoUnit;
        // TODO 初手が3色以下になるようにツモ補正
        console.log(this);
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
        this.observers.forEach(o => o.updateTsumo(this.score))
    }

    getCurrentTsumo() {
        if (this.moveCount === 0) {
            return new Tsumo(GREEN, GREEN, this.puyoSize); // 開始前の仮の値
        }
        return new Tsumo(
            this.tsumoColorSet[this.moveCount * 2 - 2],
            this.tsumoColorSet[this.moveCount * 2 - 1],
            this.puyoSize
        );
    }

    getNextTsumo() {
        return new Tsumo(
            this.tsumoColorSet[this.moveCount * 2],
            this.tsumoColorSet[this.moveCount * 2 + 1],
            this.puyoSize
        );
    }

    getNextNextTsumo() {
        return new Tsumo(
            this.tsumoColorSet[this.moveCount * 2 + 2],
            this.tsumoColorSet[this.moveCount * 2 + 3],
            this.puyoSize
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