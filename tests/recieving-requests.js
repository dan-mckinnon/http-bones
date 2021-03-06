const httpFramework = require('../src/http-framework.js')

let server = new httpFramework.Server({port:10002})
server.addHttpMethod(new httpFramework.HttpMethod('GET'))
server.addSerializer(new httpFramework.Serializer('default'))
server.addDeserializer(new httpFramework.Deserializer('default'))
server.addHandler(new httpFramework.Handler('default'))
server.on('request',(request,response)=>{
    console.log("request recieved")
    server.stop()
    process.exit(0)
})
server.start()

setTimeout(()=>{
    server.stop()
    throw new Error('Server did not recieve any requests')
},5000)

require('http').request('http://localhost:10002/anything').end()

