const uaserver = require('./ua')
const opcua = require('node-opcua')

let ServerList = []

async function CreateNewServer(payload) {
    // const svc = new uaserver.UAServer(payload.id, payload.port, payload.productname, payload.buildnumber)
    // console.log(svc)
    
    // await svc.Init()

    // post_initialize(svc.server)

    // await svc.StartServer()
   
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
    
    post_initialize(server)

    await server.start()

    ServerList.push({
        server_object : server,
        server_id : payload.id,
    })

    return server 
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

function AddObject(server, payload) {
    const addressSpace = server.engine.addressSpace;
    const namespace = addressSpace.getOwnNamespace();

    namespace.addObject({
        organizedBy: addressSpace.rootFolder.objects,
        browseName: payload.browseName
    });
}

function post_initialize(server) {
    function construct_my_address_space(server) {
    
        const addressSpace = server.engine.addressSpace;
        const namespace = addressSpace.getOwnNamespace();
        
        // declare a new object
        const device = namespace.addObject({
            organizedBy: addressSpace.rootFolder.objects,
            browseName: "MyDevice"
        });
    
        // add some variables
        // add a variable named MyVariable1 to the newly created folder "MyDevice"
        let variable1 = 1;
        
        // emulate variable1 changing every 500 ms
        setInterval(function(){  variable1+=1; }, 500);
        
        namespace.addVariable({
            componentOf: device,
            browseName: "MyVariable1",
            dataType: "Double",
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Double, value: variable1 });
                }
            }
        });
        
        // add a variable named MyVariable2 to the newly created folder "MyDevice"
        let variable2 = 10.0;
        
        namespace.addVariable({
        
            componentOf: device,
        
            nodeId: "ns=1;b=1020FFAA", // some opaque NodeId in namespace 4
        
            browseName: "MyVariable2",
        
            dataType: "Double",    
        
            value: {
                get: function () {
                    return new opcua.Variant({dataType: opcua.DataType.Double, value: variable2 });
                },
                set: function (variant) {
                    variable2 = parseFloat(variant.value);
                    return opcua.StatusCodes.Good;
                }
            }
        });
        const os = require("os");
        /**
         * returns the percentage of free memory on the running machine
         * @return {double}
         */
        function available_memory() {
            // var value = process.memoryUsage().heapUsed / 1000000;
            const percentageMemUsed = os.freemem() / os.totalmem() * 100.0;
            return percentageMemUsed;
        }
        namespace.addVariable({
        
            componentOf: device,
        
            nodeId: "s=free_memory", // a string nodeID
            browseName: "FreeMemory",
            dataType: "Double",    
            value: {
                get: function () {return new opcua.Variant({dataType: opcua.DataType.Double, value: available_memory() });}
            }
        });
    }
    construct_my_address_space(server);
}

module.exports = {
    CreateNewServer,
    GetServerList,
    AddVariable,
    AddObject
}