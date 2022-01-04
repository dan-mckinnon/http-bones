const http = require('http')
const httpFramework = require('../src/http-framework.js')

let server = new httpFramework.Server({port:10005})
class GetHttpMethod extends httpFramework.HttpMethod{
    constructor(){
        super('GET')
    }
    async getData(request){
        let queryPosition = request.url.indexOf('?')

        let queryString = queryPosition != -1 ? request.url.substring(queryPosition+1) : ''
        return queryString
    }
}

class FunctionHandler extends httpFramework.Handler{
    constructor(){
        super('default')
    }
    async handlerImplementation(endPointObject,dataObject){
        return await endPointObject(dataObject)
    }
}
class BUAADeserializer extends httpFramework.Deserializer{
    constructor(){
        super('default')
    }
    async deserialize(data){
        return `<BUAA>${data}</BUAA>`
    }
}


server.addHttpMethod(new GetHttpMethod)
server.addSerializer(new httpFramework.Serializer('default'))
server.addDeserializer(new BUAADeserializer())

server.addHandler(new FunctionHandler())
server.add('GET','/something',null,(data)=>{
    console.log( '/something end point executed') 
    console.log(data)   
    if ( data != '<BUAA>hello</BUAA>'){
        throw new Error('Deserializer did not return expected value')
    }
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
http.request("http://localhost:10005/something?hello").end()

