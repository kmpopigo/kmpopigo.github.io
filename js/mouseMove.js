$("#blue").on("mousemove", function () {
    drawInforLine()
});

function drawInforLine() {
    ctx_blue.clearRect(0, 0, blue.width, blue.height)
    // 获取鼠标点击位置相对于Canvas的坐标
    let x = event.layerX;
    let y = event.layerY;
    // 设置线条颜色和宽度
    ctx_blue.strokeStyle = "rgba(0,0,0,0.2)";
    ctx_blue.lineWidth = 3;
    ctx_blue.beginPath();
    ctx_blue.moveTo(x, 0);
    ctx_blue.lineTo(x, blue.height);
    ctx_blue.stroke();
    ctx_blue.beginPath();
    ctx_blue.moveTo(0, y);
    ctx_blue.lineTo(blue.width, y);
    // 结束路径并绘制线条
    ctx_blue.stroke();
    // 绘制0，0点
    if (zero.x != 0) {
        ctx_blue.fillStyle = "red";
        let radius = 4;
        ctx_blue.beginPath();
        ctx_blue.arc(zero.x, zero.y, radius, 0, 2 * Math.PI);
        ctx_blue.fill();
    }
    // 绘制0,maxY
    if (maxY.x != 0) {
        ctx_blue.fillStyle = "red";
        let radius = 4;
        ctx_blue.beginPath();
        ctx_blue.arc(maxY.x, maxY.y, radius, 0, 2 * Math.PI);
        ctx_blue.fill();
        ctx_blue.strokeStyle = "red";
        ctx_blue.beginPath();
        ctx_blue.moveTo(zero.x, zero.y);
        ctx_blue.lineTo(maxY.x, zero.y);
        ctx_blue.stroke();
    }
    // 绘制0,maxY
    if (maxY.x != 0) {
        ctx_blue.fillStyle = "red";
        let radius = 4;
        ctx_blue.beginPath();
        ctx_blue.arc(maxY.x, maxY.y, radius, 0, 2 * Math.PI);
        ctx_blue.fill();
        ctx_blue.strokeStyle = "red";
        ctx_blue.beginPath();
        ctx_blue.moveTo(zero.x, zero.y);
        ctx_blue.lineTo(zero.x, maxY.y);
        ctx_blue.stroke();
    }

        //绘制蓝线
        if ((posList_blue.length > 0) && (maxY.x != undefined) && (maxY.x != undefined) && (zero.x != undefined)) {
            if (drawType == "censorBlue") {
                ctx_blue.strokeStyle = "rgba(0,255,0,0.2)";
            }else{
                ctx_blue.strokeStyle = "rgba(0,255,0,1)";
            }
            for (let i = 0; i < posList_blue.length; i++) {
                if (i == 0) {
                    ctx_blue.beginPath();
                    ctx_blue.moveTo(zero.x, maxY.y);
                    ctx_blue.lineTo(posList_blue[i][0], maxY.y);
                    ctx_blue.lineTo(posList_blue[i][0], posList_blue[i][1]);
                    ctx_blue.stroke();
                } else {
                    ctx_blue.beginPath();
                    ctx_blue.moveTo(posList_blue[i - 1][0], posList_blue[i - 1][1]);
                    ctx_blue.lineTo(posList_blue[i][0], posList_blue[i - 1][1]);
                    ctx_blue.lineTo(posList_blue[i][0], posList_blue[i][1]);
                    ctx_blue.stroke();
                }
                // 设置圆点的颜色

                ctx_blue.fillStyle = "rgba(255,0,0,1)";



                // 绘制圆点
                ctx_blue.beginPath();
                if (drawType != "censorBlue") {
                    ctx_blue.arc(posList_blue[i][0], posList_blue[i][1], 4, 0, 4 * Math.PI);
                }else{
                    ctx_blue.arc(posList_blue[i][0], posList_blue[i][1], 2, 0, 2 * Math.PI);
                }
                ctx_blue.fill();
            }


        }

        //绘制删失点
        if ((censorPointList.length > 0) && (maxY.x != undefined) && (maxY.x != undefined) && (zero.x != undefined)) {
            ctx_blue.strokeStyle = "red";
            for (let i = 0; i < censorPointList.length; i++) {
                // 设置矩形的坐标和尺寸
                let width = 2; // 矩形的宽度
                let height = 20; // 矩形的高度
                let x = (censorPointList[i][0] - width / 2);
                let y = (censorPointList[i][1] - height / 2)

                // 设置矩形的颜色
                ctx_blue.fillStyle = 'rgba(0,255,0,1)';

                // 绘制矩形
                ctx_blue.fillRect(x, y, width, height);
            }

        }

}