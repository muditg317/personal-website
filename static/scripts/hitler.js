let gameID = document.querySelector("#gameID").textContent;
let username = document.querySelector("#username").textContent;
let others = document.querySelector("#others").textContent;
let gameJSON = document.querySelector("#gameJSON").textContent;
let game = JSON.parse(gameJSON);
console.log(gameJSON);

handledUpdates = [];

let requestBox = document.querySelector("#requestBox");
let requestIDs = [];



const acceptJoinRequest = (name,requestID) => {
    requestIDs = requestIDs.filter(function(value, index, arr){
        return value != requestID;
    });
    data = {
        type: "ACCEPTJOINRQ",
        accepted: name,
        requestID: requestID
    };
    postHitlerData(data);
}

const handleUpdates = () => {
    pendingUpdates = [];
    game["updates"].forEach( (update) => {
        
    });
}

const handleRequests = () => {
    let pendingIDs = []
    game["requests"].forEach( (request) => {
        let id = request.substring(request.indexOf("ID:")+3);
        pendingIDs.push(id);
        if (request.includes("PENDING:"+username)) {
            let button = document.createElement("BUTTON");
            requestIDs.push(id);
            button.id = "req"+id;
            requestBox.appendChild(button);
            if (request.includes("JOIN")) {
                button.innerText = request.substring(4,request.indexOf("PENDING"));
                button.onclick = (e) => {
                    acceptJoinRequest(button.innerText,id);
                    requestBox.removeChild(button);
                }
            }
        }
    });

    requestIDs.forEach( (id) => {
        if (!pendingIDs.includes(id)) {
            let requestElement = document.querySelector("#req"+id);
            requestBox.removeChild(requestElement);
        }
    });
}

const handleHitlerResult = (text) => {
    console.log(text);
    gameJSON = text;
    game = JSON.parse(gameJSON);
    // console.log(gameJSON);

    handleUpdates();
    handleRequests();

    setTimeout(function () {
        pollHitlerData();
    }, 1000);
}

const pollHitlerData = () => {
    let xhttp = new XMLHttpRequest();
    // let time = 0;
    // let counter = setInterval(function () {
    //     time += 100;
    //     console.log(time);
    // }, 100);
    let url = "/game-lounge/secret-hitler/data";
    let params = xwwwfurlenc({
        secret: "secret hitler is the best game ever",
        type: "UPDATE",
        gameID: gameID,
        username: username
    });
    xhttp.open("GET", url+"?"+params, true);
    xhttp.timeout = 20000;

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            // clearInterval(counter);
            if (this.status == 200) {
                handleHitlerResult(this.responseText);
            }
        }
    };
    xhttp.send(params);
}
pollHitlerData();


const postHitlerData = (json_params) => {
    let xhttp = new XMLHttpRequest();
    let url = "/game-lounge/secret-hitler/data";
    let params = {
        secret: "secret hitler is the best game ever",
        gameID: gameID,
        username: username
    };
    Object.keys(json_params).forEach( (key) => {
        params[key] = json_params[key];
    });
    xhttp.open("POST", url+"?"+xwwwfurlenc(params), true);

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                console.log("data was received");
                console.log(this.responseText);
            }
        }
    };
    xhttp.send(params);
}

const processAndPostHitlerData = () => {
    let data = {
        type: "UPDATE POLICYREMOVE"
    };
    postHitlerData(data);
}


function confirmLeave() {
    console.log("leaving: "+username);
    let xhttp = new XMLHttpRequest();
    let url = "/game-lounge/secret-hitler/data";
    let params = xwwwfurlenc({
        secret: "secret hitler is the best game ever",
        type: "PLAYEREXIT",
        gameID: gameID,
        username: username
    });
    xhttp.open("POST", url+"?"+params, true);
    xhttp.timeout = 20000;
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            // clearInterval(counter);
            if (this.status == 200) {
                console.log(this.responseText);
            }
        }
    };
    xhttp.send(params);
}


let isOnIOS = navigator.userAgent.match(/iPad/i)|| navigator.userAgent.match(/iPhone/i);
let beforeUnloadEvent = isOnIOS ? "pagehide" : "beforeunload";

window.addEventListener(beforeUnloadEvent, confirmLeave);


// let prevKey="";
// window.addEventListener("keydown", function (e) {
//     if (e.key=="F5") {
//         window.onbeforeunload = confirmLeave;
//     }
//     else if (e.key.toUpperCase() == "W" && prevKey == "CONTROL") {
//         window.onbeforeunload = confirmLeave;
//     }
//     else if (e.key.toUpperCase() == "R" && prevKey == "CONTROL") {
//         window.onbeforeunload = confirmLeave;
//     }
//     else if (e.key.toUpperCase() == "F4" && (prevKey == "ALT" || prevKey == "CONTROL")) {
//         window.onbeforeunload = confirmLeave;
//     }
//     prevKey = e.key.toUpperCase();
// });
