let lossFun = {
    probabilityLoss: function (population10,plist) {
        if(plist == undefined){
            plist = gaData.plist;
        }
        //重构概率损失
        let rePlist = reCreateProbability(population10);
        // console.log([rePlist,gaData.plist,population10,gaData.tlist])
        let loss = 0;
        let lossArray = [];
        for (let i = 0; i < plist.length; i++) {
            loss += Math.abs((plist[i] - rePlist[i]) );
            lossArray.push(Math.abs((plist[i] - rePlist[i]) ))
        }
        // console.log([population10[0],plist,rePlist,loss])
        // return (loss / plist.length)
        return ((loss / plist.length)+math.max(lossArray));
    },
    atRiskLoss: function atRiskLoss(population10) {
        if (gaData.atRiskTimeArray.length == 0){
            return 0;
        }
        //在风险人数损失
        let loss = 0;
        let totalNum = 0;
        let curAtRiskTime = 0;
        let curAtRiskTimeBack = 10000000;

        let totalBack = population10[2];

        for (let i = gaData.tlist.length - 1; i >= 1; i--) {
            totalBack +=  population10[1][i-1];
            for (let timeIndex = 0; timeIndex < gaData.atRiskTimeArray.length; timeIndex++) {
                if (gaData.tlist[i] < gaData.atRiskTimeArray[timeIndex]) {
                    break;
                }
                curAtRiskTimeBack = gaData.atRiskTimeArray[timeIndex];
            }
            if (totalBack > gaData.atRiskDict[curAtRiskTimeBack]) {
                loss += Math.abs(gaData.atRiskDict[curAtRiskTimeBack]-totalBack);
            }
            totalBack += population10[0][i-1];
        }

        for (let i = 1; i < gaData.tlist.length; i++) {
            totalNum += population10[0][i-1] + population10[1][i-1];
            for (let timeIndexF = 1; timeIndexF < gaData.atRiskTimeArray.length; timeIndexF++) {
                if (gaData.tlist[i] < gaData.atRiskTimeArray[timeIndexF]) {
                    curAtRiskTime = gaData.atRiskTimeArray[timeIndexF];
                    break;
                }
            }
            if(gaData.tlist[i]>curAtRiskTime){
                break;
            }
            if (totalNum > gaData.riskNumberDict[curAtRiskTime]) {
                loss += Math.abs(totalNum - gaData.riskNumberDict[curAtRiskTime]);
            }
        }
        return loss/gaData.tlist.length/gaData.atRiskTimeArray.length;
    },
    censorLoss: function (population10) {
        let loss = 0;
        let C10 = population10[0];
        for (let i = 0; i < C10.length; i++) {
            if (C10[i] < gaData.sureCensor[i]) {
                loss += Math.abs(gaData.sureCensor[i] - C10[i]);
            }
        }
        if (population10[2] < gaData.sureCensor[gaData.sureCensor.length - 1]) {
            loss += Math.abs(gaData.sureCensor[gaData.sureCensor.length - 1] - population10[2]);
        }
        return loss/gaData.plist.length;
    },
    allLoss :function (population10){
        let allLoss = lossFun.probabilityLoss(population10)+lossFun.atRiskLoss(population10)+lossFun.censorLoss(population10)
        return allLoss;
    }
}

function getCurrentAtRiskNum(population10, beginIndex) {
    let total = 0;
    let C10 = population10[0];
    let E10 = population10[1];
    let lastCensor = population10[2];
    for (let i = beginIndex; i < E10.length; i++) {
        total += E10[i] + C10[i] + lastCensor;
    }
    return total;
}

//计算总的loss
function totalLoss(populationList) {
    let totalLoss = 0;
    populationList.forEach(function (population) {
        totalLoss += equationLoss(population);
    })
    return totalLoss;
}

function reCreateProbability(population10, log) {

    let rePList = [1];
    let C10 = population10[0];
    let E10 = population10[1];
    let lastCensor = population10[2];
    let l = math.sum(C10) + math.sum(E10) + lastCensor;

    for (let i = 0; i < E10.length; i++) {
        if (i == 0) {
            l = l - C10[i];
        } else {
            l = l - C10[i] - E10[i - 1];
        }
        let lastP = rePList[i];
        if (log) {
            console.log([lastP, E10[i], l])
        }

        rePList.push(lastP * (l - E10[i]) / l);
    }
    // console.log(rePList)
    return rePList;
}

//构建为每个时刻损失人数
function getAtRiskNum(atRiskTimeArray, aAtRiskArray) {
    let intervalDict = {}
    if (atRiskTimeArray.length == 0) {
        return intervalDict;
    }
    for (let i = 0; i < atRiskTimeArray.length; i++) {
        intervalDict[atRiskTimeArray[i]] = aAtRiskArray[0] - aAtRiskArray[i];
    }
    return intervalDict;
}

//构建分段函数
// function getAtRiskNum(atRiskTimeArray,aAtRiskArray){
//     let intervalDict = {}
//     if(atRiskTimeArray.length == 0){
//         return intervalDict;
//     }
//     for(let i=1;i<atRiskTimeArray.length;i++){
//         let x1 = parseFloat(atRiskTimeArray[i-1]);
//         let y1 = parseFloat(aAtRiskArray[i-1]);
//         let x2 = parseFloat(atRiskTimeArray[i]);
//         let y2 = parseFloat(aAtRiskArray[i]);
//         let a = (y2-y1)/(x2-x1);
//         let b = y1-a*x1;
//         intervalDict[atRiskTimeArray[i-1]+"-"+atRiskTimeArray[i]] = [a,b];
//     }
//     return intervalDict;
// }

