const http = require('http')
const httpFramework = require('../src/http-framework.js')

let server = new httpFramework.Server({port:10004})
server.addHttpMethod(new httpFramework.HttpMethod('GET'))
server.addSerializer(new httpFramework.Serializer('default'))
server.addDeserializer(new httpFramework.Deserializer('default'))
class FunctionHandler extends httpFramework.Handler{
    constructor(){
        super('default')
    }
    async handlerImplementation(endPointObject,dataObject){
        return await endPointObject(dataObject)
    }
}
server.addHandler(new FunctionHandler())
server.on('request',()=>{
    console.log( 'request event executed')    
    server.stop()
    process.exit(0)
})
server.on('start',()=>{
    console.log('server started')
})
setTimeout(()=>{
    server.stop()
    throw new Error('Server did not emit a request event')
},5000)
server.start();

console.log('sending request')
http.request('http://localhost:10004/something').end()

