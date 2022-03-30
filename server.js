const App = require('./src/app')

server = new App()

server.init(process.env.PORT || 9000, () => {
    // influxDB.init()
    // mongodb.init()
    // redis.init()
    // mqtt.init()
})