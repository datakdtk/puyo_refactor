import { puyoColorCount, puyoSize, stageCols, stageRows } from "./config.js";

// ぷよの色を表す数字。各色のぷよ画像のファイル名と合わせる
const GREEN = 1;
const BLUE = 2;
const PURPLE = 3;
const RED = 4;
const YELLOW = 5;

// 入力されたコマンドを示す値
export const COMMAND_MOVE_RIGHT = 1;
export const COMMAND_MOVE_LEFT = 2;
export const COMMAND_TURN_RIGHT = 3;
export const COMMAND_TURN_LEFT = 4;
export const COMMAND_QUICK_TURN = 5;

// ぷよの回転方向を示す値
const NO_TURN = 0;
const TURN_RIGHT = 1;
const TURN_LEFT = 2;
const QUICK_TURN = 3;

// 諸々の設定値
const tsumoDroppingSpeed = 0.05; // 1フレームでぷよ何個分落下するか
const fastDroppingRate = 4; // 下方向入力時に落下速度が何倍になるか
const tsumoHorizontalMoveSpeed = 0.1; // 左右移動時に1フレームでぷよ何個分ずれるか
const tsumoTurningFrame = 10; // ぷよが回転し始めてから終了までにかかるフレーム数
const tsumoGroundingFrameLimit = 32; // ぷよの累計接地時間がこのフレーム数に達すると設置状態になる
const tsumoGroundingCountLimit = 8; // ぷよの接地回数がこの数に達すると設置状態になる
const tsumoGroundingAnimationFrame = 6; // ぷよの設置エフェクトの再生時間(エフェクトは未実装)

export class Tsumo {
    constructor(moveCount, jikuColor, childColor) {
        this.jikuColor = jikuColor;
        this.childColor = childColor;

        // dom要素の識別などに利用するid
        this.jikuPuyoId = `puyo-${moveCount}a`;
        this.childPuyoId = `puyo-${moveCount}b`;

        // 軸ぷよの横方向の移動先の列番号。1始まり
        this.destinationJikuColumn = 3;

        // ツモが落ちてくる初期位置の設定。親要素内での相対位置
        this.jikuPositionX = (this.destinationJikuColumn - 1) * puyoSize;
        this.jikuPositionY = -1 * puyoSize;

        // 高速落下中か否か
        this.nowFastDropping = false;
        // 現在の回転方向
        this.turnDirection = NO_TURN;

        this.groundingFrame = 0; // 累計接地時間
        this.groundingCount = 0; // 累計接地回数
        this.nowGrounding = false; // 現在接地しているかどうか

        // 子ぷよの目標位置の角度を示す角度。0 <= θ < 360°の範囲で90°刻みの値をとる。3時の方向が0°
        this.childPuyoTargetAngle = 90;
        // 子ぷよの現在位置の角度を示す角度。0 <= θ < 360°の範囲で連続的な値をとる。3時の方向が0°
        this.childPuyoCurrentAngle= 90;

        // 処理待ちの操作入力
        this.commandQueue = [];
    }

    enableFastDropping() {
        this.nowFastDropping = true;
    }

    disableFastDropping() {
        this.nowFastDropping = false;
    }

    addCommand(command) {
        this.commandQueue.push(command);
    }

    move(stageColumns) {
        this._processCommands(stageColumns);
        this._moveHorizontally();
        this._turn();
        return this._moveVertically(stageColumns);
    }

    jikuRowHeight() {
        return stageRows - Math.ceil(this.jikuPositionY / puyoSize);
    }

    /**
     * ステージぷよオブジェクトの配列に変換する
     * @returns {StagePuyo[]} 下側に位置するぷよが先になる 
     */
    toStagePuyos() {
        const jiku = new StagePuyo(
            this.jikuPuyoId,
            this.jikuColor,
            this.destinationJikuColumn,
            this.jikuPositionX,
            this.jikuPositionY,
        );

        const currentAngleRadian = Math.PI * this.childPuyoCurrentAngle / 180;
        const child =  new StagePuyo(
            this.childPuyoId,
            this.childColor,
            this._childPuyoDestinationColumn(),
            this.jikuPositionX + Math.cos(currentAngleRadian) * puyoSize,
            this.jikuPositionY - Math.sin(currentAngleRadian) * puyoSize, // 座標が大きいほど下に来るので引き算にする
        );

        return this.childPuyoTargetAngle === 270 ? [child, jiku] : [jiku, child]; 
    }

