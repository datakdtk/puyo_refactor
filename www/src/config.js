// 設定を記載しておくクラス
export class Config {
    static puyoImgWidth = 40; // ぷよぷよ画像の幅
    static puyoImgHeight = 40; // ぷよぷよ画像の高さ

    static fontHeight = 33;

    static stageCols = 6; // ステージの横の個数
    static stageRows = 12; // ステージの縦の個数

    // フィールドサイズ追加
    // 高さが全部入るように調整
    static puyoImgHeight = (window.innerHeight - this.fontHeight) / this.stageRows
    static puyoImgWidth = Config.puyoImgHeight;

    static freeFallingSpeed = 16; // 自由落下のスピード
    static erasePuyoCount = 4; // 何個以上揃ったら消えるか
    static eraseAnimationDuration = 30; // 何フレームでぷよを消すか

    static puyoColors = 4; // 何色のぷよを使うか
    static playerFallingSpeed = 0.9; // プレイ中の自然落下のスピード
    static playerDownSpeed = 15; // プレイ中の下キー押下時の落下スピード
    static playerGroundFrame = 20; // 何フレーム接地したらぷよを固定するか
    static playerMoveFrame = 10; // 左右移動に消費するフレーム数
    static playerRotateFrame = 10; // 回転に消費するフレーム数

    static zenkeshiDuration = 150; // 全消し時のアニメーションミリセカンド
    static gameOverFrame = 3000; // ゲームオーバー演出のサイクルフレーム
}

export const puyoSize = 40;
export const fontHeight = 33;

export const stageCols = 6;
export const stageRows = 12;

export const requiredPuyoCountToPop = 4;
