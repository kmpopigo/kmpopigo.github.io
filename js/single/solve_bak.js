function solve() {
    let populationNum = 100;
    let initNum = 100;
    // 总共有多少t时刻
    let m = gaData.xiList.length;
    // 几个里面选择一个
    let alternateNum = math.max(parseInt(initNum/populationNum),1);
    // 迭代次数
    let epochTotal = 10000;
    let epochNum = 10000;
    //初始种群
    let populationList = initPopulation10(m, initNum,populationNum,gaData.total);
    gaData.interval = setInterval(function (){
        let nextGenerationList = [];
        // 繁衍后代
        for (let i = 0; i < populationNum; i++) {
            let father = selectGoodFather(populationList,3);
            for(let sunmun=0;sunmun<alternateNum;sunmun++){
                nextGenerationList.push(nextGeneration(father));
            }
        }
        populationList = nextGenerationList
        showCandE(populationList)
        epochNum--;
        $("#epoch").html(epochTotal-epochNum)
        if(epochNum<=0){
            saveSolution();
            clearInterval(gaData.interval);
        }
        if(gaData.minCount>200){
            saveSolution();
            clearInterval(gaData.interval);
        }
        console.log("迭代："+(epochTotal-epochNum))

    },50);
}

function initPopulation10(m, initNum,populationNum,total) {
    let populationList = [];
    console.warn([gaData.tlist,gaData.riskNumberDict])
    for (let pnum = 0; pnum < populationNum; pnum++) {
        let population = generatePositiveIntegersWithFixedSum(m,total);
        populationList.push(population);
    }
    return populationList;
}

// 生成固定数值的数组
function generatePositiveIntegersWithFixedSum(m, total) {
    let length = m*2+1;
    // 生成长度为 length 的数组，每个元素初始化为 1
    let c11 = Array(m+1).fill(0);
    let e10 = Array(m).fill(1);
    let integers = [];
    if(gaData.events>0){
        let leftNum = m;
        // 随机选择一个位置，将其值加1
        while (leftNum < gaData.events) {
            let randomIndex = Math.floor(Math.random() * m);
            e10[randomIndex]++;
            leftNum++;
        }
        let initnum = 0;
        while (initnum < (total-gaData.events)) {
            let randomIndex = Math.floor(Math.random() * (m+1));
            c11[randomIndex]++;
            initnum++;
        }
        integers = c11.concat(e10);
    }else{
        integers = c11.concat(e10);
        // 计算数组的总和
        let currentSum = m;
        // 随机选择一个位置，将其值加1
        while (currentSum < total) {
            let randomIndex = Math.floor(Math.random() * length);
            integers[randomIndex]++;
            currentSum++;
        }
    }

    return [integers.slice(0,m),integers.slice(m+1,2*m+1),integers[m]];
}
//生成特定长度的字符串
function generateRandomBinaryString(length) {
    let binaryArray = [];
    for (let i = 0; i < length; i++) {
        binaryArray.push(math.randomInt(2))
    }
    gaData.sureCensor.forEach(function (value,i) {
        if(value>0){
            let bitCensor = tenToBit(value,gaData.bitLength);
            for(let j=0;j<bitCensor.bitLength;j++){
                binaryArray[i*gaData.bitLength+j] = bitCensor[j];
            }
        }
    })
    return binaryArray;
}
// 10进制转2进制
function tenToBit(n,bitLength){
    let bitN = n.toString(2);
    let tempStr="";
    for(let i=0;i<bitLength-bitN.length;i++){
        tempStr+="0";
    }
    return tempStr+bitN;
}
//表格呈现删失和死亡人数
function showCandE(populationList){
    let minPopulation = populationList[0];
    populationList.forEach(function (value){
        if(lossFun.probabilityLoss(minPopulation)>lossFun.probabilityLoss(value)){
            minPopulation = value;
        }
    })
    let lossList = [];
    let C10 = minPopulation[0];
    let E10 = minPopulation[1];
    let minloss = lossFun.allLoss(minPopulation);
    if(gaData.minLoss>minloss){
        gaData.minLoss = minloss;
        gaData.minCount = 0;
        gaData.minPopulation = minPopulation;
    }else{
        gaData.minCount++;
    }
    let reP = reCreateProbability(gaData.minPopulation)

    $("#hrValue").empty();
    $("#hrValue").append("<div style='font-size: 16px;font-weight: bold;padding: 5px;'>Total Minimum Loss：<stong style='color: #FFFF00;'>"+gaData.minLoss.toFixed(8)+"("+gaData.minCount+")"+"</stong></div>")
    $("#hrValue").append("<div style='font-size: 16px;font-weight: bold;padding: 5px;'>Total Loss：<stong style='color: #FFFF00;'>"+lossFun.allLoss(gaData.minPopulation)+"</stong></div>")
    $("#hrValue").append("<div style='font-size: 16px;font-weight: bold;padding: 5px;'>Probability Loss：<stong style='color: #FFFF00;'>"+lossFun.probabilityLoss(gaData.minPopulation)+"</stong></div>")
    $("#hrValue").append("<div style='font-size: 16px;font-weight: bold;padding: 5px;'>At Risk Loss：<stong style='color: #FFFF00;'>"+lossFun.atRiskLoss(gaData.minPopulation)+"</stong></div>")
    $("#hrValue").append("<div style='font-size: 16px;font-weight: bold;padding: 5px;'>Censoring Loss：<stong style='color: #FFFF00;'>"+lossFun.censorLoss(gaData.minPopulation)+"</stong></div>")
    for (let i = 0; i < C10.length; i++) {
        let tempLoss = 0;
        for (let j = 0; j <= i; j++) {

            if (i == j) {
                tempLoss += C10[j] + E10[j] * gaData.xiList[i] - gaData.total;
            } else {
                tempLoss += C10[j] + E10[j];
            }
        }
        lossList.push(Math.abs(tempLoss))
    }
    let tbStr = '<table class="sq-table">';
    tbStr +='<tr>' +
        '<td>t</td>' +
        '<td>p</td>' +
        '<td>Censor</td>' +
        '<td>Event</td>' +
        '<td>Reconstructed p</td>' +
        '<td>Error</td>' +
        '</tr>'
    for(let i=0;i<gaData.tlist.length-1;i++){
        tbStr +='<tr>' +
            '<td>'+gaData.tlist[i+1]+'</td>' +
            '<td>'+gaData.plist[i+1]+'</td>' +
            '<td>'+gaData.minPopulation[0][i]+'</td>' +
            '<td>'+gaData.minPopulation[1][i]+'</td>' +
            '<td>'+reP[i+1].toFixed(3)+'</td>' +
            // '<td>'+parseFloat(lossList[i]).toFixed(2)+'</td>' +
            '<td>'+(Math.abs(parseFloat(gaData.plist[i+1])-reP[i+1])).toFixed(3)+'</td>' +
            '</tr>'
    }
    tbStr +='<tr>' +
        '<td colspan="3">SureCensor</td>' +
        '<td colspan="3">'+gaData.sureCensor[gaData.sureCensor.length-1]+'</td>' +
        '</tr>'
    tbStr +='<tr>' +
        '<td colspan="3">LastCensor</td>' +
        '<td colspan="3">'+minPopulation[2]+'</td>' +
        '</tr>'
    tbStr +='</table>';
    $("#hrValue").append(tbStr)
    reconstructIPDFromP10(minPopulation)
}

