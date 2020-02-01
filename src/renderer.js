
// const remote = require('electron').remote;
const ipc = require('electron').ipcRenderer;
var memoize = require("memoizee");

let addresses = {
    location : {
        rotation: "/cob/location/rotation",
    },
    fms: {
        timeLeft: "/cob/fms/time-left",
        isRed: "/FMSInfo/IsRedAlliance",
    },
    
    mode: "/cob/mode", //0 = Field Orient, 1 = Robot Orient, 2 = Auto, 3 = Vision, 4 = Climb, 5 = Disabled
};

let messages = {
    cob : {
        ping: "/cob/messages/cob/ping"
    }
};

function initAllDatapoints(){
    NetworkTables.putValue(addresses.location.rotation, 0);
    NetworkTables.putValue(addresses.fms.timeLeft, 135);
    NetworkTables.putValue(addresses.fms.isRed, false);
    NetworkTables.putValue(addresses.mode, 5);
    //NetworkTables.putValue(addresses.actions.gyroReset, false);
    NetworkTables.putValue(messages.ping, null)
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
        //button : document.getElementById('gyroreset'),
    },
	connecter: {
		address: document.getElementById('connect-address'),
        connect: document.getElementById('connect'),
        login: document.getElementById('login'),
	}
};

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

function renderRobot(){
    console.log("rendering robot");
    if(!NetworkTables.isRobotConnected()){
        //if not connected, we can't render this - just to be safe
        return
    }

    let angle = NetworkTables.getValue('' + addresses.location.rotation);
    angle = (angle + 360) % 360;
    ui.robot.image.style.transform = "rotate("+ angle +"deg)"
}

function renderTimer(){
    
    if(!NetworkTables.isRobotConnected()){
        //if not connected, we can't render this - just to be safe
        return
    }
    //Mode Identifier
    let mode = NetworkTables.getValue('' + addresses.mode, 6);
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
    let text = '' + Math.floor(time/60) + ':' + seconds;
    ct.fillText(text, max/2, max/2+20);//30px text, 15px ajustment?

    // console.log(NetworkTables.getValue('' + addresses.robot.isField))
}

function addNetworkTables(){

    NetworkTables.addKeyListener('' + addresses.fms.timeLeft,()=>{
        renderTimer();
    },false);

    NetworkTables.addKeyListener('' + addresses.location.rotation,()=>{
        renderRobot();
    });

    NetworkTables.addKeyListener('' + addresses.fms.isRed,()=>{
        renderTimer();
    });
    NetworkTables.addKeyListener('' + addresses.mode,()=>{
        renderTimer();
    });
    setMessageListener("ping", (value) => console.log("message from robot:" + value));

}

function setMessageListener(path, func) {
    NetworkTables.addKeyListener('/cob/messages/cob/' + path,(key,value)=>{
        func(value);
        NetworkTables.delete(key);
    });
}

addNetworkTables();
fullRender();