var TeleBot=require("telebot"),
    bot=new TeleBot("TOKEN"),
    MongoClient=require('mongodb').MongoClient,
    url='mongodb://localhost:27017';
MongoClient.connect(url,function(err,client){
    if(err){return console.log(err);}
    console.log("Connected to DB");
    var db=client.db("db");
    var questions=db.collection("questions");
    questions.deleteMany({},function(err,res){if(err){return console.log(err);}});
    var previd=0,topiclist=["Algebra","Calculus","Geometry & Topology","Number theory","Others","Physics"],groupid=-1001062964615,topictxt="";
    for(let i=0;i<topiclist.length;i++){
        topictxt+="   \n"+topiclist[i];
    }
    function sendtmpmsg(fmsg,msg){
        return bot.sendMessage(fmsg.chat.id,msg,{replyToMessage:fmsg.message_id,parseMode:"markdown",notification:false}).then(function(smsg){
            return setTimeout(function(err){
                if(err){return console.log(err);}
                bot.deleteMessage(fmsg.chat.id,smsg.message_id);
            },10000);
        });
    }
    bot.on("*",function(msg){
        if(previd!=msg.chat.id){
            console.log(msg.chat.id+" :");
            previd=msg.chat.id;
        }
        console.log("   "+msg.from.first_name+"("+msg.from.id+") - "+msg.text);
    });
    bot.on("/start",function(msg){
        let sentmsg=msg.reply.text("A bot for the [Telegram Mathematics group](t.me/mathsgroup)\nMade by [Ariana](tg://user?id=368439352)",{asReply:true,parseMode:"markdown"});
        if(msg.chat.id==-1001062964615){
            setTimeout(function(){
                bot.deleteMessage(-1001062964615,sentmsg);
            },10000);
        }
        return 0;
    });
    bot.on("/help",function(msg){
        let sentmsg=bot.sendMessage(msg.chat.id,"List of commands:\n   /add _question-name_ _topic_\n   /list all or _topic_\n   /solve _question-name_ _topic_(must be either from admin or from OP)\n   /find _question-name_ _topic_\nList of topics:"+topictxt+"\nNote that analysis is under calculus and logic is vaugely under number theory, just to reduce number of topics",{replyToMessage:msg.message_id,parseMode:"markdown"});
        if(msg.chat.id==-1001062964615){
            return setTimeout(function(){
                bot.deleteMessage(-1001062964615,sentmsg);
            },10000);
        }
        return 0;
    });
    bot.on("/add",function(msg){
        //if(msg.chat.id!=groupid){return msg.reply.text("Please use the telegram math group",{asReply:true})}
        //format: reply to a question: /addqn question_name topic
        let qnmsg=msg.reply_to_message;
        if(!qnmsg){return sendtmpmsg(msg,"*Error*\nPlease reply the question with your message");}
        if(msg.text.split(" ").length<3){return sendtmpmsg(msg,"*Error*\nFormat: /add _question-name_ _topic_");}
        let qn=msg.text.split(/ (.+)/)[1];
        for(let i=0;i<topiclist.length+1;++i){
            if(qn.endsWith(" "+topiclist[i])){
                let qnname=qn.substring(0,qn.length-topiclist[i].length-1),qntopic=topiclist[i];
                if(!topiclist.includes(qntopic)){return sendtmpmsg(msg,"*Error*\nTopic not found");}
                questions.find({"name":qnname,"topic":qntopic}).toArray(function(err,qn){
                    if(err){return console.log(err);}
                    if(qn[0]){return sendtmpmsg(msg,"*Error*\nA question with the same name and topic is still unanswered");}
                    questions.insert([{"name":qnname,"topic":qntopic,"op":msg.from.id,"msgid":msg.message_id}],function(err,res){
                        if(err){return console.log(err);}
                        return msg.reply.text("Added question",{asReply:true});
                    });
                });
            }
        }
    });
    bot.on("/list",function(msg){
        //format: /list [all,topic]
        let topic=msg.text=="/list"||msg.text=="/list@SophieGermainBot"?"all":msg.text.split(/ (.+)/)[1];
        if(topic!="all"&&!topiclist.includes(topic)){return sendtmpmsg(msg,"*Error*\nFormat: /list [all,topic]");}
        if(topic=="all"){
            let topicqnstr=[];
            let retstr="";
            for(let i=0;i<topiclist.length;i++){
                topicqnstr.push("*"+topiclist[i]+"*\n");
            }
            questions.find({}).toArray(function(err,qnlist){
                if(err){
                    retstr="An internal error occurred";
                    return console.log(err);
                }
                for(let i=0;i<qnlist.length;i++){
                    topicqnstr[topiclist.indexOf(qnlist[i].topic)]+="   "+qnlist[i].name+"\n";
                }
                for(let i=0;i<topicqnstr.length;++i){
                    if(topicqnstr[i]!="*"+topiclist[i]+"*\n"){
                        retstr+=topicqnstr[i];
                    }else{
                        retstr+="No questions for "+topicqnstr[i];
                    }
                }
                return msg.reply.text(retstr,{asReply:true,parseMode:"markdown"});
            });
        }else{
            let retstr="";
            questions.find({topic:topic}).toArray(function(err,qnlist){
                if(err){
                    retstr="An internal error occurred";
                    return console.log(err);
                }
                for(let i=0;i<qnlist.length;++i){
                    retstr+="   "+qnlist[i].name+"\n"
                }
                if(retstr==""){
                    retstr="No questions for "+topic;
                }
                return msg.reply.text(retstr,{asReply:true,parseMode:"markdown"});
            });
        }
    });
    bot.on("/solve",function(msg){
        //if(msg.chat.id!=groupid){return msg.reply.text("Please use the telegram math group",{asReply:true})}
        //format: /solve question_name topic, must be either from admin or from OP
        if(msg.text.split(" ").length<3){return sendtmpmsg(msg,"*Error*\nFormat: /solve _question-name_ _topic_(must be either from admin or from OP)");}
        let isadmin;
        bot.getChatMember(msg.chat.id,msg.from.id).then(function(data){isadmin=(data.status==="creator")||(data.status==="administrator");});
        let qn=msg.text.split(/ (.+)/)[1];
        for(let i=0;i<topiclist.length;++i){
            if(qn.endsWith(" "+topiclist[i])){
                let qnname=qn.substring(0,qn.length-topiclist[i].length-1),qntopic=topiclist[i];
                questions.find({"name":qnname,"topic":qntopic}).toArray(function(err,qn){
                    if(err){return console.log(err);}
                    if(!qn[0]){return sendtmpmsg(msg,"*Error*\nCan't find question");}
                    if(!isadmin&&qn[0].op!=msg.from.id){return sendtmpmsg(msg,"*Error*\nThis command can only be executed by OP or an admin.");}
                    questions.deleteOne({"name":qnname,"topic":qntopic},function(err,res){
                        if(err){
                            msg.reply.text("An internal error occurred");
                            return console.log(err);
                        }
                        return msg.reply.text("Question solved");
                    });
                });
            }
        }
    });
    bot.on("/find",function(msg){
        //if(msg.chat.id!=-1001062964615){return msg.reply.text("Please use the telegram math group",{asReply:true})}
        //format: /find question_name topic
        if(msg.text.split(" ").length<3){return sendtmpmsg(msg,"*Error*\nFormat: /find _question-name_ _topic_");}
        let qn=msg.text.split(/ (.+)/)[1];
        for(let i=0;i<topiclist.length;++i){
            if(qn.endsWith(" "+topiclist[i])){
                let qnname=qn.substring(0,qn.length-topiclist[i].length-1),qntopic=topiclist[i];
                if(!topiclist.includes(qntopic)){return sendtmpmsg(msg,"*Error*\nTopic not found");}
                questions.find({"name":qnname,"topic":qntopic}).toArray(function(err,qn){
                    if(err){return console.log(err);}
                    if(!qn[0]){return sendtmpmsg(msg,"*Error*\nUnable to find question");}
                    return bot.sendMessage(msg.chat.id,"Here is the question",{replyToMessage:qn[0].msgid});
                });
            }
        }
    });
});
bot.start();