function reconstructIPDFromP10(p10){
    $("#ipdTbody").empty();
    let ipdArray = [];
    for (let i=1;i<gaData.tlist.length;i++){
        for(let j=0;j<p10[1][i-1];j++){
            ipdArray.push([0,0,gaData.tlist[i]])
            $("#ipdTbody").append('<tr>' +
                '<td>'+gaData.label+'</td>' +
                '<td>'+1+'</td>' +
                '<td>'+gaData.tlist[i]+'</td>' +
                '</tr>')
        }
        let interval = (gaData.tlist[i]-gaData.tlist[i-1])/(p10[0][i-1]+1);
        let integrationTime = 0;
        for(let j=0;j<p10[0][i-1];j++){
            integrationTime+=interval;
            ipdArray.push([0,0,gaData.tlist[i-1]+integrationTime])
            $("#ipdTbody").append('<tr>' +
                '<td>'+gaData.label+'</td>' +
                '<td>'+0+'</td>' +
                '<td>'+(gaData.tlist[i-1]+integrationTime).toFixed(2)+'</td>' +
                '</tr>')
        }
    }
    for(let i=0;i<sureCensor[sureCensor.length-1];i++){
        let interval = (gaData.maxMonth-gaData.tlist[gaData.tlist.length-1])/sureCensor[sureCensor.length-1];
        $("#ipdTbody").append('<tr>' +
            '<td>'+gaData.label+'</td>' +
            '<td>'+0+'</td>' +
            '<td>'+(gaData.tlist[gaData.tlist.length-1]+interval*(i+1))+'</td>' +
            '</tr>')
    }


}