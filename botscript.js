var TeleBot=require("telebot"),
	bot=new TeleBot("INSERTID");
var previd=0
var questions=[]
var topiclist=["Algebra","Calculus","Geometry"]
var topictxt=""
for(let i=0;i<topiclist.length;i++){
	topictxt+="   \n"+topiclist[i];
}
bot.on('*',function(msg){
	if(previd!=msg.chat.id){
		console.log(msg.chat.id+" :");
		previd=msg.chat.id;
	}
	console.log("   "+msg.from.first_name+"("+msg.from.id+") - "+msg.text);
});
bot.on("/start",function(msg){
	return msg.reply.text("A bot for the Telegram Mathematics group\nMade by [Ariana](tg://user?id=368439352)",{asReply:true,parseMode:"markdown"});
});
bot.on("/help",function(msg){
	return msg.reply.text("List of commands:\n   /add _question-name_ _topic_\n   /list all or _topic_\n   /solve _question-name_ _topic_(must be either from admin or from OP)\n   /find _question-name_ _topic_\nList of topics:"+topictxt,{asReply:true,parseMode:"markdown"});
});
bot.on("/add",function(msg){
	//format: reply to a question: /addqn question_name topic
	let qnmsg=msg.reply_to_message;
	if(!qnmsg){
		return msg.reply.text("Please reply the question with your message",{asReply:true});
	}
	if(msg.text.split(" ").length<3){
		return msg.reply.text("Format: /add _question-name_ _topic_",{asReply:true,parseMode:"markdown"});
	}
	let tmp=msg.text.split(/\ (?=[^\ ]+$)/);
	let qntopic=tmp[1];
	if(!topiclist.includes(qntopic)){
		return msg.reply.text("Topic is not found!",{asReply:true});
	}
	let qnname=tmp[0].split(/ (.+)/)[1];
	for(let i=0;i<questions.length;i++){
		if(questions[i].qn===qnmsg&&questions[i].topic===qntopic){
			return msg.reply.text("A question with the same name and topic is still unanswered, please rename your question",{asReply:true});
		}
	}
	questions.push({op:msg.from.id,msgid:msg.reply_to_message.message_id,qn:qnname,topic:qntopic});
	return msg.reply.text("Added question",{asReply:true});
});
function listtopic(topic){
	if(topic==="all"){
		let topicqnstr=[];
		let retstr="";
		for(let i=0;i<topiclist.length;i++){
			topicqnstr.push("*"+topiclist[i]+"*\n");
		}
		for(let i=0;i<questions.length;i++){
			topicqnstr[topiclist.indexOf(questions[i].topic)]+="   "+questions[i].qn+"\n";
		}
		for(let i=0;i<topicqnstr.length;++i){
			if(topicqnstr[i]!="*"+topiclist[i]+"*\n"){
				retstr+=topicqnstr[i];
			}else{
				retstr+="No questions for "+topicqnstr[i];
			}
		}
		return retstr;
	}
	retstr=""
	for(i=0;i<questions.length;i++){
		if(questions[i].topic===topic){
			retstr+="   "+questions[i].qn+"\n";
		}
	}
	if(retstr===""){
		retstr="No questions for "+topic;
	}
	return retstr;
}
bot.on("/list",function(msg){
	//format: /list [all,topic]
	let topic=msg.text==="/list"?"all":msg.text.split(" ")[1];
	if(topic!="all"&&!topiclist.includes(topic)){
		return msg.reply.text("Topic is not found!",{asReply:true});
	}
	return msg.reply.text(listtopic(topic),{asReply:true,parseMode:"markdown"});
});
bot.on("/solve",function(msg){
	//format: /solve question_name topic, must be either from admin or from OP
	if(msg.text.split(" ").length<3){
		return msg.reply.text("Format: /solve _question-name_ _topic_(must be either from admin or from OP)",{asReply:true,parseMode:"markdown"});
	}
	let isadmin;
	bot.getChatMember(msg.chat.id,msg.from.id).then(function(data){
		isadmin=(data.status==="creator")||(data.status==="administrator");
	});
	let tmp=msg.text.split(/\ (?=[^\ ]+$)/);
	let qntopic=tmp[1];
	if(!topiclist.includes(qntopic)){
		return msg.reply.text("Topic is not found!",{asReply:true});
	}
	let qnname=tmp[0].split(/ (.+)/)[1];
	for(let i=0;i<questions.length;i++){
		if(questions[i].qn===qnname&&questions[i].topic===qntopic&&(questions[i].op===msg.from.id||isadmin)){
			questions.splice(i,1);
			return msg.reply.text("Solved",{asReply:true});
		}
	}
});
bot.on("/find",function(msg){
	//format: /find question_name topic
	if(msg.text.split(" ").length<3){
		return msg.reply.text("Format: /find _question-name_ _topic_",{asReply:true,parseMode:"markdown"});
	}
	let tmp=msg.text.split(/\ (?=[^\ ]+$)/);
	let qntopic=tmp[1];
	if(!topiclist.includes(qntopic)){
		return msg.reply.text("Topic is not found!",{asReply:true});
	}
	let qnname=tmp[0].split(/ (.+)/)[1];
	for(let i=0;i<questions.length;i++){
		if(questions[i].qn===qnname&&questions[i].topic===qntopic){
			return bot.sendMessage(msg.chat.id,"Here is the question",{replyToMessage:questions[i].msgid});
		}
	}
	return msg.reply.text("Can't find question",{asReply:true});
})
bot.start();
