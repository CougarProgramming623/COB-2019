
// const remote = require('electron').remote;
const ipc = require('electron').ipcRenderer;

let addresses = {
    location : {
        rotation: "/cob/location/rotation",
    },
    fms: {
        timeLeft: "/cob/fms/time-left",
        isRed: "/FMSInfo/IsRedAlliance",
    },
    mode: "/cob/mode", //0 = Field Orient, 1 = Robot Orient, 2 = Auto, 3 = Vision, 4 = Climb, 5 = Disabled
    flywheel: {
        wu: "/cob/flywheel/wu",
        flywheelImage: "/cob/flywheel/image",
        set: "cob/flywheel/set",
    },
    auto: "/cob/auto/in-use",
    currentDelay: "/cob/auto/current-delay",
    canVision: "/limelight/tv",
    cobCheck: "/cob/cob-check",
};

let messages = {
    cob : {
        ping: "/cob/messages/cob/ping",
        receiveAuto: "/cob/messages/cob/receiveAuto",
    },
    roborio : {
        gnip: "/cob/messages/roborio/gnip",
        gyroReset: "/cob/messages/roborio/gyroReset",
        setAuto: "/cob/messages/roborio/setAuto",
        autoDelay: "/cob/messages/roborio/delay",
        removeLemon: "/cob/messages/roborio/removeLemon",
        requestAuto: "/cob/messages/roborio/requestAuto",
    }
};

function initAllDatapoints(){
    NetworkTables.putValue(addresses.location.rotation, 0);
    NetworkTables.putValue(addresses.fms.timeLeft, 135);
    NetworkTables.putValue(addresses.fms.isRed, false);
    NetworkTables.putValue(addresses.mode, 5);
    NetworkTables.putValue(addresses.flywheel.wu, 0);
    NetworkTables.putValue(addresses.flywheel.flywheelImage, false);
    NetworkTables.putValue(addresses.auto, "unknown");
    NetworkTables.putValue(addresses.currentDelay, 0);
    NetworkTables.putValue(addresses.canVision, 0);
    NetworkTables.putValue(addresses.cobCheck, 0);
    NetworkTables.putValue(addresses.flywheel.set, 0);
}

let ui = {
    rotation : document.getElementById('rotation'),
    timeLeft: document.getElementById('timeLeft'),
    timer: {
        canvas : document.getElementById('timer'),
        mode : document.getElementById("robot-mode"),
    },
    robot: {
        image : document.getElementById('robot'),
        gyroReset : document.getElementById('gyroreset'),
        wu : document.getElementById('flywheel-wu'),
        set : document.getElementById('flywheel-set'),
        flywheelImage : document.getElementById("flywheel-img"),
        flywheelImageOff : document.getElementById("flywheeloff-img"),
        lemon : document.getElementById("lemons-img"),
        lemonButton : document.getElementById("lemon-button"),
        autoToggle : document.getElementById("auto-toggle"),
        autoDelay : document.getElementById("auto-delay"),
        currentDelay : document.getElementById("current-delay"),
        submitDelay : document.getElementById("submit-delay"),
        cobCheckDiv : document.getElementById("cob-check"),
    },
	connecter: {
		address: document.getElementById('connect-address'),
        connect: document.getElementById('connect'),
        login: document.getElementById('login'),
	}
};

/*ui.robot.defaultAuto.style.display = "none";
ui.robot.fancyAuto.style.display = "none";
ui.robot.safeAuto.style.display = "none";*/

NetworkTables.addRobotConnectionListener(onRobotConnection, false);

function onRobotConnection(connected) {
	const state = connected ? 'Robot connected!' : 'Robot disconnected.';
	let address = ui.connecter.address;
	let connect = ui.connecter.connect;
	console.log(state);
	// ui.robotState.data = state;
	if (connected) {
        initAllDatapoints();

		// On connect hide the connect popups
        login.style.width = "0%";
        fullRender()
	} else {
        login.style.width = "100%";

        // login.style.display = "block"

		// Add Enter key handler
		console.log("robot connection changed:" + state);
		address.onkeydown = ev => {
			if (ev.key === 'Enter') {
				connect.click();
			}
		};
		// Enable the input and the button
		address.disabled = false;
		// connect.disabled = false;
		connect.firstChild.data = 'Connect';
		// CHANGE THIS VALUE TO YOUR ROBOT'S IP ADDRESS
	// address.value = 'roborio-62X-frc.local';
        address.value = '10.6.2X.2';
		address.focus();
        address.setSelectionRange(6,7);

		// On click try to connect and disable the input and the button
		connect.onclick = () => {
            console.log("connect button clicked");
            if(connect.firstChild.data == 'Connect'){
                ipc.send('connect', address.value);
                address.disabled = true;
                // connect.disabled = true;
                connect.firstChild.data = 'Connecting';
            }else if(connect.firstChild.data == 'Connecting'){
                ipc.send('stop-connect');
                address.disabled = false;
                connect.disabled = false;
                connect.firstChild.data = 'Connect'
            }
		};
	}
}

function fullRender(){
    renderTimer();
    renderRobot();
}

