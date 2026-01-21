let layer = layui.layer;
// let layer = {
//     msg:function (str){
//         alert(str);
//     }
// }
blue.addEventListener("click", function (event) {
        // 获取鼠标点击位置相对于Canvas的坐标
        let x = event.layerX;
        let y = event.layerY;
        switch (drawType){
            case "zero" :
                zero.x = x;
                zero.y = y;
                // drawType = "confirmRight";
                drawInforLine();
                layer.msg("If the selected origin is not accurate, you can keep clicking until you are satisfied.")
                break;
            case "confirmRight" :
                maxY.x = x;
                maxY.y = y;
                // drawType = "blue";
                drawInforLine();
                layer.msg("If the selected point is not accurate, you can keep clicking until you are satisfied.")
                break;
            // case "del" :
            //     posList_blue.forEach(function (value,index){
            //         if((Math.abs(value[0]-x)<5)&&(Math.abs(value[1]-y)<5)){
            //             posList_blue.splice(index, 1);
            //         }
            //     })
            //     drawInforLine();
            //     break;
            // case "delCensor" :
            //     censorPointList.forEach(function (value,index){
            //         if((Math.abs(value[0]-x)<5)&&(Math.abs(value[1]-y)<5)){
            //             censorPointList.splice(index, 1);
            //         }
            //     })
            //     drawInforLine();
            //     break;
            case "insert" :
                if(posList_blue.length<1){
                    drawType = "blue";
                }else{
                    // 遍历数组找到插入位置
                    insertNumber(posList_blue, [x,y])
                    drawInforLine();
                }

                break;
            case "blue" :
                let thred = 4;
                if((maxY!=undefined)&&(zero.x!=undefined)){
                    let lastX=parseInt(zero.x);
                    let lastY=parseInt(maxY.y);
                    if(posList_blue.length>0){
                        lastX = posList_blue[posList_blue.length-1][0];
                        lastY = posList_blue[posList_blue.length-1][1]
                    }else{
                        lastX += 1;
                        lastY += 1;
                    }
                    let newX = ((x-lastX) <thred) ? lastX+thred : x;
                    let newY = ((y-lastY) <thred) ? lastY : y;
                    if(newY>zero.y){
                        newY = zero.y;
                        // newX = lastX;
                    }else if((zero.y-newY)<thred){
                        newY = zero.y;
                        newX = lastX;
                    }else{
                        newX = ((x-lastX) <thred) ? lastX+thred : x;
                        newY = ((y-lastY <thred)) ? lastY : y;
                    }

                    posList_blue.push([newX,newY]);
                    drawInforLine();

                }else{
                    layer.msg("请先设置前四个步骤！")
                }
                for(let i=1;i<posList_blue.length-1;i++){
                    if((posList_blue[i][1]==posList_blue[i-1][1])){
                        posList_blue.splice(i,1);
                    }
                    if((posList_blue[i][0]==posList_blue[i-1][0])){
                        posList_blue.splice(i,1);
                    }
                }
                drawType = "insert";
                break;
            case "censorBlue" :
                let curcensorY = 0;
                if((maxY!=undefined)&&(zero.x!=undefined)){
                    for(let i=0;i<posList_blue.length-1;i++){
                        if(x<posList_blue[0][0]){
                            curcensorY = maxY.y;
                            break;
                        }
                        if(x<posList_blue[i+1][0]){
                            curcensorY = posList_blue[i][1];
                            break;
                        }
                    }
                    censorPointList.push([x,curcensorY]);
                }else{
                    layer.msg("请先设置前四个步骤！")
                }
                drawInforLine();

                break;
            default:
                break;
        }
        refreshPoint();

    });

