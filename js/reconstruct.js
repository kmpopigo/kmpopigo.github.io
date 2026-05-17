function reconstructIPD(label,total,totalevents,posList,plist,tlist,atRiskArray,sureCensor,maxMonth){
    let xiList = []
    for (let i=0;i<plist.length-1;i++){
        xiList.push(plist[i]/(plist[i]-plist[i+1]));
    }
    atRiskTimeArray_test = [];
    aAtRiskArray_test = [];
    let atRiskDict = {};
    if(atRiskArray!=0){
        atRiskArray.forEach(function (value){
            atRiskTimeArray_test.push(value[0]);
            aAtRiskArray_test.push(value[1]);
            atRiskDict[value[0]] = value[1];
        })
    }


    if(tlist[tlist.length-1] == maxMonth){
        sureCensor.push(0);
    }

    if (typeof gaData !== 'undefined' && gaData.interval) {
        clearInterval(gaData.interval);
    }

    gaData = {
        label:label,
        total: total,
        tlist: tlist,
        plist:plist,
        xiList: xiList,
        sureCensor: sureCensor,
        lossList: [],
        bitLength: 6,
        pointNum: 0,
        minLoss: 1000000000,
        maxMonth: maxMonth,
        interval:null,
        minCount:0,
        events :totalevents,
        atRiskTimeArray:atRiskTimeArray_test,
        aAtRiskArray:aAtRiskArray_test,
        riskNumberDict:{},
        atRiskDict:atRiskDict,
        isend: false,
        isRunning: true,
        isAborted: false
    }
    gaData.riskNumberDict = getAtRiskNum(gaData.atRiskTimeArray,gaData.aAtRiskArray);
    solve(label,total,tlist,xiList,sureCensor,plist,maxMonth)
}
