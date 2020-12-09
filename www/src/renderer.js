const stageBackgroundColor = '#ffffff'; // ステージの背景色
const scoreBackgroundColor = '#24c0bb'; // スコアの背景色

export class Renderer {
    constructor(stageSize, fontHeight) {
        this.puyoSize = (window.innerHeight - fontHeight) / stageSize.rows;
        this.scoreRenderer = new ScoreRenderer(stageSize, this.puyoSize, fontHeight);
        this.stageRenderer = new StageRenderer(stageSize, this.puyoSize);
        
    }

    firstRender() {
        this.scoreRenderer.firstRender();
        this.stageRenderer.firstRender();
    }
}

class ScoreRenderer {
    fontTemplateList = []


    constructor(stageSize, puyoSize, fontHeight) {
        this.stageSize = stageSize;
        this.puyoSize = puyoSize;
        this.fontHeight = fontHeight;
        this.scoreElement = document.getElementById("score");

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

        this.fontLength = Math.floor(stageSize.cols * puyoSize / this.fontTemplateList[0].width);
    }

    firstRender() {
        this.scoreElement.style.backgroundColor = scoreBackgroundColor;
        this.scoreElement.style.top = this.puyoSize.height * this.stageSize.rows + 'px';
        this.scoreElement.style.width = this.puyoSize.width * this.stageSize.cols + 'px';
        this.scoreElement.style.height = this.fontHeight + "px";
        this.updateScore(0);
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

}


class StageRenderer {

    constructor(stageSize, puyoSize) {
        this.stageSize = stageSize;
        this.puyoSize = puyoSize;
    }

    firstRender() {
        // HTML からステージの元となる要素を取得し、大きさを設定する
        const stageElement = document.getElementById("stage");
        stageElement.style.width = this.puyoSize * this.stageSize.cols + 'px';
        stageElement.style.height = this.puyoSize * this.stageSize.rows + 'px';
        stageElement.style.backgroundColor = stageBackgroundColor;

        const nextElement = document.getElementById("next");
        nextElement.style.width = this.puyoSize + 'px';
        nextElement.style.height = this.puyoSize * 2 + 'px';

        const nextnextElement = document.getElementById("next-next");
        nextnextElement.style.width = this.puyoSize + 'px';
        nextnextElement.style.height = this.puyoSize * 2 + 'px';
    }
}