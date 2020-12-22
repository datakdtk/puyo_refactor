import { requiredPuyoCountToPop, stageCols, stageRows } from  "./config.js";
import { StagePuyo } from "./puyo.js";

export class Stage {
    constructor() {
        this.columns = Array(stageCols).fill().map(x => []);
        this.observers = [];
    }

    addObserver(obs) {
        this.observers.push(obs);
    }

    /**
     * 盤面にぷよを追加する
     * @param {number} x ぷよを追加する列。通常0 - 5
     * @param {number} y ぷよを置く高さ。通常0 - 12
     * @param {StagePuyo} stagePuyo 置くぷよ
     */
    addPuyo(stagePuyo) {
        const c = this.columns[stagePuyo.column - 1];
        c.push(stagePuyo);
        stagePuyo.setDestinationHeight(c.length);
        if (c > stageRows + 1) {
            c.pop();
        }
    }

    /**
     * 盤上のぷよを自由落下させる
     * @returns {boolean} いずれかのぷよの位置が変化した場合trueを返す
     */
    puyosFall() {
        let anyFalls = false;
        this.columns.forEach(col => {
            col.forEach(puyo => {
                const hasFallen = puyo.fall();
                if (hasFallen) {
                    anyFalls = true;
                    this.observers.forEach(o => o.updatePuyoPosition(puyo));
                };
            })
        })
        return anyFalls;
    }

    /**
     * 
     * @param {number} currentFrame
     * @returns {PoppingPuyos|null}
     */
    checkPoppingPuyos(currentFrame) {
        /**
         * 引数で与えられた連結情報につなげられるぷよ全部繋げる
         * @param {SequentialPuyos} sequence
         * @param {number} x 現在確認中の列を表すゼロ始まりのインデックス
         * @param {number} y 現在確認中の行を表すゼロ始まりのインデックス
         */
        const completeSequence = (sequence, x, y) => {
            const col = this.columns[x];
            if (x < 0 || y < 0 || y > stageRows - 1 || !col) {
                return; // 画面外なので探索終了
            }
            const puyo = col[y];
            if (!puyo) {
                return; // ぷよの無いマスなので探索終了
            }
            const connected = sequence.tryToConnect(puyo, x, y);
            if (!connected) {
                return; // 繋がらなかったので探索終了
            }

            this.columns[x][y] = null; // 重複チェック防止のため、一度つながったぷよは一旦消す

            // 上下左右を再起的探索
            completeSequence(sequence, x + 1, y);
            completeSequence(sequence, x - 1, y);
            completeSequence(sequence, x, y + 1);
            completeSequence(sequence, x, y - 1);
        }

        const poppableSequences = [];
        const unpoppableSequences = [];
        // 配列の中身がループ中に変化するので、多分forEachじゃだめだと思う
        for (let x = 0; x < stageCols; x++) {
            const col = this.columns[x];
            const colSize = col.length;
            for (let y = 0; y < colSize; y++) {
                const puyo = col[y];
                if (!puyo) {
                    continue;
                }
                const seq = new SequentialPuyos(puyo, x, y);
                completeSequence(seq, x, y);
                if (seq.canPop()) {
                    poppableSequences.push(seq);
                } else {
                    unpoppableSequences.push(seq)
                }
            }
        }

        // 消えなかったぷよを盤面に復帰させる
        unpoppableSequences.flatMap(s => s.puyos).forEach(p => {
            this.columns[p.x][p.y] = p.puyo;
        });
        // 存在しないぷよの分だけ詰める
        this.columns = this.columns.map(c => c.filter(x => x));
        // 各ぷよの落下地点を更新
        this.columns.forEach(col => {
            const colSize = col.length;
            for (let y = 0; y < colSize; y++) {
                const puyo = col[y];
                console.assert(puyo);
                puyo.setDestinationHeight(y + 1);
            }
        });

        return poppableSequences.length > 0 ? new PoppingPuyos(poppableSequences, currentFrame) : null;
    }

    /**
     * @returns {boolean} ゲームオーバーならtrueを返す
     */
    isGameOver() {
        return this.columns[2].length >= stageRows;
    }

    isZenkeshi() {
        return this.columns.every(c => c.length === 0);
    }
}

// 同じ色同士でつながっているぷよぷよたち
class SequentialPuyos {
    /**
     * @param {StagePuyo} startPuyo 始点となるぷよ
     * @param {number} x 始点となるぷよの横位置。ゼロ始まり
     * @param {number} y 始点となるぷよの横位置。ゼロ始まり
     */
    constructor(startPuyo, x, y) {
        this.startPuyo = startPuyo;
        const p = {
            puyo: startPuyo,
            x: x,
            y: y,
        };
        this.puyos = [p];
    }

    /**
     * ぷよを繋げてみる
     * @param {StagePuyo} newPuyo 新たに繋げてみるぷよ
     * @param {number} x ぷよの横位置。ゼロ始まり
     * @param {number} y ぷよの縦位置。ゼロ始まり
     * @returns {boolean} 繋がったらtrueを返す
     */
    tryToConnect(newPuyo, x, y) {
        if (newPuyo.color !== this.startPuyo.color) {
            return false;
        }
        if (newPuyo.id === this.startPuyo.id) {
            return true;
        }
        const p = {
            puyo: newPuyo,
            x: x,
            y: y,
        };
        this.puyos.push(p);
        return true;
    } 

    /**
     * @returns {boolean} 消えるのに必要な個数以上つながっていたらtrue
     */
    canPop() {
        return this.puyos.length >= requiredPuyoCountToPop;
    }
}

// ぷよ消えエフェクトが終了するまでのフレーム数
const poppintDuration = 30;

// ぷよ消えエフェクト実行中のぷよぷよたち
export class PoppingPuyos {
    /**
     * @param {Array.<SequentialPuyos>} sequences 連結ごとにまとめられた消されるぷよたち
     * @param {number} startFrame 消えるアクションが開始されたフレーム
     */
    constructor(sequences, startFrame) {
        const puyos = sequences.flatMap(s => s.puyos);
        this.puyoCount = puyos.length;
        this.colorCount = new Set(sequences.map(s => s.startPuyo.color)).size;
        this.puyoIds = puyos.map(p => p.puyo.id);
        this.startFrame = startFrame;
    }

    /**
     * ぷよ消えエフェクトの終了フレームまで何割が経過したかを取得する
     * @param {any} currentFrame
     * @returns {number} 0から1の間の進行率
     */
    poppingProgressRate(currentFrame) {
        return Math.min(1, (currentFrame - this.startFrame) / poppintDuration);
    }

    /**
     * ぷよ消えエフェクトが終了したかどうか
     * @param {Number} currentFrame
     * @returns {boolean}
     */
    finishedPopping(currentFrame) {
        return currentFrame > this.startFrame + poppintDuration;
    }
}
