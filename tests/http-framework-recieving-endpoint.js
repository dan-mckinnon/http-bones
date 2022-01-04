const http = require('http')
const httpFramework = require('../src/http-framework.js')

let server = new httpFramework.Server({port:10005})
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
server.add('GET','/something',null,()=>{
    console.log( '/something end point executed')    
    server.stop()
    process.exit()
})
server.on('start',()=>{
    console.log('server started')
})
server.on('request',()=>{
    console.log('request recieved')
})
setTimeout(()=>{
    throw new Error('Server did not catch /something endpoint')
    server.stop()
    process.exit()
},5000)
server.start();

console.log('sending request')
http.request("http://localhost:10005/something?{'hello':'world'}").end()

