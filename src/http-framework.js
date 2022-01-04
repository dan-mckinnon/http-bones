const http = require('http')
const {EventEmitter} = require("events");


class EndPointExistsError extends Error{}

//#region HTTP Server
class Handler{
    #options = {
        async:false
    }
    #id = 'handler'
    get id(){
        return this.#id
    }
    constructor(id,options){
        this.#options = {...this.#options,...options}
        this.#id = new String(id)
    }
    async isValidEndPointObject(endPointObject){
        return true
    }
    async handle(endPointObject,dataObject){
        if ( this.#options.async ){
            handlerImplementation(endPointObject,dataObject)            
            return 'async'
        } else {
            return await this.handlerImplementation(endPointObject,dataObject)
        }
    }

    //virtual
    //async handlerImplementation(endPointObject){}

}


//JSON, Yaml, Text, etc.
class Serializer{
    #id = 'default'
    get id(){
        return this.#id
    }
    constructor(id){
        this.#id = new String(id)
    }
    serialize(dataObject){
        
    }

}

//JSON, Yaml, Text, etc.
class Deserializer{
    #id = 'default'
    get id(){
        return this.#id
    }
    constructor(id){
        this.#id = new String(id)
    }
    deserialize(data){
        
    }

}

class EndPointListener{
    #handler=null
    endPointObject=null
    constructor(handler,endPointObject) {
        if ( !(handler instanceof Handler)) {
            throw new TypeError('handler is not of type Handler')
        }
        this.#handler = handler
        this.endPointObject = endPointObject
    }

    async invoke(dataObject){
        return await this.#handler.handle(this.endPointObject,dataObject)        
    }
}
class EndPoint{
    #path='/'
    #deserializer=null
    #serializer=null
    #listeners=[]
    constructor(path,deserializer,serializer){
        if ( typeof(path) !== 'string'){
            throw new TypeError('path is not of type string')
        }
        if ( !(deserializer instanceof Deserializer)) {
            throw new TypeError('deserializer is not of type Deserializer')
        }
        if ( !(serializer instanceof Serializer)) {
            throw new TypeError('serializer is not of type Serializer')
        }
        
        this.#path = path
        this.#deserializer = deserializer
        this.#serializer = serializer
        this.#listeners = []
    }

    addListener(endPointListener){
        if ( !(endPointListener instanceof EndPointListener)) {
            throw new TypeError('endPointListener is not of type EndPointListener')
        }        
        this.#listeners.push(endPointListener)
    }
    removeListener(endPointListener){
        if ( !(endPointListener instanceof EndPointListener)) {
            //fallback to find end point by object instead
            endPointListener = this.findListener(endPointListener)
            if ( !endPointListener){
                throw new Error('End point not present')
            }
            throw new TypeError('endPointListener is not of type EndPointListener')
        }     
        let endPointListenerIndex = this.#listeners.indexOf(endPointListener)
        if ( endPointListenerIndex < 0 ){
            throw new Error('End point not present')
        }
        this.#listeners = this.#listeners.splice(endPointListenerIndex,1)
    }

    findListener(endPointObject){
        for( let endPointListener of this.#listeners){
            if ( endPointListener.endPointObject === endPointObject ){
                return endPointListener
            }
        }
        return null
    }

    async invoke(rawData){
        let dataObject = await this.#deserializer.deserialize(rawData)
        let output = []
        for(let endPointListener of this.#listeners){
            output.push(await endPointListener.invoke(dataObject))
        }
        return await this.#serializer.serialize(output)
        
    }
    async invokeLocal(dataObject){
        let output = []        
        for(let endPointListener of this.#listeners){
            output.push(await endPointListener.invoke(dataObject))
        }
        return output
    }
    
}
//GET, POST, etc
class HttpMethod{
    #id = 'GET'
    #endPoints = {}

    get id(){
        return this.#id
    }
    constructor(id){
        this.#id = new String(id)
        this.#endPoints = {}
    }    

