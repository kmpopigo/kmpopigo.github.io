// 选择合适的父母
function selectGoodFather(populationList,alternateNum) {
    let randomIndex = math.randomInt(populationList.length)
    let fatherIndex = randomIndex;
    for(let i=0;i<alternateNum-1;i++){
        randomIndex = math.randomInt(populationList.length);
        if(lossFun.allLoss(populationList[fatherIndex])>lossFun.allLoss(populationList[randomIndex])){
            fatherIndex = randomIndex;
        }
    }
    return populationList[fatherIndex];
}

function getNextGeneration(populationList) {
    // 计算所有个体的适应度值
    let fitnessList = populationList.map(individual => -lossFun.allLoss(individual));

    // 根据适应度值对个体进行排序，适应度值越高，排名越前
    let sortedPopulation = populationList.map((individual, index) => {
        return { individual: individual, fitness: fitnessList[index] };
    }).sort((a, b) => b.fitness - a.fitness);

    // 随机打乱种群的顺序
    let shuffledIndices = Array.from({length: populationList.length}, (_, i) => i);
    shuffledIndices.sort(() => Math.random() - 0.5);

    // 提取打乱后索引前50的个体
    let top50Indices = shuffledIndices.slice(0, 50);
    let selectedForMutation = top50Indices.map(index => populationList[index]);

    // 对选中的个体进行变异操作生成下一代
    let nextGenPopu = selectedForMutation.map(individual => nextGeneration(individual));

    // 用新生成的个体替换掉适应度排名后50的个体
    for(let i = 0; i < 50; i++) {
        sortedPopulation[sortedPopulation.length - 50 + i].individual = nextGenPopu[i];
    }
    populationList = []
    for(let k in sortedPopulation){
        populationList.push(sortedPopulation[k].individual)
    }

    return populationList;
}

// 选择合适的父母
function selectGoodMother(populationList,rankDict,alternateNum) {
    let randomIndex = math.randomInt(populationList.length)
    let motherIndex = randomIndex;
    for(let i=0;i<alternateNum-1;i++){
        randomIndex = math.randomInt(populationList.length);
        if(lossFun.allLoss(populationList[fatherIndex])>lossFun.allLoss(populationList[randomIndex])){
            motherIndex = randomIndex;
        }
    }
    return populationList[motherIndex];
}

// 选择下一代
function naturalSelection(nextGenerationRankDict,populationList,populationNum){
    // console.log(nextGenerationRankDict)
    let count=0;
    let nextGenerationList = [];
    for(let i=0;i<=nextGenerationRankDict.maxIndex;i++){
        if((nextGenerationList.length+nextGenerationRankDict[i].length)<=populationNum){
            nextGenerationRankDict[i].forEach(function (index){
                nextGenerationList.push(populationList[index]);
            })
        }else{
            let tempArray=[];
            nextGenerationRankDict[i].forEach(function (value){
                tempArray.push([nextGenerationRankDict.congestion[value],value]);
            })
            tempArray.sort(function(a, b) {
                return b[0] - a[0];
            });
            let leaveNum = populationNum-nextGenerationList.length;
            for(let j=0;j<leaveNum;j++){
                nextGenerationList.push(populationList[tempArray[j][1]]);
            }
        }
    }
    return nextGenerationList;
}


// 随机一个范围的整数，要求越靠前出现概率越高
function getRandomWeightedInteger(min, max) {
    const range = max - min + 1;
    const randomValue = Math.random(); // 生成一个介于 0 到 1 之间的随机数

    // 计算根据权重分布的整数
    const weightedInteger = Math.floor(min + randomValue * randomValue * randomValue * range);

    return weightedInteger;
}