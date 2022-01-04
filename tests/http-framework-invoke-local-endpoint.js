const httpFramework = require('../src/http-framework.js')
let framework = require('../src/http-framework.js')

let server = new framework.Server({port:10003})
server.addHttpMethod(new framework.HttpMethod('GET'))
server.addSerializer(new framework.Serializer('default'))
server.addDeserializer(new framework.Deserializer('default'))
class FunctionHandler extends framework.Handler{
    constructor(){
        super('default')
    }
    async handlerImplementation(endPointObject,dataObject){
        console.log('I am FunctionHandler')
        return await endPointObject(dataObject)
    }
}
server.addHandler(new FunctionHandler())
server.add('GET','/something',{},()=>{
    console.log( '/something executed')    
    server.stop()
    process.exit()
})
setTimeout(()=>{
    throw new Error('Server did not execute /something path')
    server.stop()
    process.exit()
},500)
server.start();

(async()=>{
    await server.invokeLocal('GET','/something',{})
})()
