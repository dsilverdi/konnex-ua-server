const App = require('./src/app')
const ua = require('./src/ua/config')

server = new App()

server.init(process.env.PORT || 9000, () => {
    // influxDB.init()
    // mongodb.init()
    // redis.init()
    // mqtt.init()
    (async function(){
        ua.ReadConfiguration()
    })()
})

process.on('exit', function (){
   console.log('Saving All Configuration');
    ua.SaveUAConfiguration();
});

process.on("SIGINT", function(){
    console.log("You Pressed CTRL+C");
    (async function(err){
        process.exit();
    })();
});


