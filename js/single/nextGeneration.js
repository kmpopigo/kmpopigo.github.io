function nextGeneration(father) {
    // console.log([father,mother])
    // 变异率
    let mutationRate = 1;
    let sun = father;
    let mutationNum = math.randomInt(1, math.max(parseInt(father[0].length/3),2))
    if (Math.random() < mutationRate) {
        for (let i = 0; i < mutationNum; i++) {
            if(Math.random()<0.5){
            sun = variation1(father)
            }else{
                sun = variation2(father);
            }
        }
    }
    return sun;
}

function variation1(p10) {
    let sun = p10[0].slice().concat(p10[2]).concat(p10[1].slice());
    let randomIndex = math.randomInt(0, sun.length);
    if (gaData.events > 0) {
        // 如果有发生事件数
        if (randomIndex <= p10[0].length) {
            // 如果在删失位置
            if (sun[randomIndex] > 0) {
                let awaynum = math.randomInt(1, sun[randomIndex] + 1)
                sun[randomIndex] -= awaynum;
                for (let i = 0; i < awaynum; i++) {
                    sun[math.randomInt(0, p10[0].length + 1)] += 1;
                }
            }
        } else {
            //如果在发生事件的位置
            if (sun[randomIndex] > 1) {
                let awaynum = math.randomInt(1, sun[randomIndex])
                sun[randomIndex] -= awaynum;
                for (let i = 0; i < awaynum; i++) {
                    sun[math.randomInt(p10[0].length + 1, p10[0].length + 1 + p10[1].length)] += 1;
                }
            }
        }
    } else {
        // 如果没有发生事件数
        if (randomIndex <= p10[0].length) {
            // 如果在删失位置
            if (sun[randomIndex] > 0) {
                let awaynum = math.randomInt(1, sun[randomIndex] + 1)
                sun[randomIndex] -= awaynum;
                for (let i = 0; i < awaynum; i++) {
                    sun[math.randomInt(0, sun.length)] += 1;
                }
            }
        } else {
            //如果在发生事件的位置
            if (sun[randomIndex] > 1) {
                let awaynum = math.randomInt(1, sun[randomIndex])
                sun[randomIndex] -= awaynum;
                for (let i = 0; i < awaynum; i++) {
                    sun[math.randomInt(0, sun.length)] += 1;
                }
            }
        }
    }
    return [sun.slice(0, p10[0].length), sun.slice(p10[0].length + 1, p10[0].length + 1 + p10[1].length), sun[p10[0].length]]
}
function variation2(p10) {
    let sun = p10[0].slice().concat(p10[2]).concat(p10[1].slice());
    let randomIndex = math.randomInt(0, sun.length);
    if (gaData.events > 0) {
        // 如果有发生事件数
        if (randomIndex <= p10[0].length) {
            // 如果在删失位置
            if (sun[randomIndex] > 0) {
                let awaynum = 1
                sun[randomIndex] -= awaynum;
                for (let i = 0; i < awaynum; i++) {
                    sun[math.randomInt(0, p10[0].length + 1)] += 1;
                }
            }
        } else {
            //如果在发生事件的位置
            if (sun[randomIndex] > 1) {
                let awaynum = 1
                sun[randomIndex] -= awaynum;
                for (let i = 0; i < awaynum; i++) {
                    sun[math.randomInt(p10[0].length + 1, p10[0].length + 1 + p10[1].length)] += 1;
                }
            }
        }
    } else {
        // 如果没有发生事件数
        if (randomIndex <= p10[0].length) {
            // 如果在删失位置
            if (sun[randomIndex] > 0) {
                let awaynum = 1
                sun[randomIndex] -= awaynum;
                for (let i = 0; i < awaynum; i++) {
                    sun[math.randomInt(0, sun.length)] += 1;
                }
            }
        } else {
            //如果在发生事件的位置
            if (sun[randomIndex] > 1) {
                let awaynum = 1
                sun[randomIndex] -= awaynum;
                for (let i = 0; i < awaynum; i++) {
                    sun[math.randomInt(0, sun.length)] += 1;
                }
            }
        }
    }
    return [sun.slice(0, p10[0].length), sun.slice(p10[0].length + 1, p10[0].length + 1 + p10[1].length), sun[p10[0].length]]
}