ui.robot.gyroReset.onclick = () => {
    console.log("NavX Reset");
    sendMessage("gyroReset", 'true');
}

console.sendNewWait  = () => {
    sendMessage("delay", '' + ui.robot.autoDelay.value);
    return false;
}

ui.robot.lemonButton.onclick = () => {
    console.log("Removing Lems");
    sendMessage("removeLemon", "wedonttakekindlytoyourlemonsaroundhere")
}

/*ui.robot.autoToggle.onclick = () => {
    console.log("Auto Toggled On")
    const mode = (ui.robot.defaultAuto.style.display === "block") ? "none" : "block";
    ui.robot.defaultAuto.style.display = mode;
    ui.robot.fancyAuto.style.display = mode;
    ui.robot.safeAuto.style.display = mode;
}*/

/*function onAutoChange(){
    const auto = NetworkTables.getValue('' + addresses.auto);
    console.log("Auto equals: " + auto);
    if (auto === "default") {
        ui.robot.defaultAuto.style.color = "green";
        ui.robot.fancyAuto.style.color = "black";
        ui.robot.safeAuto.style.color = "black";
    } else if (auto === "fancy") {
        ui.robot.defaultAuto.style.color = "black";
        ui.robot.fancyAuto.style.color = "green";
        ui.robot.safeAuto.style.color = "black";
    } else if (auto === "safe") {
        ui.robot.defaultAuto.style.color = "black";
        ui.robot.fancyAuto.style.color = "black";
        ui.robot.safeAuto.style.color = "green";
    }
}*/

/*ui.robot.safeAuto.onclick = () => {
    sendMessage("setAuto", "safe")
}

ui.robot.fancyAuto.onclick = () => {
    sendMessage("setAuto", "fancy")
}

ui.robot.defaultAuto.onclick = () => {
    sendMessage("setAuto", "default")
}*/


function setUpAllAuto(routes){
    routes.forEach(item =>  {
        if(document.getElementById(item) !== undefined) continue;
        const routes = document.createElement("button");
        const div = document.getElementById("auto-routes")
        routes.classList.add("route-button");
        console.log(item);
        routes.id = item;
        routes.innerText = item
        div.appendChild(routes)
        routes.onclick  = () => {
            sendMessage("setAuto", item)
        }
        document.getElementById(item).style.display = "none"
    })
}
ui.robot.autoToggle.onclick = () => {
    console.log("Auto Toggled On")
    sendMessage("requestAuto", "true")
}

function onAutoChange(){
    const auto = NetworkTables.getValue('' + addresses.auto);
    console.log("Auto equals: " + auto);
    document.getElementsByClassName("route-button").forEach(findCurrentAuto)
}

function findCurrentAuto (item){
    const auto = NetworkTables.getValue('' + addresses.auto);
    if (auto === item.id) {
        console.log(item + " is selected")
        item.style.color = "green"
    } else {
        console.log(item + " is not selected")
        item.style.color = "black"
    }
}


function toggleAuto () {
    document.getElementsByClassName("route-button").forEach(item => {
        const mode = (item.style.display === "block") ? "none" : "block";
        document.getElementById(item).style.display = mode;
    });
}

function renderRobot(){
    console.log("rendering robot");
    if(!NetworkTables.isRobotConnected()){
        //if not connected, we can't render this - just to be safe
        return
    }

    let currentDelayD = NetworkTables.getValue('' + addresses.currentDelay);
    ui.robot.currentDelay.innerText = ("Current Delay: " + currentDelayD);

    let angle = NetworkTables.getValue('' + addresses.location.rotation);
    angle = (angle + 360) % 360;
    ui.robot.image.style.transform = "rotate("+ angle +"deg)"

    let flywheelStatus = NetworkTables.getValue('' + addresses.flywheel.flywheelImage);
    ui.robot.wu.innerText = NetworkTables.getValue('' + addresses.flywheel.wu);
    if (flywheelStatus === true){
        ui.robot.flywheelImage.style.opacity = 1
        ui.robot.flywheelImageOff.style.opacity = 0      
    }else if (flywheelStatus === false){
        //ui.robot.wu.innerText = 0;
        ui.robot.flywheelImageOff.style.opacity = 1      
        ui.robot.flywheelImage.style.opacity = 0
    }

}

