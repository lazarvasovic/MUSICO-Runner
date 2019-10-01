# MUSICO Runner API

In this document you can find definitions and explanations of every route that MUSICO Runner uses. With that knowledge, it is possible to call its routes from any other applications and run MUSICO simulations. That routes are given in further text. If you want to run MUSICO Runner on your own server, that instructions are given too.

## Routes

### Create, upload and run simulations

If you want to run MUSICO calculations with this API, you must know the file/folder structure of those calculations. One MUSICO calculation (which includes all input files needed to successfully start calculation) must be inside some folder. If you want to run many calculations, you will need to place each calculation's input files inside its own folder. For example, if you want to run 5 calculations, you will need 5 different folders which contain input files for MUSICO. When you make file/folder structure as it was described above, then you have to compress all the folders into one ZIP file. (it cannot be .rar or .tar.gz or any other format). Now, that zip file can be uploaded to MUSICO Runner in order to run simulations. It is also possible to upload more than one ZIP file if you want to run more groups of simulations (each group contains of many simulations).

With this API, process of running calculations consists of 3 parts. First part is calculations creation, second is upload calculations and final part is run calculations. In further text will be given routes and descriptions for all 3 parts.

1. **Calculations creation** : this is **post** type route. It is on address: host:port **/api/calcs/create** where host is address of MUSICO Runner host. Currently port is **3000**. First parameter that this route needs is array of names (list of strings) of all **ZIP** files that you want to upload at once. This refers to run many group simulations. Each element of that array is name of one ZIP file. Name of this parameter is **calcs**. Name of second parameter that this route needs is **apiUser** and its value is always **true** (Boolean). This route returns JSON object that consists of 2 fields. First field is **success** which can have value true or false. Second field is **calcIds** which is array of group calculations ids. For example, you want to run 3 group calculations that are compressed in **GC1.zip** , **GC2.zip** , **GC3.zip**. Parameter **calcs** will have value **[GC1.zip, GC2.zip, GC3.zip]**. Return value will be **{success: True, calcIds: [**idOfGC1, idOfGC2, idOfGC3**]}**. You need to save group calculation names and group calculation IDs because they are used in other routes.

**Request example** :

    curl -d '{"calcs":["GC1.zip","GC2.zip","GC3.zip"], 
    "apiUser": true}' -H "Content-Type: application/json" -X POST HOSTNAME:3000/api/calcs/create    

**Response value** :

    {"success":true,"calcIds":["5d769a3505f42c050e8c9581","5d769a3505f42c050e8c9582","5d769a3505f42c050e8c9583"]}

1. **Upload calculations** : this is **post** type route. It is on address: host:port **/api/calcs/upload**. This route needs to receive array of ZIP files where each ZIP file is one group calculation. Name of this parameter is **zipFile[]**. This route returns JSON object that consists of 2 fields. First field is **success** which can have value true or false. Second field is **upload** and its value is always **OK**.

**Request example:** 

    curl -F 'zipFile[]=@/mnt/d/GC1.zip' -F 'zipFile[]=@/mnt/d/GC2.zip' -F 'zipFile[]=@/mnt/d/GC3.zip' HOSTNAME:3000/api/calcs/upload

**Response value:** 

    {"success":true,"upload":"OK"}

1. **Run calculations** : this is **post** type route. It is on address: host:port **/api/calcs/run**. This route needs to receive array of calculation's IDs (return value of /create route). Name of this parameter is **calcIds**. Name of second parameter that this route needs is **apiUser** and its value is always **true** (Boolean). This route returns JSON object that consists of 2 fields. First field is **success** which can have value true or false. Second field is not important.

**Request example:** 

    curl -d '{"calcIds":["5d769a3505f42c050e8c9581","5d769a3505f42c050e8c9582","5d769a3505f42c050e8c9583"], "apiUser": true}' -H "Content-Type: application/json" -X POST HOSTNAME:3000/api/calcs/run

**Response value:** 

    {"success":true,"runData": …}

