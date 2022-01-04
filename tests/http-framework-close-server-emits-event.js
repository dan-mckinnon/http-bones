const http = require('http')
const httpFramework = require('../src/http-framework.js')

let server = new httpFramework.Server({port:10005})
server.addHttpMethod(new httpFramework.HttpMethod('GET'))
server.addSerializer(new httpFramework.Serializer('default'))
server.addDeserializer(new httpFramework.Deserializer('default'))
server.addHandler(new httpFramework.Handler('default'))

server.on('stop',()=>{
    console.log('server stopped successfully')
    server.stop()
    process.exit(0)
})
setTimeout(()=>{
    server.stop()    
    throw new Error('Server did not emit a stop event')
},2000)
server.start();
setTimeout(()=>{
    console.log('sending stop')
    server.stop()
},500)