function renderTimer(){
    
    if(!NetworkTables.isRobotConnected()){
        //if not connected, we can't render this - just to be safe
        return
    }
    //Mode Identifier
    let mode = NetworkTables.getValue('' + addresses.mode);
    console.log("mode: " + mode);
    if (mode === 0){
        ui.timer.mode.innerText = "Field Oriented";
    }else if (mode === 1){
        ui.timer.mode.innerText = "Robot Oriented";
    }else if (mode === 2){
        ui.timer.mode.innerText = "Auto";
    }else if (mode === 3){
        ui.timer.mode.innerText = "Vision";
    }else if (mode === 4){
        ui.timer.mode.innerText = "Climb";
    }else if (mode === 5){
        ui.timer.mode.innerText = "Disabled";
    } else {
        console.log("mode is not a valid value: " + mode)
    }

    if(ui.timer.canvas == null){
        console.log("unable to render timer due to contnt undefined");
        return
    }
    // console.log("called renderTimer()")
    let time = NetworkTables.getValue('' + addresses.fms.timeLeft);
    //console.log(time);
    time = Math.floor(time);
    let isRed = NetworkTables.getValue('' + addresses.fms.isRed);
    if(isRed == 'true'){
        isRed = true;
    }
    let ct = ui.timer.canvas.getContext("2d");
    let max = ui.timer.canvas.width;
    ct.fillStyle = 'rgba(0,0,0,0)';//transparency
    let isFlashing = time <= 45 && time % 2 === 1 && NetworkTables.getValue("" + addresses.mode) <= 1;
    ct.fillRect(0, 0, max, max);
    if (isFlashing){ 
        ct.fillStyle = '#F4D03F';
    }else{
        ct.fillStyle = (isRed)? 'red': 'blue';
    }
    ct.beginPath();
    ct.arc(max/2,max/2, max/2, 0, 2 * Math.PI);
    ct.fill();
    let amountToFill = time / 135.0;//2 minutes 15 seconds
    if (mode === 2){
        amountToFill = time / 15.0//15 second auto
    }
    let archToFill = amountToFill * (2 * Math.PI);//amountToFill should be 0 <= x <= 1 so this should fall under 0 <= x <= (2*PI)
    if (isFlashing){ 
        ct.fillStyle = '#D4AC0D';
    }else{
        ct.fillStyle = (isRed)? 'darkRed': 'darkBlue';
    }
    ct.beginPath();
    ct.moveTo(max/2,max/2);
    ct.arc(max/2,max/2, max/2, 0, archToFill);
    ct.moveTo(max/2,max/2);
    ct.fill();

    //do the text
    ct.font = "75px Monospace";
    ct.fillStyle = 'white';
    ct.textAlign = "center";

    let seconds = '' + Math.floor(time%60);
    if (seconds.length === 1){
        seconds = '0' + seconds
    }
    if (time === -1) {
        let text = "no"
        ct.fillText(text, max/2, max/2+20);
    }else {
        let text = '' + Math.floor(time/60) + ':' + seconds;
        ct.fillText(text, max/2, max/2+20);
    }
    //ct.fillText(text, max/2, max/2+20);//30px text, 15px ajustment?

    // console.log(NetworkTables.getValue('' + addresses.robot.isField))
}

function addNetworkTables(){

    NetworkTables.addKeyListener('' + addresses.fms.timeLeft,()=>{
        renderTimer();
    },false);

    NetworkTables.addKeyListener('' + addresses.canVision,()=>{
        console.log("did stuff");
        if (NetworkTables.getValue(addresses.canVision) === 1) {
            document.body.style.backgroundColor = "rgb(150, 0, 32)";
        } else {
            document.body.style.backgroundColor = "white";
        }
    });

    NetworkTables.addKeyListener('' + addresses.location.rotation,()=>{
        renderRobot();
    });

    NetworkTables.addKeyListener('' + addresses.fms.isRed,()=>{
        renderTimer();
    });
    NetworkTables.addKeyListener('' + addresses.mode,()=>{
        renderTimer();
    });
    NetworkTables.addKeyListener('' + addresses.currentDelay,()=>{
        renderRobot();
        console.log("Updated Auto Delay")
    });
    NetworkTables.addKeyListener('' + addresses.flywheel.wu,()=>{
        renderRobot();
    });
    NetworkTables.addKeyListener('' + addresses.flywheel.flywheelImage,()=>{
        renderRobot();
    });
    NetworkTables.addKeyListener('' + addresses.auto,()=>{
        onAutoChange();
        renderRobot();
    });
    NetworkTables.addKeyListener('' + addresses.flywheel.set,()=>{
        renderRobot();
        ui.robot.set.innerText = NetworkTables.getValue('' + addresses.flywheel.set);
    });
    NetworkTables.addKeyListener('' + addresses.cobCheck,()=>{
       ui.robot.cobCheckDiv.innerText = NetworkTables.getValue(addresses.cobCheck);
    });
    setMessageListener("ping", (value) => { 
        console.log("Handshake:" + value);
    } );
    setMessageListener("gyroReset-ack", (value) => {
        console.log(value);
        //sendMessage("gyroReset", false);
    })
    setMessageListener("receiveAuto", (value) => {
        console.log(value)  
        //"route 1, route 2, route 3"
        const availableRoutes = value.split(", ")
        setUpAllAuto(availableRoutes);
        availableRoutes.forEach(toggleAuto);
    })
}

function setMessageListener(path, func) {
    NetworkTables.addKeyListener('/cob/messages/cob/' + path,(key,value)=>{
        func(value);
        NetworkTables.delete(key);
    });
}

function sendMessage(path, value){
    console.log("sending message: " + path + ":" + value);
    NetworkTables.putValue('/cob/messages/roborio/' + path, value);
}

sendMessage("gnip", "Hello")
console.log("Sent Message")

addNetworkTables();
fullRender();