    _processCommands(stageColumns) {
        const commandAccepting = this.groundingFrame < tsumoGroundingFrameLimit;
        if (!commandAccepting) {
            this.commandQueue = [];
            return;
        }

        while (this.commandQueue.length > 0) {
            const command = this.commandQueue.shift();
            
            const turning = this.childPuyoTargetAngle !== this.childPuyoCurrentAngle;
            const isTurningCommand = command === COMMAND_TURN_LEFT || command === COMMAND_TURN_RIGHT || command === COMMAND_QUICK_TURN;
            if (turning && isTurningCommand) {
                return; 
            }

            switch (command) {
                case COMMAND_MOVE_LEFT:
                    if (this._canMoveLeft(stageColumns)) {
                        this.destinationJikuColumn -= 1;
                    }
                    break;
                case COMMAND_MOVE_RIGHT:
                    if (this._canMoveRight(stageColumns)) {
                        this.destinationJikuColumn += 1;
                    }
                    break;
                case COMMAND_TURN_LEFT:
                    this._addTargetAngle(90);
                    this.turnDirection = TURN_LEFT;
                    const canTurnL = this._adjustJikuPositionByTurning(stageColumns);
                    if (!canTurnL) {
                        this._addTargetAngle(-90); // 回せなかったので元に戻す
                        this.turnDirection = NO_TURN;
                    }
                    break;
                case COMMAND_TURN_RIGHT:
                    this._addTargetAngle(-90);
                    this.turnDirection = TURN_RIGHT;
                    const canTurnR = this._adjustJikuPositionByTurning(stageColumns);
                    if (!canTurnR) {
                        this._addTargetAngle(90); // 回せなかったので元に戻す
                        this.turnDirection = NO_TURN;
                    }
                    break;
                case COMMAND_QUICK_TURN:
                    const verticalAligned = this.childPuyoTargetAngle === 90 || this.childPuyoTargetAngle === 270;
                    if (verticalAligned && !this._canMoveLeft(stageColumns) && !this._canMoveRight(stageColumns)) {
                        this.turnDirection = QUICK_TURN;
                        this.jikuPositionY = this.childPuyoTargetAngle === 90 ? this.jikuPositionY - puyoSize : this.jikuPositionY + puyoSize; // 軸ぷよと子ぷよの位置を入れ替える
                        this._addTargetAngle(180);
                    }
                    break;
                default:
                    console.error("unknown command: %s", command);
            }
        }
    }

    _moveHorizontally() {
        const destinationJikuPositionX = puyoSize * (this.destinationJikuColumn - 1);
        const moveUnit = puyoSize * tsumoHorizontalMoveSpeed;
        if (this.jikuPositionX < destinationJikuPositionX) {
            this.jikuPositionX = Math.min(destinationJikuPositionX, this.jikuPositionX + moveUnit);
        }
        if (this.jikuPositionX > destinationJikuPositionX) {
            this.jikuPositionX = Math.max(destinationJikuPositionX, this.jikuPositionX - moveUnit);
        }
    }

    _turn() {
        if (this.childPuyoTargetAngle === this.childPuyoCurrentAngle) {
            this.turnDirection = NO_TURN;
            return;
        }

        const unitAngle = this.turnDirection === QUICK_TURN ? 180 / tsumoTurningFrame : 90 / tsumoTurningFrame;

        if (this.turnDirection === TURN_LEFT) {
            this._addCurrentAngle(unitAngle);
            if (this.childPuyoTargetAngle === 0) {
                this.childPuyoCurrentAngle = this.childPuyoCurrentAngle < 90 ? 0 : this.childPuyoCurrentAngle;
            } else {
                this.childPuyoCurrentAngle = Math.min(this.childPuyoTargetAngle, this.childPuyoCurrentAngle);
            }
        } else {
            this._addCurrentAngle(-1 * unitAngle);
            this.childPuyoCurrentAngle = Math.max(this.childPuyoTargetAngle, this.childPuyoCurrentAngle);
            // 永遠に回り続けてしまうのを防ぐため、目標角度が0°の場合は第4象限にはみ出したら手動で誤差修正。
            if (this.childPuyoTargetAngle === 0 && this.childPuyoCurrentAngle > 270) {
                this.childPuyoCurrentAngle = 0;
            }
        }
    }

