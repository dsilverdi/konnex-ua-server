// const mqtt = require('mqtt')

// function SubscribeMQTT(config, VALUE){
//     const host = config.host
//     const port = config.port
//     const clientId = `konnex_${Math.random().toString(16).slice(3)}`

//     const connectUrl = `mqtt://${host}:${port}`
//     const client = mqtt.connect(connectUrl, {
//         clientId,
//         clean: true,
//         connectTimeout: 4000,
//         username: 'mqtt',
//         password: 'public',
//         keepalive: 1,
//         clean: false,
//         reconnectPeriod: 1000 * 1
//     })

//     const topic = config.topic
//     client.on('connect', (err) => {
//         if (err) {
//             console.log(err)
//         }
//         console.log('Connected')
    
//         client.subscribe([topic], (err) => {
//             if (err) {
//                 console.log(err)
//             }
//             console.log(`Subscribe to topic '${topic}'`)
//         })

//     })

//     client.on('message', (topic, payload) => {
//         console.log('Received Message:', topic, payload.toString())
//         VALUE = payload.toString
//     })
// }

// module.exports = SubscribeMQTT