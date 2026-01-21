//系统flag为1;
var layer;
var form;
var myip = window.location.host;
var redirect = "http://"+myip+"/sqadmin/getToken.html"
var imgurl = "http://"+myip+"/";
var _url = "http://"+myip+"/";
var lm=""

// localStorage.setItem("access_token",'187b8730-fbe6-4907-b874-2dbe8033b4d4');
layui.use(['layer','form'], function(){
    layer = layui.layer
    form = layer.form
});
function reopen (){
    window.location.reload();
}

function checkRetno(result,type,fun){
    //alert("正在测试："+JSON.stringify(result))
    switch (parseInt(result.retno)){

        case 100 :
            //sq.open(result.msg);
            break;
        case 10 :
            console.log("没有数据");
            break;
        case 50 :
            layer.msg(result.msg);
            break;
        case 60 :
            sq.inputWindow(survey.loginWindow);
            break;
        case 0 :
            fun(result);
            break;
        default :
            fun(result);
            break;
    }
}
var sq = {
    getAjaxDate:function (url1,opinion,fun,_sqmethod){
        let sqmethod = (_sqmethod == undefined) ? "POST" : _sqmethod;
        url1 = (url1.match(/http:/)) ? url1 : _url+url1;
        $.ajax({
            url: url1,
            type : sqmethod,
            data : opinion,
            dataType : "json",
            success: function(result){
                //注意layer关闭的时候验证码框的问题！
                //layer.closeAll();
                sq.tipurl(url1);
                console.log("%c%s","color:#443312;background-color:#d1c9b8;font-size:10px;padding:10px;","Loading date success:"+JSON.stringify(opinion));
                console.log("%c%s","color:#999;background-color:#efefef;font-size:10px;padding:10px;","Loading date success:"+JSON.stringify(result));
                checkRetno(result,opinion.type,fun);
            },
            error:function (xhr){

            }
        });
    },

    getAjaxDateSafe:function (url1,opinion,fun,_sqmethod){
        let sqmethod = (_sqmethod == undefined) ? "POST" : _sqmethod;
        url1 = (url1.match(/http:/)) ? url1 : _url+url1;
        $.ajax({
            url: url1,
            type : sqmethod,
            data : opinion,
            dataType : "json",
            headers:{'Authorization':'Bearer '+localStorage.getItem("access_token")},
            success: function(result){
                //注意layer关闭的时候验证码框的问题！
                //layer.closeAll();
                sq.tipurl(url1);
                console.log("%c%s","color:#443312;background-color:#d1c9b8;font-size:10px;padding:10px;","Loading date success:"+JSON.stringify(opinion));
                console.log("%c%s","color:#999;background-color:#efefef;font-size:10px;padding:10px;","Loading date success:"+JSON.stringify(result));
                //alert(JSON.stringify(result));
                checkRetno(result,opinion.type,fun);
            },
            error:function (xhr){
                console.log(xhr);
                layui.use(['layer'], function(){
                    layer = layui.layer;
                    layer.msg("正在请求服务器验证，请刷新页面重试。");
                });

                switch (xhr.status) {
                    case 401 :
                        console.log("未授权尝试刷新token")
                        sq.getAjaxDate(_url+"refreshToken",{refresh_token:localStorage.getItem("refresh_token")},function (rel){
                            localStorage.setItem("access_token",rel.access_token);
                            localStorage.setItem("expires_in",rel.expires_in);
                            localStorage.setItem("refresh_token",rel.refresh_token);
                            localStorage.setItem("addToken_time", Date.parse(new Date()).toString());
                            alert("登录已失效，点击确定重新登录！")
                            reopen();
                        },"POST")
                        break;

                }
            }
        });
    },
    openDataPage :function (s,title) {
        this.violet("打开了："+s,"color:#FF00FF;background-color:#79008f;font-size:12px;padding:10px;");
        layer.open({
            type: 2,
            skin: 'layui-layer-molv',
            title: title,
            shadeClose: true,
            shade: 0.618,
            maxmin: true, //开启最大化最小化按钮
            area: ['90%', '450px'],
            content: s
        });
    },
    openImg :function (s,st) {
        sq.violet("打开了："+s,"color:#FF00FF;background-color:#79008f;font-size:12px;padding:10px;");
        layer.open({
            type: 2,
            skin: 'layui-layer-molv',
            title: st,
            shadeClose: true,
            shade: 0.618,
            maxmin: true, //开启最大化最小化按钮
            area: ['800px', '450px'],
            content: s
        });
    },
    openImgCanRotate :function (s,st) {
        sq.violet("打开了："+s,"color:#FF00FF;background-color:#79008f;font-size:12px;padding:10px;");
        layer.open({
            type: 2,
            skin: 'layui-layer-molv',
            title: st,
            shadeClose: true,
            shade: 0.618,
            maxmin: true, //开启最大化最小化按钮
            area: ['800px', '450px'],
            content: "iframewindow/imgrotate.html#u="+s
        });
    },
    open :function (s){
        window.location.href = s;
    },
    log :function (s,css) {
        css = (css == undefined) ? "color:#fff7d3;background-color:#ff4f49;font-size:12px;padding:10px;" : css;
       // console.log(window.location.href+"\n--------------------------------------------");
        //console.log(css);
        console.log("%c%s",css,s);
    },
    green :function (s,css) {
        css = (css == undefined) ? "color:#fff7d3;background-color:#33a600;font-size:12px;padding:10px;" : css;
       // console.log(window.location.href+"\n--------------------------------------------");
        console.log(css);
        console.log("%c%s",css,s);
    },
    blue :function (s,css) {
        css = (css == undefined) ? "color:#fff7d3;background-color:#00768f;font-size:12px;padding:10px;" : css;
        //console.log(window.location.href+"\n--------------------------------------------");
        //console.log(css);
        console.log("%c%s",css,s);
    },
    violet :function (s,css) {
        css = (css == undefined) ? "color:#fff7d3;background-color:#79008f;font-size:12px;padding:10px;" : css;
        //console.log(window.location.href+"\n--------------------------------------------");
        //console.log(css);
        console.log("%c%s",css,s);
    },
    tipurl :function (s,css) {
        css = (css == undefined) ? "color:#fff7d3;background-color:#675c48;font-size:12px;padding:10px;" : css;
        //console.log(window.location.href+"\n--------------------------------------------");
        //console.log(css);
        console.log("%c%s",css,s);
    },
    getHashStringArgs : function() {
        var hashStrings = (window.location.hash.length > 0 ? window.location.hash.substring(1) : "");
        hashArgs = {};
        items = hashStrings.length > 0 ? hashStrings.split("&") : [];
        item = null;
        _name = null;
        value = null;
        i = 0;
        len = items.length;
        for (i = 0; i < len; i++) {
            item = items[i].split("=");
            _name = decodeURIComponent(item[0]);
            value = decodeURIComponent(item[1]);
            if (_name.length > 0) {
                hashArgs[_name] = value;
            }
        }
        return hashArgs;
    },
    getQueryVariable :function (variable)
    {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if(pair[0] == variable){return pair[1];}
        }
        return(false);
    },
    existence:function (s) {
        try{
            JSON.parse(localStorage.getItem(s));
            if(localStorage.getItem(s) == undefined){
                return false;
            }else{
            return true;
            }
        }catch(error) {
            localStorage.removeItem(s);
            return false;
        }
    },
    treeData : function (url,obj,fun,setobj) {
        if(setobj == undefined){setobj = {id:"id",title:"title",field:"pid"}};
        sq.green(JSON.stringify(setobj))
        function toTree(data) {
            // 删除 所有 children,以防止多次调用
            data.forEach(function (item) {
                delete item.children;
            });

            // 将数据存储为 以 id 为 KEY 的 map 索引数据列
            var map = {};
            data.forEach(function (item) {
                map[item.id] = item;
            });
//        console.log(map);
            var val = [];
            data.forEach(function (item) {
                // 以当前遍历项，的pid,去map对象中找到索引的id
                var parent = map[item.field];
                // 好绕啊，如果找到索引，那么说明此项不在顶级当中,那么需要把此项添加到，他对应的父级中
                if (parent) {
                    (parent.children || (parent.children = [])).push(item);
                } else {
                    //如果没有在map中找到对应的索引ID,那么直接把 当前的item添加到 val结果集中，作为顶级
                    val.push(item);
                }
            });
            return val;
        }
        sq.getAjaxDateSafe(url,
            obj,
            function (rel) {
                var data = [];
                for(var i=0;i<rel.list.length;i++){
                    data.push({id:rel.list[i][setobj.id],title:rel.list[i][setobj.title],field:rel.list[i][setobj.field]})
                }
                fun(toTree(data));
            })
    },
    roleindex : function (id) {
        for(var i = 0;i<roleList.length;i++){
            if(roleList[i].id == id){
                return i;
            }
        }
        return -1;
    },
    isundefinde :function (str) {
        if(str == undefined){
            return "";
        }else{
            return str;
        }
    },
    fmtDate:function (time,type) {
        var date;
        date = (parseInt(time) >100000) ? new Date(time * 1000) : new Date(time);
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        m = m < 10 ? ('0' + m) : m;
        var d = date.getDate();
        d = d < 10 ? ('0' + d) : d;
        var h = date.getHours();
        h = h < 10 ? ('0' + h) : h;
        var minute = date.getMinutes();
        var second = date.getSeconds();
        minute = minute < 10 ? ('0' + minute) : minute;
        second = second < 10 ? ('0' + second) : second;
        switch (type){
            case 0 :
                return y + '-' + m + '-' + d;
            case 1 :
                return y + '/' + m + '/' + d;
            case 2 :
                return y + '年' + m + '月' + d+"日";
            case 3 :
                return m + '-' + d;
            case 4 :
                return m + '月' + d+"日";
            case 5 :
                return y + '.' + m;
            default :
                return y + '-' + m + '-' + d+' '+h+':'+minute+':'+second;
        }
    },
    isnull : function (str,behindstr,exnullstr) {
        if(str == null){
            return (exnullstr == undefined) ? "" : exnullstr;
        }else if(str == undefined){
            return (exnullstr == undefined) ? "" : exnullstr;
        }else{
            return (behindstr == undefined) ? str : str+behindstr;
        }
    },
    hasimg : function (str) {
        if(str == null){
            return "../images/no.png";
        }else if(str == undefined){
            return "../images/no.png";
        }else{
            return imgurl+str;
        }
    },
    category : function (id) {
        id = parseInt(id);
        var cate = JSON.parse(localStorage.getItem("tree"));
        for(var i = 0;i<cate.length;i++){
            if(cate[i].id == id){
                return cate[i].level_name;
            }
            if(cate[i]){
            for(var j = 0 ;j<cate[i].son.length;j++){
                if(cate[i].son[j].id == id){
                    return cate[i].son[j].level_name;
                }
                if(cate[i].son[j].son) {
                    //console.log(cate[i].son[j].son);
                    for (var k = 0; k < cate[i].son[j].son.length; k++) {
                        if (cate[i].son[j].son[k].id == id) {
                            return cate[i].son[j].son[k].level_name;
                        }
                        if(cate[i].son[j].son[k].son) {
                            //console.log(cate[i].son[j].son);
                            for (var l = 0; l < cate[i].son[j].son[k].son.length; l++) {
                                if (cate[i].son[j].son[k].son[l].id == id) {
                                    return cate[i].son[j].son[k].son[l].level_name;
                                }
                                if(cate[i].son[j].son[k].son[l].son) {
                                    //console.log(cate[i].son[j].son);
                                    for (var m = 0; m < cate[i].son[j].son[k].son[l].son.length; m++) {
                                        if (cate[i].son[j].son[k].son[l].son[m].id == id) {
                                            return cate[i].son[j].son[k].son[l].son[m].level_name;
                                        }
                                        if(cate[i].son[j].son[k].son[l].son[m].son) {
                                            //console.log(cate[i].son[j].son);
                                            for (var n = 0; n < cate[i].son[j].son[k].son[l].son[m].son.length; n++) {
                                                if (cate[i].son[j].son[k].son[l].son[m].son[n].id == id) {
                                                    return cate[i].son[j].son[k].son[l].son[m].son[n].level_name;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            }
        }
        return "无";
    },
    unescapeHTML: function(a){
             a = "" + a;
             return a.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
         },
    page : function(o){
            if(o.size == undefined){
                o.size = 20;
            }
           // sq.violet(JSON.stringify(o))
            if($("#pageDiv").html() == undefined){
                $(o.bro).after('<div style="text-align: center;"><div id="pageDiv"></div></div>');
                //sq.green(o);
            }
            sq.green(sq.whatNumber(o.page));
            layui.use(['laypage', 'layer'], function(){
                var laypage = layui.laypage;
                laypage.render({
                    elem: 'pageDiv'
                    ,count: sq.whatNumber(o.count)
                    ,limit: o.size
                    ,page : sq.whatNumber(o.page)
                    ,curr : sq.whatNumber(o.page)
                    ,layout: ['count', 'prev', 'page', 'next',  'refresh', 'skip']
                    ,jump: function(obj,first){
                        //console.log(obj);
                        if(!first){
                            o.jump(obj);
                        }


                    },
                    // 自定义分页文本
                    first: 'First', // 首页
                    last: 'Last', // 尾页
                    prev: 'Prev', // 上一页
                    next: 'Next', // 下一页
                    skip: 'Go to', // 跳转
                    refresh: '<i class="layui-icon">&#x1002;</i>', // 刷新
                    group: '{start}-{end} of {count}', // 分页范围
                });
            });
    },
    showTax : function (s) {
        if(parseInt(s) == 1){
            return "<span style='color: #007DDB;font-size: 10px; font-weight: bold;margin-right: 3px;'>税</span>"
        }else{
            return "";
        }
    },
    whatNumber : function(s){
        return ((s == undefined) || (s == null) || (s == NaN)) ? 0 : parseFloat(s);
    },
    showTrans : function (s) {
        if(parseInt(s) >0){
            return "<span style='color: #FF5722;font-size: 10px;font-weight: bold;cursor: pointer;' title='"+s+"元'>运</span>"
        }else{
            return "";
        }
    },
    loadExcel : function (sourceID,successfun) {
        var X;
        try{
            X = XLSX;
            console.log($("#"+sourceID).change)

        }catch(e){
            $.getScript('../js/jszip.js',function(){
                $.getScript('../js/xlsx.js',function(){
                    X = XLSX;
                });
            });
        }
        $("#"+sourceID).change(
            function handleFile(e) {
                do_file(e.target.files);
            });
        var do_file = (function() {
            return function do_file(files) {

                var f = files[0];
                var reader = new FileReader();
                reader.onload = function(e) {
                    var data = e.target.result;
                    var result = {};
                    data = X.read(data, {type: 'binary'});
                    data.SheetNames.forEach(function(sheetName) {
                        var roa = X.utils.sheet_to_json(data.Sheets[sheetName], {header:1});
                        if(roa.length) result[sheetName] = roa;
                    });
                    successfun(result);
                };
                reader.readAsBinaryString(f);
            };
        })();
    },
    saveExcel : function (obj,filename,sheetName) {
        sheetName = (sheetName) ? sheetName : "Sheet1";
        var X;
        try{
            X = XLSX;
            console.log($("#"+sourceID).change)

        }catch(e){
            $.getScript('../js/jszip.js',function(){
                $.getScript('../js/xlsx.js',function(){
                    X = XLSX;
                });
            });
        }

        var data = obj;
        var ws_name = sheetName; //Excel第一个sheet的名称
        var wb = X.utils.book_new(), ws = X.utils.aoa_to_sheet(data);
        X.utils.book_append_sheet(wb, ws, ws_name);  //将数据添加到工作薄
        X.writeFile(wb, filename); //导出Excel
    },
    uploadFunction : function (o) {
        $(o.container).html('<div class="layui-upload"><button type="button" class="layui-btn layui-btn-sm" style="background-color: #666666;" id="'+o.id+'">'+o.btname+'</button></div>')
        layui.use('upload', function () {
            upload = layui.upload;

            //普通图片上传
            var uploadInst = upload.render({
                elem: "#"+o.id
                , url: o.api
                ,multiple:false
                ,headers:{Authorization:'Bearer '+localStorage.getItem("access_token")}
                , before: function (obj) {
                    if(o.preview != undefined){
                        obj.preview(function (index, file, result) {
                            $(o.preview).html('<img src="'+result+'" style="width: 180px;" />'); //图片链接（base64）
                        });
                    }
                }
                , done: function (res) {
                    //如果上传失败
                    if (res.status != "200") {
                        return layer.msg('上传失败');
                    }
                    if (res.status == "200") {
                        o.success(res.fileName);
                    }
                    //上传成功
                }
                , error: function () {
                    if(o.error != undefined){
                        o.error();
                    }
                }
            });
        });
    },
    uploadFileFunction : function (o) {
        $(o.container).html('<div class="layui-upload"><button type="button" class="layui-btn layui-btn-danger" id="'+o.id+'">'+o.btname+'</button></div>')
        layui.use('upload', function () {
            upload = layui.upload;

            //普通图片上传
            var uploadInst1 = upload.render({
                elem: "#"+o.id
                , url: o.api
                ,accept: 'file'
                ,multiple:false
                // ,exts:"gz|vcf"
                ,headers:{Authorization:'Bearer '+localStorage.getItem("access_token")}
                , before: function (obj) {
                    if(o.preview != undefined){
                        obj.preview(function (index, file, result) {
                            $(o.preview).html(file); //图片链接（base64）
                        });
                    }
                }
                , done: function (res) {
                    //如果上传失败
                    if (res.status != "200") {
                        return layer.msg('上传失败');
                    }
                    if (res.status == "200") {
                        o.success(res.fileName);
                    }
                    //上传成功
                }
                , error: function () {
                    if(o.error != undefined){
                        o.error();
                    }
                }
            });
        });
    },
    inputWindow : function (param) {
        layui.use(['layer','form','laydate'], function() {
            layer = layui.layer;
            var form = layui.form;
            var laydate = layui.laydate;
            var str = "";
            var obj = {
                title:{
                    text:"标题",//标题
                    bgColor:"#00b862",//弹窗背景色
                    titleColor:"#FFFFFF"//弹窗文字颜色
                },
                width : "400px",
                closeBtn:1,
                shadeClose:true,
                button :{
                    sure:{
                        bgColor:"#00b862",
                        titleColor:"#FFF"
                    }
                },
                form:{

                },
                sure : function (rel) {
                    console.log(rel);
                }
            };
            for(var key in param){
                if(typeof(obj[key]) == "object"){
                    for(sonKey in param[key]){
                        obj[key][sonKey] = param[key][sonKey];
                    }
                }else{
                    obj[key] = param[key];
                }
            }
            var forms = obj.form;
            obj.button = (obj.button == undefined) ? {} : obj.button;
            for(var key in forms){
                switch(forms[key].type){
                    case "select" :
                        var optionStr = "";
                        for(var i = 0;i<forms[key].value.length;i++){
                            optionStr += '<option value="'+forms[key].value[i].value+'" '+((forms[key].selectedValue == forms[key].value[i].value) ? 'selected' : '')+'>'+forms[key].value[i].label+'</option>'
                        }
                        str += '<div class="layui-form-item">' +
                            '    <label class="layui-form-label">'+forms[key].label+'</label>' +
                            '    <div class="layui-input-block">' +
                            '<select id="'+ key +'" name="'+ key +'">' +
                            optionStr +
                            '</select>'+
                            '    </div>' +
                            '  </div>';
                        break;
                    case "textarea" :
                        var optionStr = "";
                        str += '<div class="layui-form-item">' +
                            '    <label class="layui-form-label">'+forms[key].label+'</label>' +
                            '    <div class="layui-input-block">' +
                            '<textarea id="'+key+'" name="'+key+'" value="'+forms[key].value+'" autocomplete="off" placeholder="'+forms[key].tip+'" class="layui-textarea">'+forms[key].value+'</textarea>'+
                            '    </div>' +
                            '  </div>';
                        break;
                    case "date" :
                        str += '<div class="layui-form-item">' +
                            '    <label class="layui-form-label">'+forms[key].label+'</label>' +
                            '    <div class="layui-input-block">' +
                            '      <input type="text" id="'+key+'" name="'+key+'" value="'+forms[key].value+'" autocomplete="off" placeholder="'+forms[key].tip+'" class="layui-input">' +
                            '    </div>' +
                            '  </div>';
                        break;
                    default :
                        str += '<div class="layui-form-item">' +
                            '    <label class="layui-form-label">'+forms[key].label+'</label>' +
                            '    <div class="layui-input-block">' +
                            '      <input type="'+forms[key].type+'" id="'+key+'" name="'+key+'" value="'+forms[key].value+'" autocomplete="off" placeholder="'+forms[key].tip+'" class="layui-input">' +
                            '    </div>' +
                            '  </div>';
                        break;
                }
            }
            layer.open({
                type: 1,
                title:sq.voidReplace(obj.title.text,"提示"),
                skin: 'layui-layer-demo', //样式类名
                closeBtn: sq.voidReplace(obj.closeBtn,1), //不显示关闭按钮
                anim: 2,
                area:[obj.width,"auto"],
                shadeClose: sq.voidReplace(obj.shadeClose,true), //开启遮罩关闭
                content: "<div class='layui-form sq-form-content'>"+str+"" +
                "<div class='sq-form-btContent'>" +
                "<button class='layui-btn' id='sureBT'>Confirm</button>" +
                "<button class='layui-btn layui-btn-primary' id='cancelBT'>Close</button>" +
                "</div>" +
                "</div>"
            });
            form.render('select');
            var dateObj;
            for(var key in forms){
                dateObj = new Object();

                if(forms[key].type == "date"){
                    sq.green(forms[key].type);
                    dateObj.elem = "#"+key;
                    (forms[key].theme == undefined) ? "" : dateObj.theme = forms[key].theme;
                    (forms[key].dateType == undefined) ? "" : dateObj.type = forms[key].dateType;
                    laydate.render(dateObj);
                }
            }
            $(".layui-layer-title").css("background-color",sq.voidReplace(obj.title.bgColor,"#333"));
            $(".layui-layer-title").css("color",sq.voidReplace(obj.title.titleColor,"#FFF"));
            $("#sureBT").css("background-color",sq.voidReplace(obj.button.sure.bgColor,"#666"));
            $("#sureBT").css("color",sq.voidReplace(obj.button.sure.titleColor,"#FFF"));
            $("#sureBT").click(function(){
                var relData = new Object();
                for(var key in forms){
                    if(!sq.voidReplace(forms[key].allowNull,false)){
                        if($("#"+key).val().length<1){
                            return layer.msg("<strong style='color: #FFB800;'>"+forms[key].label+"</strong>不能为空！");
                        }
                    }
                    relData[key] = $("#"+key).val();
                }
                obj.sure(relData);
                // layer.closeAll();
            });
            $("#cancelBT").click(function(){
                layer.closeAll();
            });
        })
    },
    getBlob:function (url) {
        return new Promise(resolve => {
            const xhr = new XMLHttpRequest()

            xhr.open('get', url, true)
            xhr.responseType = 'blob'
            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve(xhr.response)
                }
            }

            xhr.send()
        })
    },

    saveAs:function (blob, filename) {
        if (window.navigator.msSaveOrOpenBlob) {
            navigator.msSaveBlob(blob, filename)
        } else {
            const link = document.createElement('a')
            const body = document.querySelector('body')

            link.href = window.URL.createObjectURL(blob)
            link.download = filename

            // fix Firefox
            link.style.display = 'none'
            body.appendChild(link)

            link.click()
            body.removeChild(link)

            window.URL.revokeObjectURL(link.href)
        }
    },

    save:function (url,filename){
        if(filename == undefined){
            filename="file";
        }
        this.getBlob(url).then(blob => {
            sq.saveAs(blob, filename)
        })
    },
    voidReplace : function (testValue,displayStr,replacedValue) {
        if(displayStr == undefined){
            if((testValue == undefined)||(testValue == null)){
                return "";
            }else{
                return testValue;
            }
        }
        if(replacedValue == undefined){
            if((testValue == undefined)||(testValue == null)){
                return displayStr;
            }else{
                return testValue;
            }
        }else{
            if((testValue == undefined)||(testValue == null)||(testValue == replacedValue)){
                return displayStr;
            }else{
                return testValue;
            }
        }
    },
};

