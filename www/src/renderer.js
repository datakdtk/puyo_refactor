const scoreBackgroundColor = '#24c0bb'; // �X�R�A�̔w�i�F

export class Renderer {
    constructor(stageSize, fontHeight) {
        this.puyoSize = (window.innerHeight - fontHeight) / stageSize.rows;
        this.scoreRenderer = new ScoreRenderer(stageSize, this.puyoSize, fontHeight);
    }

    firstRender() {
        this.scoreRenderer.firstRender();
    }

    updateScore(newScore) {
        this.scoreRenderer.updateScore(newScore);
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
        // �܂��ŏ��ɁAscoreElement �̒��g������ۂɂ���
        while(this.scoreElement.firstChild) {
            this.scoreElement.removeChild(this.scoreElement.firstChild);
        }
        // �X�R�A�����̌����疄�߂Ă���
        for(let i = 0; i < this.fontLength; i++) {
            // 10�Ŋ��������܂�����߂āA��ԉ��̌������o��
            const number = unprinted_numbers % 10;
            // ��Ԃ�����ɒǉ�����̂ł͂Ȃ��A��ԑO�ɒǉ����邱�ƂŁA�X�R�A�̕��т𐔎��Ɠ����悤�ɂ���
            this.scoreElement.insertBefore(this.fontTemplateList[number].cloneNode(true), this.scoreElement.firstChild);
            // 10 �Ŋ����Ď��̌��̏��������Ă���
            unprinted_numbers = Math.floor(unprinted_numbers / 10);
        }
    }

}