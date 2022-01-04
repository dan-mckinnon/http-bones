
const http = require('http')
const httpFramework = require('../src/http-framework.js')
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
class PassThroughDeserializer extends httpFramework.Deserializer{
    constructor(){
        super('default')
    }
    async deserialize(data){
        return '' + data
    }
}

class JoinTextSerializer extends httpFramework.Serializer{
    constructor(){
        super('default')
    }
    async serialize(responseList){
        return responseList.join('-')
    }
}
let server = new httpFramework.Server({port:10009})
server.addHttpMethod(new GetHttpMethod())
server.addSerializer(new JoinTextSerializer())
server.addDeserializer(new PassThroughDeserializer())
server.addHandler(new FunctionHandler())
server.add('GET','/something',null,async (data)=>{
    return 'hello'
})
server.add('GET','/something',null,async (data)=>{
    return 'world'
})
server.on('start',()=>{
    console.log('server started')
})
server.on('request',()=>{
    console.log('request recieved')
})
setTimeout(()=>{
    server.stop()
    throw new Error('Server did not catch /something endpoint')

},5000)
server.start();

console.log('sending request')
http.request("http://localhost:10009/something",(request)=>{
    let data = ''    
    request.on('data',(newData)=>{
        data += newData
    })
    request.on('close',()=>{
        console.log(`recieved reply "${data}"`)
        if ( data != 'hello-world' && data !='world-hello'){
            throw new Error(`Invalid response.  Expected "hello-world" or "world-hello" and got "${data}"`)
        }
        server.stop()
        process.exit()
    })
}).end()