    addEndPoint(endPoint){
        if ( !(endPoint instanceof EndPoint)) {
            throw new TypeError('endPoint is not of type EndPoint')
        }        
        this.#endPoints[endPoint.id] = endPoint
    }
    remove(path,endPointObject){
        let endPoint = this.#endPoints[path]
        if (!endPoint){
            throw new Error(`endpoint "${path}" does not exist`)
        }

        if (!endPointObject){
            delete this.#endPoints[endPoint.id]
        } else {
            endPoint.removeListener(endPointObject)
        }
    }
    removeEndPoint(endPoint){
        if ( !(endPoint instanceof EndPoint)) {
            throw new TypeError('endPoint is not of type EndPoint')
        }       
        delete this.#endPoints[endPoint.id]   
    }
    createEndPoint(path,deserializer,serializer){
        let endPoint = this.#endPoints[path]
        if (!endPoint){
            endPoint = new EndPoint(path,deserializer,serializer)
        } else {
           throw new EndPointExistsError(`End point "${id}" "${path}" already exists`,id,path) 
        }        
    }
    
    
    createEndPointListener(path,deserializer,serializer,handler,endPointObject){
        let endPoint = this.#endPoints[path]
        if (!endPoint){
            endPoint = new EndPoint(path,deserializer,serializer)
            this.#endPoints[path] = endPoint
        }

        endPoint.addListener(new EndPointListener(handler,endPointObject))
    }

    async invokeEndPoint(path,request){
        let endPoint = this.#endPoints[path]
        if (!endPoint ){
            throw new Error(`Endpoint ${path} not implemented`)
        }

        let rawData = await this.getData(request)
        return await endPoint.invoke(rawData)
    }
    async invokeEndPointLocal(path,dataObject){
        let endPoint = this.#endPoints[path]
        if (!endPoint ){
            throw new Error(`Endpoint ${path} not implemented`)
        }
        return await endPoint.invokeLocal(dataObject)        
    }
    async getData(request){
        return null
    }
}



//An http server with no features:
//  Requires:
//      - HttpMethods (e.g. GET, POST) to read input data
//      - Deserializers: how to interpret request data (e.g. Text, JSON)
//      - Serializers: how to present output (e.h. Text, JSON)
//      - Handlers (e.g. FunctionHandler, and ScriptHandler)
class Server extends EventEmitter{
    #options = {port:8902}
    #httpServer = null
    #httpMethods = {}
    #deserializers = {}
    #serializers = {}
    #handlers = {}
    constructor(options){
        super()
        this.#options = {...this.#options,...options}
        
        this.#httpServer = http.createServer()

        this.#httpServer.on('request',(request,response)=>this.#handleHttpRequest(request,response))
        this.#httpServer.on('close',()=>this.#handleClose())
        
        this.#httpMethods = {}
        this.#deserializers = {}
        this.#serializers = {}
        this.#handlers = {}

    }


    async #handleHttpRequest(request,response){
        this.emit('request',request,response)
        let queryPosition = request.url.indexOf('?')
        let path = request.url.substring(0,queryPosition != -1 ? queryPosition : request.url.length)

        let httpMethod = this.#httpMethods[request.method]
        if ( !httpMethod ){
            throw new Error(`Http Method "${request.method}" is unsupported`)
        }