In order to run some MUSICO simulations, you need to call those 3 routes in the same exact order as it's showed above.

### Simulation info

To see information about calculations that you ran, you have to send **post** request to route host:port **/api/calcs/get-units**. Parameter that this route receives is calculation ID named **calcId**. This is the ID of one group calculation (return value of route /create). Name of second parameter that this route needs is **apiUser** and its value is always **true** (Boolean). This route returns JSON object that consists of 2 fields. First field is **success** which can have value true or false. Second field is named **units** and it consists of fields like name, startTime, endTime, progress, jobId (this is ID of job that's running on cluster).

**Request example:** 

    curl -d '{"calcId":"5d769a3505f42c050e8c9581", "apiUser": true}' -H "Content-Type: application/json" -X POST HOSTNAME:3000/api/calcs/get-units

**Response value:** 

    {"success":true,"units":[{"startTime":"2019-09-09T18:30:53.599Z","endTime":null,"pathToResults":"5d769a3505f42c050e8c9581/00\_Ca\_1.0e-09","progress":16,"jobId":"223382","\_id":"5d769a5d05f42c050e8c9587","name":"00\_Ca\_1.0e-09","status":"running","index":0,"calculation":"5d769a3505f42c050e8c9581","\_\_v":0},{"startTime":"2019-09-09T18:30:53.599Z","endTime":null,"pathToResults":"5d769a3505f42c050e8c9581/01\_Ca\_1.0e-08","progress":16,"jobId":"223384","\_id":"5d769a5d05f42c050e8c9588","name":"01\_Ca\_1.0e-08","status":"running","index":1,"calculation":"5d769a3505f42c050e8c9581","\_\_v":0},{"startTime":"2019-09-09T18:30:53.599Z","endTime":null,"pathToResults":"5d769a3505f42c050e8c9581/02\_Ca\_1.0e-07","progress":16,"jobId":"223385","\_id":"5d769a5d05f42c050e8c9589","name":"02\_Ca\_1.0e-07","status":"running","index":2,"calculation":"5d769a3505f42c050e8c9581","\_\_v":0}]}

### Download results of simulations

If you want to download results of one of yours group calculations, you need to send **post** request to route host:port **/api/calcs/download-calc**. Parameter that this route receives is calculation ID named **calcId**. This is the ID of one group calculation (return value of route /create). Name of second parameter that this route needs is **apiUser** and its value is always **true** (Boolean). This route returns ZIP file with results of your simulations.

**Request example:** 

    curl -d '{"calcId":"5d769a3505f42c050e8c9581", "apiUser": true}' -H "Content-Type: application/json" -X POST HOSTNAME:3000/api/calcs/download-calc --output /mnt/d/download.zip

### Remove simulations

If you want to delete your simulations, you need to send **post** request to route host:port **/api/calcs/remove-calc**. Parameter that this route receives is calculation ID named **calcId**. This is the ID of one group calculation (return value of route /create). Name of second parameter that this route needs is **apiUser** and its value is always **true** (Boolean). This route returns JSON object that consists of 2 fields. First field is **success** which can have value true or false. Second field is **err** and its value is **null** if everything is right.

**Request example:** 

    curl -d '{"calcId":"5d769a3505f42c050e8c9581", "apiUser": true}' -H "Content-Type: application/json" -X POST HOSTNAME:3000/api/calcs/remove-calc

**Response value:** 

    {"success":true,"err":null}

## Run MUSICO Runner on another server

In order to run this application on your own server, you will need to provide few steps.

1. Install NodeJS. Version is node-v10.15.0-linux-x64.
2. Install NPM (node package manager).
3. Download MUSICO Runner somewhere at your host machine. You can download app from this [link](https://github.com/lazarvasovic/MUSICO-Runner.git).
4. Execute "**npm install**" command inside root directory of application.

If you did all these steps, now you can run application using command **node app.js** , but first you have to be in root directory of application.

Note: If you have troubles installing NodeJS or NPM, there are portable versions of these two components given in project on GitHub. That means that you don't even have to install NodeJS and NPM.