    /**
     * @param {Array[]} stageColumns ステージに配置されたぷよ情報。詳しくはStageクラス参照
     * @returns {boolean} 落下や接地など、ツモの動作が完全に完了したらfalseを返す
     */
    _moveVertically(stageColumns) {
        const groundHeight = Math.min(
            calculateColumnHeight(stageColumns, this.destinationJikuColumn),
            calculateColumnHeight(stageColumns, this._childPuyoDestinationColumn()),
        );
        const destinationJikuPositionY = this.childPuyoTargetAngle === 270 ? groundHeight - 2 * puyoSize : groundHeight - puyoSize;
        const moveUnit = this.nowFastDropping ? puyoSize * tsumoDroppingSpeed * fastDroppingRate : puyoSize * tsumoDroppingSpeed;
        this.jikuPositionY += moveUnit;

        // 以下接地判定
        const groundedBefore = this.nowGrounding;
        const movingHorizontally = this.jikuPositionX !== (this.destinationJikuColumn - 1) * puyoSize;
        const turning = this.childPuyoCurrentAngle !== this.childPuyoTargetAngle;

        const requiredToRaisePuyo = this.jikuPositionY > destinationJikuPositionY;
        if (requiredToRaisePuyo) {
            this.jikuPositionY = destinationJikuPositionY;
            this.nowGrounding = true;
        } else {
            this.nowGrounding = !turning && this.jikuPositionY >= destinationJikuPositionY;
        }

        if (!this.nowGrounding) {
            return true;
        }

        if (!groundedBefore) {
            this.groundingCount += 1;
        }

        this.groundingFrame += 1;

        if (this.groundingCount >= tsumoGroundingCountLimit) {
            this.groundingFrame = Math.max(this.groundingFrame, tsumoGroundingFrameLimit)
        }

        if (movingHorizontally || turning) {
            return true;
        }

        return this.groundingFrame < tsumoGroundingFrameLimit + tsumoGroundingAnimationFrame;
    }

    _childPuyoDestinationColumn() {
        if (this.childPuyoTargetAngle === 0) {
            return this.destinationJikuColumn + 1;
        }
        if (this.childPuyoTargetAngle === 180) {
            return this.destinationJikuColumn - 1;
        }
        return this.destinationJikuColumn;
    }

    _lowerPuyoPositionY() {
        return this.childPuyoTargetAngle === 270 ? this.jikuPositionY + puyoSize : this.jikuPositionY;
    }

    _canMoveLeft(stageColumns) {
        const leftmostCol = Math.min(this.destinationJikuColumn, this._childPuyoDestinationColumn());
        return this._lowerPuyoPositionY() <= calculateColumnHeight(stageColumns, leftmostCol- 1);
    }

    _canMoveRight(stageColumns) {
        const rightmostCol = Math.max(this.destinationJikuColumn, this._childPuyoDestinationColumn());
        return this._lowerPuyoPositionY() <= calculateColumnHeight(stageColumns, rightmostCol + 1);
    }

    /**
     * 回転による軸ぷよの押し出し処理を行う
     * @returns {boolean} 軸ぷよを押し出し先に移動させることができず、回転不可能な場合はfalseを返す
     */
    _adjustJikuPositionByTurning(stageColumns) {
        if (this.childPuyoTargetAngle === 0) {
            // 子ぷよが右側にある場合
            if (this.jikuPositionY <= calculateColumnHeight(stageColumns, this.destinationJikuColumn + 1)) {
                return true; // 回転先が空いているため横位置調整の必要なし
            }
            if (this._canMoveLeft(stageColumns)) {
                this.destinationJikuColumn -= 1; // 回転の結果左に1こずれる
                return true;
            }
            return false; // 回転先は空いていないし、ずれることもできない

        } else if (this.childPuyoTargetAngle === 180) {
            // 子ぷよが左側にある場合
            if (this.jikuPositionY <= calculateColumnHeight(stageColumns, this.destinationJikuColumn - 1)) {
                return true; // 回転先が空いているため横位置調整の必要なし
            }
            if (this._canMoveRight(stageColumns)) {
                this.destinationJikuColumn += 1; // 回転の結果右に1こずれる
                return true;
            }
            return false; // 回転先は空いていないし、ずれることもできない

        } else {
            // ぷよが縦に並んでいるので、横位置調整の必要なし
            return true;
        }
    }

