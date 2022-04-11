const logger = require('./pkg/logger')
const {v4: uuidv4} = require('uuid');
const wrapper = require('./pkg/wrapper')
const ua = require('./ua/handler')
const _ = require('lodash')

const CreateUAServer = async (req, res) => {
    const payload = {
        id: uuidv4(),
        port: req.body.port,
        name: req.body.name,
        buildnumber: req.body.buildnumber
    }

    if (_.isEmpty(payload, true)) {
        wrapper.send(res, 'Payload cannot be empty', 'Error', 400)
    }
    
    try{
        server = await ua.CreateNewServer(payload)
        
        const endpointUrl = server.endpoints[0].endpointDescriptions()[0].endpointUrl;
        logger.info('ua-server',`server endpoint url is ${endpointUrl}`, '' );
        
        wrapper.send(res, 'done create server exposed at ' + endpointUrl, 'Your Request Has Been Processed ', 201)
    }catch (err){
        wrapper.send(res, err, 'Error', 500)
    }
}

const GetServerList = async (req, res) => {
    serverlist = ua.GetServerList()
    data = []

    serverlist.map((server)=>{
        data.push({
          endpoint:  server.server_object.endpoints[0].endpointDescriptions()[0].endpointUrl,
          server_id: server.server_id,
          server_name: server.server_name,
          device: server.device
        })
    })

    const id = req.query.id
    if (id){
        serverobj = data.find(obj => {
            return obj.server_id === id
        })

        wrapper.send(res, serverobj, 'Your Request Has Been Processed ', 201)
    }

    try{   
        wrapper.send(res, data, 'Your Request Has Been Processed ', 201)
    }catch (err){
        wrapper.send(res, err, 'Error', 500)
    }
}

const AddUAVariable = async (req, res) => {
    const type = req.query.type

    if (type == 'mqtt'){
        await handleAddMqttVarible(req, res)
    }else{
        await handleAddVariable(req,res)
    }

}

const handleAddMqttVarible = async (req, res) => {
    const payload = {
        serverID : req.body.server_id,
        deviceName : req.body.device_name, 
        browseName : req.body.browse_name,
        dataType : req.body.data_type,
        host: req.body.host,
        port: req.body.port,
        topic: req.body.topic
    }

    if (_.isEmpty(payload, true)) {
        wrapper.send(res, 'Payload cannot be empty', 'Error', 400)
    }
    try {
        serverls = ua.GetServerList()
        serverobj = serverls.find(obj => {
            return obj.server_id === payload.serverID
        })

        serverobj.device.push({
            type: 'mqtt',
            device_name: payload.deviceName,
            browse_name: payload.browseName,
            host: payload.host,
            port: payload.port,
            topic: payload.topic
        })


        await ua.AddMqttVariable(serverobj.server_object, payload)
        
        wrapper.send(res, 'mqtt data here', 'Your Request Has Been Processed ', 201)
    }catch (err){
        wrapper.send(res, err, 'Error', 500)
    }

    
}

const handleAddVariable = async (req, res) => {
    const payload = {
        serverID : req.body.server_id,
        browseName : req.body.browse_name,
        dataType : req.body.data_type,
        componentOf : req.body.component_of,
        value: req.body.value,   
    }

    if (_.isEmpty(payload, true)) {
        wrapper.send(res, 'Payload cannot be empty', 'Error', 400)
    }

    try{

        serverls = ua.GetServerList()
        serverobj = serverls.find(obj => {
            return obj.server_id === payload.serverID
        })

        ua.AddVariable(serverobj.server_object, payload)

        wrapper.send(res, serverobj.server_object.endpoints[0].endpointDescriptions()[0].endpointUrl, 'Your Request Has Been Processed ', 201)
        
    }catch (err){
        wrapper.send(res, err, 'Error', 500)
    }
}

const AddUAObject = async (req, res) => {
    const payload = {
        serverID : req.body.server_id,
        browseName: req.body.browse_name
    }

    if (_.isEmpty(payload, true)) {
        wrapper.send(res, 'Payload cannot be empty', 'Error', 400)
    }

    try{

        serverls = ua.GetServerList()
        serverobj = serverls.find(obj => {
            return obj.server_id === payload.serverID
        })

        ua.AddObject(serverobj.server_object, payload)

        wrapper.send(res, serverobj.server_object.endpoints[0].endpointDescriptions()[0].endpointUrl, 'Your Request Has Been Processed ', 201)
        
    }catch (err){
        wrapper.send(res, err, 'Error', 500)
    }
}

module.exports = {
    CreateUAServer,
    GetServerList,
    AddUAVariable,
    AddUAObject
}