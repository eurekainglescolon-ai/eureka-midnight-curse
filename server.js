import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';
import crypto from 'crypto';
const app=express(), server=createServer(app), io=new Server(server);app.use(express.static('public'));
let state={startedAt:null,duration:60*60*1000,teams:{},winner:null};
const challenges=[
{title:'The Broken Clock',type:'number',prompt:'The clock stopped at 11:45. Its minute hand moves forward 135 minutes, but the hour hand moves back 2 hours. What time does it show in 24-hour format? Enter HHMM.',answer:'1200',hint:'11:45 plus 2h15 is 14:00; then subtract two hours.'},
{title:'The Alchemist’s Cabinet',type:'logic',prompt:'Four jars stand in a row: red, blue, green, black. Green is immediately to the right of red. Black is not at either end. Blue is to the left of black. Which jar is third?',answer:'RED',hint:'Try Blue, Black, Red, Green.'},
{title:'The Hidden Message',type:'cipher',prompt:'A note reads “WKH NHB LV XQGHU WKH PDW”. Every letter was shifted three places forward in the alphabet. Decode it. What single word describes WHERE the key is?',answer:'UNDER',hint:'W becomes T. Decode the whole sentence.'},
{title:'The Missing Evidence',type:'deduction',prompt:'A guard saw someone at 21:10. Anna arrived at 21:20. Ben left at 21:05. Cara was in the library from 21:00 to 21:30, confirmed by CCTV. Dan arrived at 20:50 and left at 21:25. Who could have been seen in the corridor at 21:10?',answer:'DAN',hint:'Eliminate those absent or confirmed elsewhere.'},
{title:'The Haunted Timetable',type:'math',prompt:'A train leaves at 18:35, travels 1 hour 48 minutes, waits 17 minutes and travels another 56 minutes. When does it arrive? Enter HHMM (24-hour time).',answer:'2136',hint:'18:35 + 1:48 + 0:17 + 0:56.'},
{title:'The Grammar Trap',type:'english',prompt:'Complete the sentence with ONE word: “If the caretaker _____ locked the door, we would have escaped earlier.”',answer:'HADNT',hint:'It is a third conditional. Use a negative auxiliary.'},
{title:'The Number Sequence',type:'number',prompt:'Find the next number: 3, 7, 15, 31, 63, ___.',answer:'127',hint:'Double the previous number, then add one.'},
{title:'The Secret Password',type:'word',prompt:'Unscramble “SILENT” to make a verb meaning to pay attention to sound.',answer:'LISTEN',hint:'It is an anagram.'}
];
function clean(s){return String(s??'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
function broadcast(){io.emit('state',publicState())}
function publicState(){return {startedAt:state.startedAt,duration:state.duration,winner:state.winner,teams:Object.values(state.teams).map(t=>({id:t.id,name:t.name,solved:t.solved.length,penalty:t.penalty,finishedAt:t.finishedAt,adjusted:t.adjusted}))}}
function standings(){return Object.values(state.teams).filter(t=>t.finishedAt).sort((a,b)=>a.adjusted-b.adjusted)}
io.on('connection',socket=>{
 socket.emit('state',publicState());
 socket.on('join',({name},cb)=>{name=String(name||'').trim().slice(0,35);if(!name)return cb({error:'Enter a team name.'});let t=Object.values(state.teams).find(x=>x.name.toLowerCase()===name.toLowerCase());if(t)return cb({error:'This name is already in use. Ask your teacher for your team’s device.'});if(Object.keys(state.teams).length>=4)return cb({error:'All four team places are taken.'});let id=crypto.randomUUID(),token=crypto.randomBytes(16).toString('hex');state.teams[id]={id,token,name,solved:[],penalty:0,finishedAt:null,adjusted:null,hints:[]};socket.join(id);cb({id,token,challenges:challenges.map(({title,type,prompt},index)=>({title,type,prompt,index}))});broadcast()});
 socket.on('resume',({id,token},cb)=>{let t=state.teams[id];if(!t||t.token!==token)return cb({error:'Team session not found.'});socket.join(id);cb({id,token,solved:t.solved,hints:t.hints,penalty:t.penalty,challenges:challenges.map(({title,type,prompt},index)=>({title,type,prompt,index}))})});
 socket.on('answer',({id,token,index,answer},cb)=>{let t=state.teams[id];if(!t||t.token!==token)return cb({error:'Invalid team.'});if(!state.startedAt)return cb({error:'Wait for your teacher to start.'});if(Date.now()>state.startedAt+state.duration)return cb({error:'Time is up.'});if(t.finishedAt)return cb({error:'You have already escaped.'});if(!Number.isInteger(index)||index<0||index>=challenges.length)return cb({error:'Invalid puzzle.'});if(t.solved.includes(index))return cb({correct:true,solved:t.solved});if(clean(answer)!==challenges[index].answer){t.penalty+=30000;broadcast();return cb({correct:false,penalty:t.penalty})}t.solved.push(index);if(t.solved.length===challenges.length){t.finishedAt=Date.now();t.adjusted=t.finishedAt-state.startedAt+t.penalty;state.winner=standings()[0]?.name??null;}broadcast();cb({correct:true,solved:t.solved,finished:!!t.finishedAt,adjusted:t.adjusted})});
 socket.on('hint',({id,token,index},cb)=>{let t=state.teams[id];if(!t||t.token!==token)return cb({error:'Invalid team.'});if(!state.startedAt||t.finishedAt||Date.now()>state.startedAt+state.duration)return cb({error:'Hint unavailable.'});if(!Number.isInteger(index)||index<0||index>=challenges.length)return cb({error:'Invalid puzzle.'});if(!t.hints.includes(index)){t.hints.push(index);t.penalty+=120000;}broadcast();cb({hint:challenges[index].hint,penalty:t.penalty})});
 socket.on('teacher',({pin},cb)=>cb({ok:pin===process.env.TEACHER_PIN}));
 socket.on('start',({pin},cb)=>{if(!process.env.TEACHER_PIN||pin!==process.env.TEACHER_PIN)return cb({error:'Invalid teacher PIN.'});if(state.startedAt)return cb({error:'Already started.'});state.startedAt=Date.now();broadcast();cb({ok:true})});
 socket.on('reset',({pin},cb)=>{if(!process.env.TEACHER_PIN||pin!==process.env.TEACHER_PIN)return cb({error:'Invalid teacher PIN.'});state={startedAt:null,duration:60*60*1000,teams:{},winner:null};broadcast();cb({ok:true})});
});
app.get('/health',(req,res)=>res.json({ok:true}));
server.listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('Game ready'));
