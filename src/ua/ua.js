const opcua = require('node-opcua')

// class UAServer{
//     constructor (ID, port, productname, buildnumber) {
//         this.ID = ID
//         this.server = new opcua.OPCUAServer({
//             port: port, // the port of the listening socket of the servery
//             resourcePath: "/ua/server", // this path will be added to the endpoint resource name
//             buildInfo: {
//               productName: productname,
//               buildNumber: buildnumber,
//               buildDate: new Date(),
//             }
//         });
         
//         this.addressSpace = this.server.engine.addressSpace;
//         this.namespace = this.addressSpace.getOwnNamespace();
//         this.objectsFolder = this.addressSpace.rootFolder.objects;
        
//     }

//     async Init(){
//         await this.server.initialize()
//     }

//     async StartServer(){
//         await this.server.start()
//     }

//     AddNode(browsename){
//         return this.namespace.addFolder(this.objectsFolder, {browseName:browsename})
//     }

//     GetNodeByName(name){
//         return this.objectsFolder.getFolderElementByName(name)
//     }

//     AddVariableNode(parent, browsename, nodeID, datatype, value){
//         this.namespace.addVariable({
//             componentOf: parent,
//             browseName: browsename,
//             nodeId: nodeID,
//             dataType: datatype,
//             value: { get: function () {value()}}
//         })
//     }
// }

// module.exports = UAServer
