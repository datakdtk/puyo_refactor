import { puyoSize, stageCols, stageRows, fontHeight } from "./config.js";
import { StagePuyo } from "./puyo.js";

const stageBackgroundColor = '#ffffff'; // ステージの背景色
const scoreBackgroundColor = '#24c0bb'; // スコアの背景色

const batankyuAnimationCycle = 3000; // ゲームオーバー演出のサイクルフレーム

export class Renderer {
    constructor() {
        this.stageElement = document.getElementById("stage");
        this.batankyuImage = document.getElementById('batankyu');
        this.scoreElement = document.getElementById("score");
        this.zenkeshiImage = document.getElementById("zenkeshi");
        this.fontTemplateList = [];

        
        // フォント回りの大きさ決定
        let fontWidth = 0;
        for (let i = 0; i < 10; i++) {
            const fontImage = document.getElementById(`font${i}`);
            if (fontWidth === 0) {
                fontWidth = fontImage.width / fontImage.height * fontHeight;
            }
            fontImage.height = fontHeight;
            fontImage.width = fontWidth;
            this.fontTemplateList.push(fontImage);
        }

        this.fontLength = Math.floor(stageCols * puyoSize / this.fontTemplateList[0].width);
    }

    firstRender() {
        // HTML からステージの元となる要素を取得し、大きさを設定する
        this.stageElement.style.width = puyoSize * stageCols + 'px';
        this.stageElement.style.height = puyoSize * stageRows + 'px';
        this.stageElement.style.backgroundColor = stageBackgroundColor;

        const nextElement = document.getElementById("next");
        nextElement.style.width = puyoSize + 'px';
        nextElement.style.height = puyoSize * 2 + 'px';

        const nextnextElement = document.getElementById("next-next");
        nextnextElement.style.width = puyoSize + 'px';
        nextnextElement.style.height = puyoSize * 2 + 'px';

        // ばたんきゅ～画像の大きさ設定
        this.batankyuImage.width = puyoSize * 6;
        this.batankyuImage.style.position = 'absolute';

        // スコア表示の初期化
        this.scoreElement.style.backgroundColor = scoreBackgroundColor;
        this.scoreElement.style.top = puyoSize * stageRows + 'px';
        this.scoreElement.style.width = puyoSize * stageCols + 'px';
        this.scoreElement.style.height = fontHeight + "px";
        this.updateScore(0);

        // 全消し画像の初期化
        this.zenkeshiImage.width = puyoSize * 6;
        this.zenkeshiImage.style.position = 'absolute';
        this.zenkeshiImage.style.display = 'none';        
        this.stageElement.appendChild(this.zenkeshiImage);
    }

    /**
     * 画面にぷよを追加する
     * @param {StagePuyo} puyo
     */
    addNewPuyo(puyo) {
        const element = document.createElement("img");
        element.id = puyo.id;
        element.src = imageSorcePath(puyo.color);
        element.style.width = puyoSize + "px";
        element.style.height = puyoSize + "px";
        element.style.position = "absolute";
        element.style.left = puyo.positionX + "px";
        element.style.top = puyo.positionY + "px";

        this.stageElement.appendChild(element);
    }

    /**
     * ぷよの位置変化を画面に反映させる 
     * @param {StagePuyo} puyo
     */
    updatePuyoPosition(puyo) {
        const element = document.getElementById(puyo.id);
        element.style.left = puyo.positionX + "px";
        element.style.top = puyo.positionY + "px";
    }

    updateNextTsumo(tsumoGenerator) {
        const next = tsumoGenerator.getNextTsumo();
        document.getElementById("next-jiku-puyo").src = imageSorcePath(next.jikuColor);
        document.getElementById("next-child-puyo").src = imageSorcePath(next.childColor);
  
        const nextnext = tsumoGenerator.getNextNextTsumo();
        document.getElementById("next-next-jiku-puyo").src = imageSorcePath(nextnext.jikuColor);
        document.getElementById("next-next-child-puyo").src = imageSorcePath(nextnext.childColor);
    }

    /**
     * ぷよ消えエフェクトの描画
     * @param {PoppingPuyos} poppingPuyos
     * @param {number} currentFrame
     */
    renderPoppingAnimation(poppingPuyos, currentFrame) {
        const ratio = poppingPuyos.poppingProgressRate(currentFrame);
        if (ratio >= 1) {
            // アニメーションを終了する
            const stageElement = document.getElementById("stage");
            poppingPuyos.puyoIds.forEach(id => {
                var element = document.getElementById(id);
                if (element) {
                    stageElement.removeChild(element);
                }
            });
            return;
        }

        const display = ratio > 0.75 || (ratio < 0.50 && ratio > 0.25) ? "block" : "none";
        poppingPuyos.puyoIds.forEach(id => {
            var element = document.getElementById(id);
            element.style.display = display;
        });
    }

    updateScore(score) {
        let unprinted_numbers = score;
        // まず最初に、scoreElement の中身を空っぽにする
        while(this.scoreElement.firstChild) {
            this.scoreElement.removeChild(this.scoreElement.firstChild);
        }
        // スコアを下の桁から埋めていく
        for(let i = 0; i < this.fontLength; i++) {
            // 10で割ったあまりを求めて、一番下の桁を取り出す
            const number = unprinted_numbers % 10;
            // 一番うしろに追加するのではなく、一番前に追加することで、スコアの並びを数字と同じようにする
            this.scoreElement.insertBefore(this.fontTemplateList[number].cloneNode(true), this.scoreElement.firstChild);
            // 10 で割って次の桁の準備をしておく
            unprinted_numbers = Math.floor(unprinted_numbers / 10);
        }
    }

    showZenkeshi() {
        // 全消しを表示する
        this.zenkeshiImage.style.display = 'block';
        this.zenkeshiImage.style.opacity = '1';
        const startTime = Date.now();
        const startTop = puyoSize * stageRows;
        const endTop = puyoSize * stageRows / 3;
        const animation = () => {
            const ratio = Math.min((Date.now() - startTime) / Config.zenkeshiDuration, 1);
            this.zenkeshiImage.style.top = (endTop - startTop) * ratio + startTop + 'px';
            if(ratio !== 1) {
                requestAnimationFrame(animation);
            }
        };
        animation();
    }

    hideZenkeshi() {
        // 全消しを消去する
        const startTime = Date.now();
        const animation = () => {
            const ratio = Math.min((Date.now() - startTime) / Config.zenkeshiDuration, 1);
            this.zenkeshiImage.style.opacity = String(1 - ratio);
            if(ratio !== 1) {
                requestAnimationFrame(animation);
            } else {
                this.zenkeshiImage.style.display = 'none';
            }
        };
        animation();
    }

    showBatankyuImage() {
        this.stageElement.appendChild(this.batankyuImage);
        this.batankyuImage.style.top = -this.batankyuImage.height + 'px';
    }

    renderBatankyuAnimation(frame) {
        const ratio = frame / batankyuAnimationCycle;
        const x = Math.cos(Math.PI / 2 + ratio * Math.PI * 2 * 10) * puyoSize;
        const y = Math.cos(Math.PI + ratio * Math.PI * 2) * puyoSize * stageRows / 4 + puyoSize * stageRows / 2;
        this.batankyuImage.style.left = x + 'px';
        this.batankyuImage.style.top = y + 'px';
    }
}

function imageSorcePath(colorInt) {
    return `./img/puyo_${colorInt}.png`
}
