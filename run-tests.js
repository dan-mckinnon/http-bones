const util = require('util');
const {spawn} = require('child_process');

const showStdout = process.argv.length >= 3 ? process.argv.includes('debug') : false

const fs = require('fs');
const path = require('path');

(async ()=>{
    let error = false
    //run every .js file in the tests folder
    let testFiles = fs.readdirSync('tests')
    for await ( let testFile of testFiles ){
        if ( path.extname(testFile) != '.js'){
            continue
        }
        let testPath = path.resolve('tests',testFile)
        const child = spawn('node',[testPath])

        if ( showStdout ){
            console.log()
            console.log(`Running test "\x1b[35m${testFile}\x1b[0m"`)
            for await(const stdout of child.stdout){
                process.stderr.write(`\x1b[36m${testFile}:\x1b[0m ${stdout.toString()}`)
            }            
        }

        for await(const stderr of child.stderr){
            error = true
            process.stderr.write(`\x1b[36m${testFile}:\x1b[0m ${stderr.toString()}`)
        }
    }

    if (error){
        console.log('')
        console.log("\x1b[31mOne or more test(s) failed.\x1b[0m")
    } else {
        console.log("\x1b[32mAll tests passed.\x1b[0m")
    }

})()