    _addTargetAngle(angleDiff) {
        this.childPuyoTargetAngle += angleDiff;
        console.assert(this.childPuyoTargetAngle % 90 === 0);
        while (this.childPuyoTargetAngle < 0) {
            this.childPuyoTargetAngle += 360;
        }
        while (this.childPuyoTargetAngle >= 360) {
            this.childPuyoTargetAngle -= 360;
        }
    }

    _addCurrentAngle(angleDiff) {
        this.childPuyoCurrentAngle += angleDiff;
        while (this.childPuyoCurrentAngle < 0) {
            this.childPuyoCurrentAngle += 360;
        }
        while (this.childPuyoCurrentAngle >= 360) {
            this.childPuyoCurrentAngle -= 360;
        }
    }
}

function calculateColumnHeight(columns, colNumber) {
    if (colNumber <= 0 || colNumber > stageCols) {
        return -3 * puyoSize; // ステージ外。初期位置よりも高くする
    }
    const col = columns[colNumber - 1];
    console.assert(col);
    return puyoSize * (stageRows - col.length);
}

const puyoFallingSpeed = 0.4; // 1フレームでぷよ何個分自由落下するか
// ステージ上に設置されたぷよのクラス
export class StagePuyo {

    /**
     * @param {string} id dom要素の識別などに利用する識別子
     * @param {number} color 色を表す整数
     * @param {number} column ぷよが何列目に存在するか
     * @param {number} positionY ステージ左端を基準とする左右の表示位置
     * @param {number} positionY ステージ上端を基準とする上下の表示位置
     */
    constructor(id, color, column, positionX, positionY) {
        this.id = id;
        this.color = color;
        this.column = column;
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
        const destinationPosition = calculateVerticalPuyoPosition(this.destinationRowHeight);
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
 * @returns {number} ぷよが置かれる位置。ステージ上端をゼロとする
 */
function calculateVerticalPuyoPosition(rowHeight) {
    return puyoSize * (stageRows - rowHeight);
}


export class TsumoGenerator {
    generatingUinitSize = 16; // 何手で色が均等になるように生成するか
    tsumoColorSet = [];
    moveCount = 0;

    constructor() {
        this._createNewTsumoUnit;
        // TODO 初手が3色以下になるようにツモ補正
    }

    // 一手進める
    proceed() {
        this.moveCount++;
        // 　足りなくなったら先のツモを生成する
        if (this.tsumoColorSet.length < this.moveCount * 2 + 3) {
            this._createNewTsumoUnit();
        }
    }

    /**
     * @returns {Tsumo}
     */
    getCurrentTsumo() {
        if (this.moveCount === 0) {
            return new Tsumo(0, GREEN, GREEN); // 開始前の仮の値
        }
        return new Tsumo(
            this.moveCount,
            this.tsumoColorSet[this.moveCount * 2 - 2],
            this.tsumoColorSet[this.moveCount * 2 - 1]
        );
    }

    /**
     * @returns {Tsumo}
     */
    getNextTsumo() {
        return new Tsumo(
            this.moveCount + 1,
            this.tsumoColorSet[this.moveCount * 2],
            this.tsumoColorSet[this.moveCount * 2 + 1]
        );
    }

    /**
     * @returns {Tsumo}
     */
    getNextNextTsumo() {
        return new Tsumo(
            this.moveCount + 2,
            this.tsumoColorSet[this.moveCount * 2 + 2],
            this.tsumoColorSet[this.moveCount * 2 + 3]
        );
    }

    _createNewTsumoUnit() {
        const colorUnit = [GREEN, RED, BLUE, YELLOW, PURPLE].slice(0, puyoColorCount);
        const repeatCount = Math.floor(this.generatingUinitSize * 2 / puyoColorCount);
        const unitSet = Array(repeatCount).fill(colorUnit).flat();

       // Fisher–Yates shuffle
        for (let i = unitSet.length - 1; i >= 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [unitSet[i], unitSet[j]] = [unitSet[j], unitSet[i]];
        }

        this.tsumoColorSet = this.tsumoColorSet.concat(unitSet);
    }
}