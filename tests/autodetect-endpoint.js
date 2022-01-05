const httpFramework = require('../src/http-framework.js')

let server = new httpFramework.Server({
    port:10001
})
server.on('start',()=>{
    console.log( 'http server started!')
    server.stop()
    process.exit(0)
})
setTimeout(()=>{
    server.stop()
    throw new Error('Server did not emit "start" event')
},2000)
server.start()