function delLastPoint(){
    posList_blue.pop();
    console.log(posList_blue)
    drawInforLine();
}
// function insertNumber(array,numberToInsert){
//     if (numberToInsert[1]>zero.y){
//         numberToInsert[1] = zero.y;
//     }
//
//     for (let i = 0; i < array.length; i++) {
//         if (array[i][0] > numberToInsert[0]){
//             array.splice(i, 0, numberToInsert);
//             break;
//         }
//     }
//     if(numberToInsert[0]>array[array.length-1][0]){
//         array.push(numberToInsert);
//     }
//     removeInvalidPoints(array);
//     return array;
// }
function removeInvalidPoints(array){
    for (let i = 0; i < array.length-2; i++) {
        if (array[i][1] > array[i+1][1]){
            array.splice(i+1, 1);
            break;
        }
    }

    if(array[array.length-1][1] == zero.y){
        if(array[array.length-1][1] == array[array.length-2][1]){
            array.splice(array.length-2, 1);
        }
    }else {
        if(array[array.length-2][1] == array[array.length-3][1]){
            array.splice(array.length-2, 1);
        }
    }
    return array;
}
function insertNumber(array, numberToInsert) {
    // 寻找当前点前面y值比该点小的点
    let flagBefor = true;
    let flagBehind = true;
    let minindex = 100000;
    let behindIndex = 100000;
    let step = 3;
    // 坐标位置约束，不能大于原点y坐标
    if (numberToInsert[1]>zero.y){
        numberToInsert[1] = zero.y;
    }
    // 坐标位置约束，不能小于最大点y坐标
    if (numberToInsert[1]<maxY.y){
        numberToInsert[1] = maxY.y+3;
    }
    // 坐标位置约束，不能小于最大点y坐标
    if (numberToInsert[0]<zero.x){
        numberToInsert[0] = zero.x+3;
    }
    //如果上一个坐标与当前坐标值一样，则pop出去。
    if(array[array.length-1][1] == numberToInsert[1]){
        array.pop();
    }
    // 遍历数组找到插入位置
    for (let i = 0; i < array.length - 1; i++) {
        if(flagBefor){
            if(array[i][1]+3 > numberToInsert[1]){
                minindex = i;
                flagBefor = false;
            }
        }

        if (array[i][0] <= numberToInsert[0] && numberToInsert[0] <= array[i + 1][0]) {
            // 在找到的位置插入数字
            array.splice(i + 1, 0, numberToInsert);
            if(minindex!=100000){
                array.splice(minindex, i-minindex+1);
            }
            for (let j = i+2; j < array.length - 1; j++) {
                if(flagBehind) {
                    if (array[j][1]-3 < numberToInsert[1]) {
                        behindIndex = j;
                    }else{
                        flagBehind = false;
                    }
                }
            }
            if(behindIndex!=100000){
                console.log(i, behindIndex-i+1)
                array.splice(i+2, behindIndex-i-1);
            }
            for (let i = 0; i < array.length - 1; i++){
                if(Math.abs(array[i][0]-array[i+1][0])<2){
                    array.splice(i,1);
                }
            }
            if(array[array.length-1][1]<array[array.length-2][1]){
                array[array.length-1][1] = array[array.length-2][1]
            }
            return removeInvalidPoints(array);
        }
    }

    // 如果数字比数组中的所有元素都大，则插入到数组末尾
    if(numberToInsert[0]<array[0][0]){
        array.unshift(numberToInsert);
    }else{
        array.push(numberToInsert);
    }
    if(array[array.length-1][1]<array[array.length-2][1]){
        array[array.length-1][1] = array[array.length-2][1]
    }
    return removeInvalidPoints(array);
}

// 监听右键点击事件
blue.addEventListener('contextmenu', (event) => {
    // 阻止默认的上下文菜单
    event.preventDefault();
// 获取鼠标点击位置相对于Canvas的坐标
    let x = event.layerX;
    let y = event.layerY;
    switch (drawType) {
        case "blue" :
            posList_blue.forEach(function (value, index) {
                if ((Math.abs(value[0] - x) < 5) && (Math.abs(value[1] - y) < 5)) {
                    posList_blue.splice(index, 1);
                }
            })
            drawInforLine();
            break;
        case "insert" :
            posList_blue.forEach(function (value, index) {
                if ((Math.abs(value[0] - x) < 5) && (Math.abs(value[1] - y) < 5)) {
                    posList_blue.splice(index, 1);
                }
            })
            drawInforLine();
            break;
        case "censorBlue" :
            censorPointList.forEach(function (value, index) {
                if ((Math.abs(value[0] - x) < 5) && (Math.abs(value[1] - y) < 5)) {
                    censorPointList.splice(index, 1);
                }
            })
            drawInforLine();
            break;
    }
});