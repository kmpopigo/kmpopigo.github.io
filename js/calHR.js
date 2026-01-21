function refreshPoint() {
    // console.log(posList_blue)
    plist_blue = [1]
    tlist_blue = [0]
    $("#Atbody").empty()
    let maxMonth = $("#rightx").val();
    let currentMonthBlue = 0;
    let yfullpixBlue = (1-parseFloat($("#lefty").val())) / (zero.y - maxY.y);
    let xfullpixBlue = maxMonth / (maxY.x - zero.x);
    let curBlueP = 0;
    let curBlueT = 0;
    // 这里必须保证posList_blue的x坐标从小到大排列。
    for (let i = 0; i < posList_blue.length; i++) {

        curBlueP = parseFloat((((zero.y - posList_blue[i][1]) * yfullpixBlue)+parseFloat($("#lefty").val())).toFixed(3));
        curBlueT = parseFloat((maxMonth - (maxY.x - posList_blue[i][0]) * xfullpixBlue).toFixed(2))
        if (i == posList_blue.length - 2) {
            if (Math.abs(((zero.y - posList_blue[i][1]) * yfullpixBlue) - ((zero.y - posList_blue[i + 1][1]) * yfullpixBlue)) < 0.02) {
                currentMonthBlue = parseFloat((maxMonth - (maxY.x - posList_blue[i + 1][0]) * xfullpixBlue).toFixed(2))
                plist_blue.push(curBlueP);
                tlist_blue.push(curBlueT);
                $("#Atbody").append('<tr>' +
                    '<td>0</td>' +
                    '<td>' + curBlueT + '</td>' +
                    '<td>' + curBlueP + '</td>' +
                    '</tr>')
                break;
            }
        } else {
            currentMonthBlue = parseFloat((maxMonth - (maxY.x - posList_blue[i][0]) * xfullpixBlue).toFixed(2));
        }
        plist_blue.push(curBlueP);
        tlist_blue.push(curBlueT);
        $("#Atbody").append('<tr>' +
            '<td>0</td>' +
            '<td>' + curBlueT + '</td>' +
            '<td>' + curBlueP + '</td>' +
            '</tr>')
    }
    maxtime = parseFloat((maxMonth - (maxY.x - posList_blue[posList_blue.length-1][0]) * xfullpixBlue).toFixed(2));;
    $("#maxmonth").val(maxtime)

    handleCensor();
}

// 处理删失
function handleCensor(){
    sureCensor = [];
    // 初始化确认删失数组的长度，应该跟t时刻数量一致
    for (let i = 0; i < posList_blue.length; i++) {
        sureCensor.push(0);
    }
    for (let i = 0; i < posList_blue.length; i++) {
        censorPointList.forEach(function (pos){
            if(i == 0){
                if(pos[0]<posList_blue[i][0]){
                    sureCensor[i] = sureCensor[i] + 1;
                }
            }else{
                if((pos[0]<posList_blue[i][0])&&(pos[0])>posList_blue[i-1][0]){
                    sureCensor[i] = sureCensor[i] + 1;
                }
            }

        })
    }
    console.log(sureCensor)
}