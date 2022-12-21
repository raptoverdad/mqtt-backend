
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
client.subscribe('newStatus', (err) => {
    if (!err) {
      console.log('Successfully subscribed to newStatus');
    }else{
        console.log('error intentando suscribirse a newStatus')
        throw new Error('error intentando suscribirse a newStatus')
    }
}); 
client.subscribe('newStatusSetted', (err) => {
    if (!err) {
      console.log('Successfully subscribed to newStatusSetted');
    }else{
        console.log('error intentando suscribirse a newStatusSetted')
        throw new Error('error intentando suscribirse a newStatusSetted')
    }
}); 
//end of topics subscriptions
//create here a code which be able to verify if the status of a smart deviced have been changed, then, emit a response to the client client sockets
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
//aqui, msg me webió por no tener un tipo especificado para tomar el dato user de msg. ver el video de la rata para ver eso de los tipos inventados
     socket.on('turn',async(msg:any)=>{
        let userUsername:string=msg.user
        let userDevice:string=msg.device
        let deviceNewStatus:string=msg.newStatus
        let [result]=await conector.query(`SELECT * FROM users WHERE user='${userUsername}'`)
        console.log(result)
        try {
         if(result){
            if(result[0]){
               if(result[0].userDevice === deviceNewStatus){
               console.log('mira ->',result[0].iluminacion ,deviceNewStatus)
               }else if(result[0].userDevice  != deviceNewStatus){
             
                let messageQueued =await client.publish('newStatus', JSON.stringify({userUsername,userDevice,deviceNewStatus}));
                  if(messageQueued){
                    setTimeout(async()=>{
                        console.log('you are here')
                        let [result2]=await conector.query(`SELECT ${userDevice} FROM users WHERE user='${userUsername}'`)
                        if(result2)
                        { 
                            if(result2[0]){
                              if(userDevice === 'iluminacion'){
                                if(result2[0].iluminacion === deviceNewStatus){
                                    socket.emit('success',{user:userUsername,device:'iluminacion',status:result2[0].iluminacion})
                                }else if(result2[0].iluminacion != deviceNewStatus){
                                    let attempts=0
                                    let [result3]=conector.query(`SELECT * FROM users WHERE ${userUsername}`)
                                        while(attempts < 5 || result3[0].iluminacion != deviceNewStatus){
                                            let [result3]=conector.query(`SELECT * FROM users WHERE ${userUsername}`)
                                          if(result3){
                                          if(result3[0].iluminacion != deviceNewStatus){
                                            attempts++
                                          }else if(result3[0].iluminacion=== deviceNewStatus){
                                            attempts=5
                                            socket.emit('success',{user:userUsername,device:'iluminacion',status:result3[0].iluminacion})//agreagr el mensaje de success revisando lo que recive el frontend
                                          }
                                          }else{
                                            socket.emit('error')
                                          }
                                        }
                                }
                              }else if(userDevice === 'camara'){
                               if(result2[0].camara === deviceNewStatus){
                                socket.emit('success',{user:userUsername,device:'camara',status:result2[0].camara})
                               }else if(result2[0].camara != deviceNewStatus){
                                let attempts=0
                                let [result3]=conector.query(`SELECT * FROM users WHERE ${userUsername}`)
                                    while(attempts < 5 || result3[0].camara != deviceNewStatus){
                                        let [result3]=conector.query(`SELECT * FROM users WHERE ${userUsername}`)
                                      if(result3){
                                          if(result3[0].iluminacion != deviceNewStatus){
                                            attempts++
                                          }else if(result3[0].camara=== deviceNewStatus){
                                            attempts=5
                                            socket.emit('success',{user:userUsername,device:'camara',status:result3[0].camara})//agreagr el mensaje de success revisando lo que recive el frontend
                                          }
                                      }else{
                                        socket.emit('error')
                                      }
                                    }
                               }
                              }else if(userDevice === 'tv'){
                               if(result2[0].tv === deviceNewStatus){
                                socket.emit('success',{user:userUsername,device:'tv',status:result2[0].tv})
                               }else if(result2[0].tv != deviceNewStatus){
                                let attempts=0
                                let [result3]=conector.query(`SELECT * FROM users WHERE ${userUsername}`)
                                    while(attempts < 5 || result3[0].tv != deviceNewStatus){
                                     let [result3]=conector.query(`SELECT * FROM users WHERE ${userUsername}`)
                                      if(result3){
                                          if(result3[0].tv != deviceNewStatus){
                                                 attempts++
                                          }else if(result3[0].tv=== deviceNewStatus){
                                            attempts=5
                                            socket.emit('success',{user:userUsername,device:'tv',status:result3[0].tv})//agreagr el mensaje de success revisando lo que recive el frontend
                                          }
                                      }else{
                                        socket.emit('error')
                                      }
                                    }
                               }
                            }
                            }
                            else{
                             console.log('no results')
                            }
                       }else{
                        console.log('wtf?')
                       }
                    },500)
                 
               }         
            }
         }else{
          console.log('handle this')
         }
        } } catch (error) {
         console.log('here:',error)
        }
     })
})
    
} catch (error) {
    console.log('coneection error:',error)
}


client.on('message',async(topic:string,messages:any)=>{
    //server side
    if(topic === 'iluminacion' || topic === 'camara' || topic === 'tv')
    {
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
    }
    //user's device side:
    else if(topic==='newStatus')
    {
        console.log('newStatus stage')
        let message=messages.toString()
        let json=JSON.parse(message)
        console.log(json)
        //user's device checks if the user registered in it is valid
        //user's device confirms new status setted:
        let confirmNewStatus=client.publish('newStatusSetted',JSON.stringify({user:json.userUsername,device:json.userDevice,statusSetted:json.deviceNewStatus}))
        if(confirmNewStatus){
           console.log('success')
        }else{
           console.log('throwing error message')
           client.publish('error',JSON.stringify({user:json.userUsername,device:json.userDevice}))
        }
    }
        //server side
        else if(topic==='newStatusSetted')
        {
            let message=messages.toString()
            let json=JSON.parse(message)
            console.log('here!!!',json)
            let [rows,_fields]=await conector.query(`UPDATE users SET ${json.device}='${json.statusSetted}' WHERE user='${json.user}'`)
            if(rows.affectedRows > 0){
                console.log('device status changed successfully')
            }else{
                console.log('device status NOT changed successfully')
            }
        }

    
})


