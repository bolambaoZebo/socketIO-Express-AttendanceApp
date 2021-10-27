const express = require('express')();
const cors = require('cors');
const http = require('http').createServer(express);
const io = require('socket.io')(http);
const { MongoClient } = require('mongodb')

const client = new MongoClient('mongodb+srv://db-travel-blog:7JMCcvz0SSuvm6MA@cluster0.5ekbc.mongodb.net/attendance_db?retryWrites=true&w=majority');

express.use(cors());

var collection;

io.on('connection', (socket) => {

      console.log("connected")

      socket.emit('connected', "Connected")

      socket.on('join', async (userId) => {
            try{
                  let result = await collection.findOne({ "_id": userId });
                  if(!result){
                        await collection.insertOne({ "_id": userId, attendance: [] });
                  }
                  socket.join(userId);
                  socket.emit('joined', userId);
                  socket.activeRoom = userId;
            }catch (e) {
                  console.error(e);
            }
      });
      socket.on('attendance', (attendanceData) => {

            socket.emit('logs', attendanceData)
            
            console.log(attendanceData)
         
            collection.updateOne({ "_id": socket.activeRoom }, {
                  "$push" : {
                        "attendance": attendanceData
                  }
            });
            
            io.to(socket.activeRoom).emit('attendance', attendanceData);
      });

      socket.on('disconnect', () => {
            console.log('user disconnected');
          });
});

express.get('/attendances', async (req, res) =>{

      try {
            let result = await collection.findOne({ "_id" : 'marketers'})//({ "_id": req.query.room })
            // let result = await collection.find()
            res.send(result)
      }catch (e){
            res.status(500).send( {message: e.message });
      }
});


http.listen(4000, async () => {

      try{
            await client.connect();
            collection = client.db("attendance_db").collection('attendance');
            console.log("Listening on PORT :%s", http.address().port)

      }catch (e){
            console.error(e);
      }
})