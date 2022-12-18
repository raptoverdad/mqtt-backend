
import express from 'express'
import mqtt from 'mqtt'
const app=express()
app.use(express.json())
const http = require('http');
const {createPool}=require('mysql2/promise')
//server config
const server = http.createServer(app);
const io = require('socket.io')(server,{
    cors:{
        origin:'*',
        methods:["GET","POST"],
        allowedHeaders:["Access-Control-Allow-Origin"],
        credentials:false
    }
});

server.listen(4000,()=>{
    console.log('listenning on port 4000')
})
const key:String='LONGLIVESKRILLEX'
io.use((socket:any,next:any)=>{
    let frontendKey=socket.handshake.query.key
    if(frontendKey !== key){
        next(new Error("invalid key"))
    }else{
        next()
    }
    })

//mysql config

const conector= createPool({host:'localhost',user:'goodbunny',password:'Bnx6aw300172_',database:'mqtt'})

//mqtt and sockets working together

let client=mqtt.connect('mqtt://localhost')

try {
client.on('connect',()=>{
    console.log('mqtt connection established')
})
} catch (error) {
    console.log(error)
}
//topics subscriptions: for each product -> 1 susbscripcion;
client.subscribe('iluminacion', (err) => {
    if (!err) {
      console.log('Successfully subscribed to iluminacion');
    }else{
        console.log('error intentando suscribirse a iluminacion')
        throw new Error('error intentando suscribirse a iluminacion')
    }
});  
client.subscribe('tv', (err) => {
    if (!err) {
      console.log('Successfully subscribed to iluminacion');
    }else{
        console.log('error intentando suscribirse a iluminacion')
        throw new Error('error intentando suscribirse a iluminacion')
    }
});  
client.subscribe('camara', (err) => {
    if (!err) {
      console.log('Successfully subscribed to iluminacion');
    }else{
        console.log('error intentando suscribirse a iluminacion')
        throw new Error('error intentando suscribirse a iluminacion')
    }
});  
//end of topics subscriptions
try {
io.on('connection',(socket:any)=>{

console.log('socket connected')
        //users log in
        socket.on('mqttUser',(message:any)=>{
           if(message.name === 'petter'){
            socket.emit('mqttUserValidation',{success:"true",nombre:"petter"})   
           }else if(message.name === 'michael'){
            socket.emit('mqttUserValidation',{success:"true",nombre:"michael"})   
           }else if(message.name === 'chloe'){
            socket.emit('mqttUserValidation',{success:"true",nombre:"chloe"})   
           }else{
            socket.emit('mqttUserValidation',{success:"false"})     
           } 
        })
        //user's menu request
        socket.on('userdata',async(message:any)=>{
                
         
                try {
                     //if this was a real programm you should validate the user's token with the user's info
                    let [result]=await conector.query(`SELECT * FROM users WHERE user = '${message.name}'`)
                    console.log(result[0])
                    socket.emit('userResults',result[0])
                } catch (error) {
                    console.log(error)
                }
     })

     socket.on('turn',()=>{
        console.log('handle this petition')
     })
  
})
    
} catch (error) {
    console.log('coneection error:',error)
}


client.on('message',async(topic:string,messages:any)=>{
        let message=messages.toString()
        let json=JSON.parse(message)
        let user=json.username
        let status=json.status
        try {
            let [rows,_fields]=await conector.query(`UPDATE users SET ${topic}='${status}' WHERE user='${user}'`)
            if(rows){
               if(rows.affectedRows > 0){
                   console.log('update success')
               }else if(rows.affectedRows == 0){
                   console.log('update error')
               }
            }
        } catch (error) {
            console.log('error' + ':',error)
        }
})


