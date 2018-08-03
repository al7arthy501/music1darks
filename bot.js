const Discord = require("discord.js");
const client = new Discord.Client();
//
const moment = require('moment');
const ytdl = require('ytdl-core');
const request = require('request');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');
//

const yt_api_key = "AIzaSyDeoIH0u1e72AtfpwSKKOSy3IPp2UHzqi4";
var servers = [];
var queue = [];
var guilds = [];
var queueNames = [];
var isPlaying = false;
var dispatcher = null;
var voiceChannel = null;
var skipReq = 0;
var skippers = [];
var now_playing = [];
//
client.on('ready', () => {});
var download = function(uri, filename, callback) {
    request.head(uri, function(err, res, body) {
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);
 
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};
function commandIs(str, msg){
    return msg.content.toLowerCase().startsWith('.' + str);
}

function pluck(array) {
    return array.map(function(item) { return item['name']; });
}

function hasRole(mem, role) {
    if(pluck(mem.roles).includes(role)){
        return true;
    } else {
        return false;
    }
  }
var servers = {};
//
const prefix = "-";
client.on('ready', () => {
    console.log('I am ready!');
});
//
client.on("message",function(message) {
    if(message.content.startsWith(prefix + 'uptime')) {
        let uptime = client.uptime;

    let days = 0;
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    let notCompleted = true;

    while (notCompleted) {

        if (uptime >= 8.64e+7) {

            days++;
            uptime -= 8.64e+7;

        } else if (uptime >= 3.6e+6) {

            hours++;
            uptime -= 3.6e+6;

        } else if (uptime >= 60000) {

            minutes++;
            uptime -= 60000;

        } else if (uptime >= 1000) {
            seconds++;
            uptime -= 1000;

        }

        if (uptime < 1000)  notCompleted = false;

    }
    
    
  message.channel.send(`UpTime \` ${days}D , ${hours}H , ${minutes}M , ${seconds}S\``)
}
});







client.on('message', function(message) {
    const member = message.member;
    const mess = message.content.toLowerCase();
    const args = message.content.split(' ').slice(1).join(' ');
 
    if (mess.startsWith(prefix + 'p')) {
        if (!message.member.voiceChannel) return message.channel.send(` You have to be in a voice channel`);
        // if user is not insert the URL or song title
        if (args.length == 0) {
 
            message.channel.send('Add The link or name')
            return;
        }
        if (queue.length > 0 || isPlaying) {
            getID(args, function(id) {
                add_to_queue(id);
                fetchVideoInfo(id, function(err, videoInfo) {
                    if (err) throw new Error(err);
                   
                       let embed = new Discord.RichEmbed()
       .setColor('#070035')
       .setTitle(`<:list:467237255111770112> | ${videoInfo.title}`)
       .setURL(videoInfo.url)
       .setFooter(`👍 ${videoInfo.likeCount}    👎 ${videoInfo.dislikeCount}    👁‍🗨 ${videoInfo.views}`)
       .setImage(videoInfo.thumbnailUrl)
       .setTimestamp();
                    message.channel.sendEmbed(embed);
                    queueNames.push(videoInfo.title);
                    now_playing.push(videoInfo.title);
 
                });
            });
        }
        else {
 
            isPlaying = true;
            getID(args, function(id) {
                queue.push('placeholder');
                playMusic(id, message);
                fetchVideoInfo(id, function(err, videoInfo) {
                    if (err) throw new Error(err);
                       let tbn = new Discord.RichEmbed()
       .setColor('#070035')
       .setTitle(`<:Playing:467237221934694400> | ${videoInfo.title}`)
       .setURL(videoInfo.url)
       .setFooter(`👍 ${videoInfo.likeCount}    👎 ${videoInfo.dislikeCount}    👁‍🗨 ${videoInfo.views}`)
       .setImage(videoInfo.thumbnailUrl)
       .setTimestamp();
                    message.channel.sendEmbed(tbn);
                });
            });
        }
    }
    else if (mess.startsWith(prefix + 's')) {
        if (!message.member.voiceChannel) return message.channel.send(` You have to be in a voice channel`);
        message.channel.send(':thumbsup:').then(() => {
            skip_song(message);
            var server = server = servers[message.guild.id];
            if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();
        });
    }
    else if (message.content.startsWith(prefix + 'vol')) {
        if (!message.member.voiceChannel) return message.channel.send(` You have to be in a voice channel`);
        // console.log(args)
        if (args < 1) return message.channel.send('1 - 300')
	    if (args > 300) return message.channel.send('1 - 300')
			dispatcher.setVolume(1 * args / 50);
        message.channel.sendMessage(` Volume now **__${dispatcher.volume*50}%__**`);
    }
    else if (mess.startsWith(prefix + 'pause')) {
        if (!message.member.voiceChannel) return message.channel.send(` You have to be in a voice channel`);
        message.channel.send(' paused').then(() => {
            dispatcher.pause();
        });
    }
    else if (mess.startsWith(prefix + 'unpause')) {
        if (!message.member.voiceChannel) return message.channel.send(` You have to be in a voice channel`);
            message.channel.send(' unpaused').then(() => {
            dispatcher.resume();
        });
    }
    else if (mess.startsWith(prefix + 'stop')) {
        if (!message.member.voiceChannel) return message.channel.send(` You have to be in a voice channel`);
        message.channel.send(' stopping');
        var server = server = servers[message.guild.id];
        if (message.guild.voiceConnection) message.guild.voiceConnection.disconnect();

    }
    else if (mess.startsWith(prefix + 'join')) {
        if (!message.member.voiceChannel) return message.channel.send(` You have to be in a voice channel`);
        message.member.voiceChannel.join().then(message.channel.send(' I\'m joined now'));
    }
    else if (mess.startsWith(prefix + 'p')) {
        if (!message.member.voiceChannel) return message.channel.send(` You have to be in a voice channel`);
        if (isPlaying == false) return message.channel.send('Stopping');
      message.channel.send(` Playing ${videoInfo.title}`)
    }
});
 
function skip_song(message) {
    if (!message.member.voiceChannel) return message.channel.send(` You have to be in a voice channel`);
    dispatcher.end();
}
 
function playMusic(id, message) {
    voiceChannel = message.member.voiceChannel;
 
 
    voiceChannel.join().then(function(connectoin) {
        let stream = ytdl('https://www.youtube.com/watch?v=' + id, {
            filter: 'audioonly'
        });
        skipReq = 0;
        skippers = [];
 
        dispatcher = connectoin.playStream(stream);
        dispatcher.on('end', function() {
            skipReq = 0;
            skippers = [];
            queue.shift();
            queueNames.shift();
            if (queue.length === 0) {
                queue = [];
                queueNames = [];
                isPlaying = false;
            }
            else {
                setTimeout(function() {
                    playMusic(queue[0], message);
                }, 500);
            }
        });
    });
}
 
function getID(str, cb) {
    if (isYoutube(str)) {
        cb(getYoutubeID(str));
    }
    else {
        search_video(str, function(id) {
            cb(id);
        });
    }
}
 
function add_to_queue(strID) {
    if (isYoutube(strID)) {
        queue.push(getYoutubeID(strID));
    }
    else {
        queue.push(strID);
    }
}
 
function search_video(query, cb) {
    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + yt_api_key, function(error, response, body) {
        var json = JSON.parse(body);
        cb(json.items[0].id.videoId);
    });
}
 
 
function isYoutube(str) {
    return str.toLowerCase().indexOf('youtube.com') > -1;
}
//
client.login(process.env.BOT_TOKEN);
