const opcua = require('node-opcua')
const handler = require('./handler')
const fs = require('fs')
const res = require('express/lib/response')
const { handle } = require('express/lib/application')

function SaveUAConfiguration(){
    ServerList = handler.GetServerList()   
    ServerList.map((server)=>{
        handleSaveConfiguration(server.server_object, server.server_id, server.server_port)
    })    
}

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

        ServerList = handler.GetServerList()

        ServerList.push({
            server_object : server,
            server_id : id,
            server_port : parseInt(port)
        })

        const endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;

        console.log('server exposed at ', endpointUrl)

        console.log('Initiate Server ', id)

        const addressSpace = server.engine.addressSpace
        // const namespace = addressSpace.getOwnNamespace();
    
        const mqtt = addressSpace.findNode('ns=1;i=1000');
       
        const browseRes = mqtt.browseNode( {
            browseDirection: 0,
            includeSubtypes: true, 
            nodeClassMask: 5,
            nodeId: 'ns=1;i=1000',
            referenceTypeId:'Organizes',
            resultMask:5
        })

        const res = []
        browseRes.map((b)=>{
            res.push(b.nodeId.toString())
        })

        res.map(async (r)=>{
            let dev = addressSpace.findNode(r)
            const browsed = dev.browseNode( {
                browseDirection: 2,
                includeSubtypes: true, 
                nodeClassMask: 10,
                nodeId: r,
                referenceTypeId:'HasComponent',
                resultMask:10
            })

            const final = []
            browsed.map((b)=>{
                final.push(b.nodeId.toString())
            })
            
            await handleStartMqtt(addressSpace, final[0], final[1])
        })

    }catch (err){
        console.error(err)
    }
    
}

async function handleStartMqtt(addressSpace, config, value){    
    console.log('mqtt var value is ', value)

    const configNode = addressSpace.findNode(config)
    
    // const browseConfig = configNode.browseNode({
    //     browseDirection: 0,
    //     includeSubtypes: true, 
    //     nodeClassMask: 10,
    //     nodeId: config,
    //     referenceTypeId:'HasComponent',
    //     resultMask:10
    // })

    // console.log(configNode)
    const mqttCfg = {
        host : configNode.mqttHost['$dataValue'].value.value,
        port : configNode.mqttPort['$dataValue'].value.value,
        topic : configNode.mqttTopic['$dataValue'].value.value
    }

    console.log('mqtt config is in ', mqttCfg)
}

module.exports = {
    SaveUAConfiguration,
    RunSavedConfiguration
}
