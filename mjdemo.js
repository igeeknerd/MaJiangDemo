var socketio = require("socket.io")(process.env.port||3000);
var shortid = require("shortid");

//合法用户列表
var legalnames = ["guest1","guest2","guest3","guest4"]
//房间
var roomid = "5001";
//用户列表
var userarr = [null,null,null,null];
//用户准备列表
var readyarr = [];
//用户字典
var usersDic = {};

//卡牌列表
var dstcards = [];
//用户手牌列表
socketio.on("connection",function(socket){
    var token = shortid.generate();
    var user = {};
    user.token = token;
    user.name = -1;
    user.isready = false;
    user.socket = socket;
    user.handcard = [];
    //手牌
    var handcard = [];
    
    console.log("有用户链接,分配token:" + token);
    socket.emit("shake1",{"token":user.token});
    //登陆
    socket.on("login",function(data){
        //if(user.name == -1){
            user.name = data.name;
        user.roomid = data.roomid;
        if(legalnames.indexOf(data.name) == -1 ){
           socket.emit("msg_error",{"id":1,"msg":"用户名不存在"}); 
           }
        
        if(userarr.indexOf(data.name) != -1){
            console.log("用户名" + data.name);
           socket.emit("msg_error",{"id":1,"msg":"用户名已经存在"}); 
            return;
           }
        //}
        console.log("用户登录成功 " + JSON.stringify(data) + " 用户名为 " + user.name);
        for(var i=0;i < 4;i++){
            if(userarr[i] == null) break;
        }
        userarr[i] = user.name;
        usersDic[user.name] = user;
        //返回登陆成功
        socket.emit("loginok",{uid:user.name,users:userarr,readys:readyarr});       
        //广播用户加入
        socket.broadcast.emit("user_loginok",{userid:user.name,users:userarr,readys:readyarr});
        //测试
       /** for(var i = 0;i < 4;i++){
            var myid = userarr[i];
            console.log("用户名为 " + myid);
            if(myid != user.name){
                if(myid != null){
                    console.log("my id is " + myid);
                    var tmpuser = usersDic[myid];
                    tmpuser.socket.emit("user_loginok",{userid:user.name});
                }
                
            }
        }**/
    });
    //确认 username
    socket.on("confirmready",function(data){
        var readyid = data.name;
        var readyuser = usersDic[readyid];
        readyuser.isready = true;
        if(readyarr.indexOf(readyid) == -1){
           readyarr.push(readyid);
           }
        console.log("准备发送confirm");
        socket.emit("readydone",{});
        socket.broadcast.emit("readyother",{"name":readyid});
        
        //检测是否4人都确认
        var confirmnum = 0;
        for(var tmpid in usersDic){
            var tmpuser = usersDic[tmpid];
            if(tmpuser.isready){
                confirmnum++
            }
        }

        console.log("确认了用户有" + confirmnum);
        if(confirmnum == 4){
            dealcard();
            
        }
        
    });
    
    socket.on("sendcardon",function(data){
        var uid = data.uid;
        var card = data.card;
        var user = usersDic[uid];
        var stack = user.handcard;
        var cindex = stack.indexOf(card);
        console.log("出牌前手牌 " + stack);
        stack.splice(cindex,1);
        console.log("出牌后手牌 " + stack);
        console.log("引用手牌 " + user.handcard);
        socket.emit("rcvcardon",{card:card,uid:uid});
        socket.broadcast.emit("rcvcardon",{card:card,uid:uid});
        //测试下一轮
        nextround(uid);
    });
    
    socket.on("disconnect",function(){
        var uindex = userarr.indexOf(user.name);
        if(uindex != -1){
            userarr[uindex] = null;
        }
        
        uindex = readyarr.indexOf(user.name);
        if(uindex != -1){
            readyarr.splice(uindex,1);
            console.log("列表删除了 " + uindex);
        }
        console.log("用户断开了链接" + user.name);
    })

});

function nextround(p_uid){
    var thisuidindex = userarr.indexOf(p_uid);
    if(thisuidindex < 3){
        thisuidindex++;
    }
    else{
        thisuidindex = 0;
    }
    var nextuserid = userarr[thisuidindex];
    var user = usersDic[nextuserid];
    
                var stack1 = user.handcard;
                var cardid = dstcards.pop();
                stack1.push(cardid);
                user.socket.emit("sendonecard",{"card":cardid,isplay:1});
                user.socket.broadcast.emit("sendonecard",{"card":cardid,"isplay":0,"uid":nextuserid});
    console.log("下一轮发牌" + nextuserid);
}

