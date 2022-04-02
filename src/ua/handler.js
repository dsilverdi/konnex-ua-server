const fs = require('fs')
const opcua = require('node-opcua')
const mqtt = require('mqtt')

let ServerList = []

async function CreateNewServer(payload) {
    const server = new opcua.OPCUAServer({
        port: payload.port, // the port of the listening socket of the servery
        resourcePath: "/ua/server",
        buildInfo: {
          productName: payload.productname,
          buildNumber: payload.buildnumber,
          buildDate: new Date(),
        }
    });

    await server.initialize()
    construct_address(server)
    await server.start()

    ServerList.push({
        server_object : server,
        server_id : payload.id,
        server_port: payload.port
    })

    return server 
}

function construct_address(server) {
    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    namespace.addObject({
        organizedBy: addressSpace.rootFolder.objects,
        browseName: 'mqttConnect'
    });

    namespace.addObject({
        organizedBy: addressSpace.rootFolder.objects,
        browseName: 'modbusConnect'
    });
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
    const addressSpace = server.engine.addressSpace
    const namespace = addressSpace.getOwnNamespace();

    const objectsFolder = addressSpace.rootFolder.objects;

    const device  = namespace.addFolder(objectsFolder,{ browseName: payload.deviceName});

    var VALUE = 0.1;

    // const config = {
    //     host : 'broker.emqx.io',
    //     port : '1883',
    //     topic : '/konnex/mqtt/test'
    // }

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
            })
        }catch(err){
            console.log(err)
        }
        
    })()

    // mqtt.AddMqttVariable(config, VALUE)

    namespace.addVariable({
        componentOf: device,
        browseName: payload.browseName,
        dataType: payload.dataType,
        value: {  get: function () { return new opcua.Variant({dataType: opcua.DataType.Double, value: VALUE }); } }
    })
}

function AddObject(server, payload) {
    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    namespace.addObject({
        organizedBy: addressSpace.rootFolder.objects,
        browseName: payload.browseName
    });
}

function SaveUAConfiguration(){
    ServerList.map((server)=>{
        handleSaveConfiguration(server.server_object, server.server_id, server.server_port)
    })    
}//     if (error) {
//       console.error(error)
//     }
//   })

function handleSaveConfiguration(server, id, port){
    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    let xml = namespace.toNodeset2XML();
    // console.log(xml)

    xml = xml.replace(/<[//]{0,1}(Models|\/Models)[^><]*>/g,"")
    xml = xml.replace(/<[//]{0,1}(Model|\/Model)[^><]*>/g,"")
    xml = xml.replace(/<[//]{0,1}(RequiredModel|\/RequiredModel)[^><]*>/g,"")

    fs.writeFileSync(`./tmp/c_${port}_${id}.xml`, xml, function (err) {
        if (err) throw err;
    });
}

function RunSavedConfiguration(){
    let date = new Date()
    console.log(date)
    fs.readdirSync('./tmp/').forEach(async (file) => {
        config = file.split('_')
        port = config[1]
        id = config[2].substring(0,config[2].length-4)
        
        
        await handleRunConfiguration('./tmp/'+file, id, port)
    });
}

async function handleRunConfiguration(file, id, port){
   
    //opcua.generateAddressSpace()
    try{
        var server_options = {
            port: parseInt(port),
            resourcePath: "/ua/server",
            buildInfo: {
                buildDate: new Date(),
            },
            nodeset_filename: [
                opcua.nodesets.standard,
                file,
            ],
            /*  other server options here */
        };
               

        const server = new opcua.OPCUAServer(server_options);
        
        // await server.initialize()
        await server.start()

        ServerList.push({
            server_object : server,
            server_id : id,
            server_port : parseInt(port)
        })
        const endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;

        console.log('server exposed at ', endpointUrl)

        console.log('Initiate Server ', id)
    }catch (err){
        console.error(err)
    }
    
}

module.exports = {
    CreateNewServer,
    GetServerList,
    AddVariable,
    AddMqttVariable,
    AddObject,
    SaveUAConfiguration,
    RunSavedConfiguration
}