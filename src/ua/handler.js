const fs = require('fs')
const opcua = require('node-opcua')
const mqtt = require('mqtt')
const util = require('util')

const ServerList = []

async function CreateNewServer(payload) {
    const server = new opcua.OPCUAServer({
        port: payload.port, // the port of the listening socket of the servery
        resourcePath: "/ua/server",
        buildInfo: {
          buildDate: new Date(),
        }
    });

    await server.initialize()
    construct_address(server)
    await server.start()

    ServerList.push({
        server_object : server,
        server_id : payload.id,
        server_port: payload.port,
        server_name: payload.name,
        device: []
    })

    return server 
}

function construct_address(server) {
    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();
    const objectsFolder = addressSpace.rootFolder.objects;

    namespace.addFolder(objectsFolder,
        { browseName: 'mqttConnect'}
    );

    namespace.addFolder(objectsFolder,
        { browseName: 'modbusConnect'}
    );
    
}

function GetServerList(){
    return ServerList
}

function AddVariable(server, payload){
    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    namespace.addVariable({
        componentOf: payload.componentOf,
        browseName: payload.browseName,
        dataType: payload.dataType,
        value: payload.value
    })

    console.log(payload)
}

async function AddMqttVariable(server, payload){
    console.log(payload)
    const addressSpace = server.engine.addressSpace
    const namespace = addressSpace.getOwnNamespace();

    const objectsFolder = addressSpace.findNode('ns=1;i=1000');

    const device  = namespace.addFolder(objectsFolder,{ browseName: payload.deviceName});

    var VALUE = 0;

    (()=>{
        const host = payload.host
        const port = payload.port
        const clientId = `konnex_${Math.random().toString(16).slice(3)}`
        
        const connectUrl = `mqtt://${host}:${port}`
        
        try{
            const client = mqtt.connect(connectUrl, {
                clientId,
                clean: true,
                connectTimeout: 4000,
                username: 'mqtt',
                password: 'public',
                keepalive: 1,
                clean: false,
                reconnectPeriod: 1000 * 1
            })
        
            const topic = payload.topic
            client.on('connect', () => {
                // console.log('Connected')            
                client.subscribe([topic], () => {
                })        
            })
        
            client.on('message', (topic, payload) => {
                VALUE = parseFloat(payload.toString())
                console.log(VALUE)
                // console.log(payload.toString())
                // if (payload != null) {
                //     VALUE = parseFloat(payload.toString())
                // }
                
            })
        }catch(err){
            console.log(err)
        }
        
    })()
    
    // class MqttConfig extends opcua.ExtensionObject{
    //     constructor(options){
    //         super()
    //         this.host = options.host
    //         this.port = options.port
    //         this.topic = options.topic
    //     }        
    // }

    // // util.inherits(MqttConfig, opcua.ExtensionObject)

    // const cfg = new MqttConfig({
    //     host: payload.host,
    //     port: payload.port,
    //     topic: payload.topic
    // })

    // mqtt.AddMqttVariable(config, VALUE)
    const mqttConfig = namespace.addVariable({
        componentOf: device,
        browseName: 'MqttConfiguration',
        dataType: opcua.DataType.Double,
        // value: new opcua.Variant({dataType: opcua.DataType.Double, value: 32.2}),
    })

    namespace.addVariable({
        componentOf: mqttConfig,
        browseName: 'MqttHost',
        dataType: opcua.DataType.String,
        value: new opcua.Variant({dataType: opcua.DataType.String, value: payload.host}),
    })

    namespace.addVariable({
        componentOf: mqttConfig,
        browseName: 'MqttPort',
        dataType: opcua.DataType.String,
        value: new opcua.Variant({dataType: opcua.DataType.String, value: payload.port}),
    })

    namespace.addVariable({
        componentOf: mqttConfig,
        browseName: 'MqttTopic',
        dataType: opcua.DataType.String,
        value: new opcua.Variant({dataType: opcua.DataType.String, value: payload.topic}),
    })

   namespace.addVariable({
        componentOf: device,
        browseName: payload.browseName,
        dataType: opcua.DataType.Double,
        value: {  get: function () { return new opcua.Variant({dataType: opcua.DataType.Double, value: VALUE }); } }
    })

    // console.log(node.nodeId.toString()) <-- to get node id
}

function AddObject(server, payload) {
    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    namespace.addObject({
        organizedBy: addressSpace.rootFolder.objects,
        browseName: payload.browseName
    });
}

module.exports = {
    CreateNewServer,
    GetServerList,
    AddVariable,
    AddMqttVariable,
    AddObject
}