function dealcard(){
    //取牌,原始牌堆
    var ocard = [];
    var ctime = 0;
    //万饼条东西南北中发白各4张
    while(ctime<4){
        for(var i=1;i <= 37;i++){
            ocard.push(i);
        }
          ctime++;
          }
    //补花
    var huaarr = [38,39,40,41,42,43,44,45,46];
    ocard.concat(huaarr);
    console.log(ocard);
    //洗牌
    //var dstcards = [];
    while(ocard.length > 0){
          var tmpindex = Math.floor(Math.random()*ocard.length);
            var cardid = ocard[tmpindex];
        dstcards.push(cardid);
        ocard.splice(tmpindex,1);
          }
    console.log("洗牌结束" + dstcards);
    
    //发牌，13张，先手补牌一张
    var stack1 = [];
    var stack2 = [];
    var stack3 = [];
    var stack4 = [];

    //发第一组牌
    stack1.push(dstcards.pop());
    stack1.push(dstcards.pop());
    stack1.push(dstcards.pop());
    stack1.push(dstcards.pop());
    stack2.push(dstcards.pop());
    stack2.push(dstcards.pop());
    stack2.push(dstcards.pop());
    stack2.push(dstcards.pop());
    stack3.push(dstcards.pop());
    stack3.push(dstcards.pop());
    stack3.push(dstcards.pop());
    stack3.push(dstcards.pop());
    stack4.push(dstcards.pop());
    stack4.push(dstcards.pop());
    stack4.push(dstcards.pop());
    stack4.push(dstcards.pop());
    
    //发第二组牌
    stack1.push(dstcards.pop());
    stack1.push(dstcards.pop());
    stack1.push(dstcards.pop());
    stack1.push(dstcards.pop());
    stack2.push(dstcards.pop());
    stack2.push(dstcards.pop());
    stack2.push(dstcards.pop());
    stack2.push(dstcards.pop());
    stack3.push(dstcards.pop());
    stack3.push(dstcards.pop());
    stack3.push(dstcards.pop());
    stack3.push(dstcards.pop());
    stack4.push(dstcards.pop());
    stack4.push(dstcards.pop());
    stack4.push(dstcards.pop());
    stack4.push(dstcards.pop());
    
    //发第三组牌
    stack1.push(dstcards.pop());
    stack1.push(dstcards.pop());
    stack1.push(dstcards.pop());
    stack1.push(dstcards.pop());
    stack2.push(dstcards.pop());
    stack2.push(dstcards.pop());
    stack2.push(dstcards.pop());
    stack2.push(dstcards.pop());
    stack3.push(dstcards.pop());
    stack3.push(dstcards.pop());
    stack3.push(dstcards.pop());
    stack3.push(dstcards.pop());
    stack4.push(dstcards.pop());
    stack4.push(dstcards.pop());
    stack4.push(dstcards.pop());
    stack4.push(dstcards.pop());
    
    //发第四组牌
    stack1.push(dstcards.pop());
    stack2.push(dstcards.pop());
    stack3.push(dstcards.pop());
    stack4.push(dstcards.pop());
    
    //发牌结束
    console.log("切牌结束" +　"第一人 " + stack1 +"第二人 " + stack2 + "第三人 " + stack3 + "第四人 " + stack4);
    //发牌
    for(var i =0;i < 4;i++){
        var uid = userarr[i];
        var user = usersDic[uid];
        switch(i){
            case 0:
                user.handcard = stack1;
                user.socket.emit("getcard",{"cards":stack1,isplay:1});
                var cardid = dstcards.pop();
                stack1.push(cardid);
                user.socket.emit("sendonecard",{"card":cardid,isplay:1});
                user.socket.broadcast.emit("sendonecard",{"card":cardid,"isplay":0,"uid":uid});
                break;
            case 1:
                user.handcard = stack2;
                user.socket.emit("getcard",{"cards":stack2,isplay:0});
                break;
            case 2:
                user.handcard = stack3;
                user.socket.emit("getcard",{"cards":stack3,isplay:0});
                break;
            case 3:
                user.handcard = stack4;
                user.socket.emit("getcard",{"cards":stack4,isplay:0});
                break;
               
               }
        
    }
    console.log("发牌结束");
    

}

console.log("麻将服务器启动");