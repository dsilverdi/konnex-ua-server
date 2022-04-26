const opcua = require('node-opcua')
const handler = require('./handler')
const fs = require('fs')
const mqtt = require('mqtt')

function SaveUAConfiguration(){
    ServerList = handler.GetServerList()
    const data = {
        table: []
    }

    ServerList.map((server)=>{
        data.table.push({
            server_id: server.server_id,
            server_name: server.server_name,
            server_port: server.server_port,
            // owner: server.owner,
            device: server.device
        }); 
        
    })

    json = JSON.stringify(data, null, 2); //convert it back to json
    fs.writeFileSync('./tmp/sconfig.json', json, function (err){
        console.log(err)
    }) 
}

function ReadConfiguration(){
    var data = fs.readFileSync('./tmp/sconfig.json')
    ServerList = handler.GetServerList()

    obj = JSON.parse(data)

    obj.table.map(async (data)=>{
        // session = ua.CreateSession(data.url)
        const payload = {
            id: data.server_id,
            port: data.server_port,
            name: data.server_name
        }

        await handler.CreateNewServer(payload)

        data.device.map(async (dev)=>{
            if (dev.type == 'mqtt') {
                serverls = handler.GetServerList()
                serverobj = serverls.find(obj => {
                    return obj.server_id === data.server_id
                })
        
                const mqttCfg = {
                    host: dev.host,
                    port: dev.port,
                    dataType: dev.data_type,
                    deviceName: dev.device_name,
                    browseName: dev.browse_name,
                    topic: dev.topic
                }

                const deviceID = await handler.AddMqttVariable(serverobj.server_object, mqttCfg)

                serverobj.device.push({
                    type: 'mqtt',
                    node_id: deviceID,
                    data_type: mqttCfg.dataType,
                    device_name: mqttCfg.deviceName,
                    browse_name: mqttCfg.browseName,
                    host: mqttCfg.host,
                    port: mqttCfg.port,
                    topic: mqttCfg.topic
                })
            }
        })
    })
}

module.exports = {
    SaveUAConfiguration,
    ReadConfiguration
}