        try{
            let output = await httpMethod.invokeEndPoint(path,request)
            response.statusCode=200
            response.write(output)
            response.end()
        } catch(e){
            response.statusCode=400
            response.end()
            throw e            
        }        

    }
    #handleListening(){
        this.emit('start')
    }
    #handleClose(){
        this.emit('stop')
    }

    start(){
        this.#httpServer.listen(this.#options.port,this.#options.hostname,this.#options.backlog,()=>this.#handleListening())
    }
    stop(){
        this.#httpServer.close()
    }

    addSerializer(serializer){
        if ( !(serializer instanceof Serializer)) {
            throw new TypeError('serializer is not of type Serializer')
        }       
        this.#serializers[serializer.id] = serializer

    }
    
    addDeserializer(deserializer){
        if ( !(deserializer instanceof Deserializer)) {
            throw new TypeError('deserializer is not of type Deserializer')
        }   
        this.#deserializers[deserializer.id] = deserializer            
    }
    
    addHandler(handler){
        if ( !(handler instanceof Handler)) {
            throw new TypeError('handler is not of type Handler')
        }
        this.#handlers[handler.id] = handler
    }

    addHttpMethod(httpMethod){
        if ( !(httpMethod instanceof HttpMethod)) {
            throw new TypeError('httpMethod is not of type HttpMethod')
        }
        this.#httpMethods[httpMethod.id] = httpMethod
    }
    removeHttpMethod(httpMethod){
        if ( !(httpMethod instanceof HttpMethod)) {
            throw new TypeError('httpMethod is not of type HttpMethod')
        }
        delete this.#httpMethods[httpMethod.id]
    }


    //Add an endpoint and/or an endpoint listener
    //Two usages:
    //add("GET","/index",{})                 - add an endpoint,  set the serializer and deserializer using options
    //add("GET","/index",{},(data)=>{})      - add an endpoint listener
    add(method,path,options={},endPointObject=undefined){
        options = {
            deserializer:'default',
            serializer:'default',
            handler:'default',
            ...options}

        //look up the serializer, deserializer and method


        if (endPointObject === undefined){
            this.#createEndPoint(method,path,options)
        } else {
            this.#createEndPointListener(method,path,options,endPointObject)
        }

    }
    #createEndPoint(method,path,options){
        let httpMethod = this.#httpMethods[method]
        if ( !httpMethod ){
            throw new Error(`HTTP method ${method} not implemented`)
        }
        let deserializer = this.#deserializers[options.deserializer]
        if (!deserializer ){
            throw new Error(`Deserializer ${options.deserializer} is not implemented`)
        }
        let serializer = this.#serializers[options.serializer]
        if (!serializer ){
            throw new Error(`Serializer ${options.serializer} is not implemented`)
        }

        httpMethod.createEndPoint(path,deserializer,serializer)
    }
    #createEndPointListener(method,path,options,endPointObject){
        let httpMethod = this.#httpMethods[method]
        if ( !httpMethod ){
            throw new Error(`HTTP method ${method} not implemented`)
        }
        let deserializer = this.#deserializers[options.deserializer]
        if (!deserializer ){
            throw new Error(`Deserializer ${options.deserializer} is not implemented`)
        }
        let serializer = this.#serializers[options.serializer]
        if (!serializer ){
            throw new Error(`Serializer ${options.serializer} is not implemented`)
        }        
        let handler = this.#handlers[options.handler]
        if (!handler ){
            throw new Error(`Handler ${options.handler} is not implemented`)
        }   

        httpMethod.createEndPointListener(path,deserializer,serializer,handler,endPointObject)

    }
    remove(method,path,endPointObject=undefined){
        let httpMethod = this.#httpMethods[method]
        if ( !httpMethod ){
            throw new Error(`HTTP method ${method} not implemented`)
        }
        httpMethod.remove(path,endPointObject)        
    }    
    async detectEndPointListener(endPointObject){
        for( let handler of this.#handlers){
            if ( await handler.isValidEndPointObject(endPointObject)){
                return handler
            }
        }
        return null
    }

    addEndPoint(methodId,endPoint){
        if ( !(endPoint instanceof EndPoint)) {
            throw new TypeError('endPoint is not of type EndPoint')
        }
    }
    addEndPointListener(methodId,path,endPointListener){
        if ( !(endPointListener instanceof HttpMethod)) {
            throw new TypeError('httpMethod is not of type HttpMethod')
        }
    }

    async invokeLocal(method,path,dataObject){
        
        let httpMethod = this.#httpMethods[method]
        if ( !httpMethod ){
            throw new Error(`Http Method "${request.method}" is unsupported`)
        }

        return await httpMethod.invokeEndPointLocal(path,dataObject)

        
    }

}

module.exports = {
    Handler:Handler,
    Serializer:Serializer,
    Deserializer:Deserializer,
    HttpMethod:HttpMethod,    
    Server:Server
}