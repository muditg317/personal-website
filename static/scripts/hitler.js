let gameID = document.querySelector("#gameID").textContent;
let username = document.querySelector("#username").textContent;
let others = document.querySelector("#others").textContent;
// let gameJSON = document.querySelector("#gameJSON").textContent;
// let game = JSON.parse(gameJSON);
// console.log(gameJSON);

let actionBox = document.querySelector("#actionBox");

let choosePlayerSection = document.querySelector("#choosePlayerDiv > .sectionBox > .choosePlayerSection");
let choosePlayerPrompt = document.querySelector("#choosePlayerDiv > .sectionBox > .choosePlayerSection > p");
let playerButtonBox = document.querySelector("#playerButtonBox");
let handledUpdates = [];

let requestBox = document.querySelector("#requestBox");
let acknowledgedRequestIDs = [];

let playerButtonEvent = (name) => {
    console.log(name);
}


const makeStartButton = () => {
    let startAction = document.querySelector("#startAction");
    if (startAction == null) {
        startAction = document.createElement("DIV");
        startAction.id = "startAction";
        actionBox.appendChild(startAction);
        let startTitle = document.createElement("P");
        startTitle.innerText = "Press to start game. No more players willl be able to join!";
        startAction.appendChild(startTitle);
        let buttonBox = document.createElement("DIV");
        buttonBox.className = "buttonBox";
        let startButton = document.createElement("BUTTON");
        buttonBox.appendChild(startButton);
        startAction.appendChild(buttonBox);
        startButton.className = "hitlerButton";
        startButton.id = "startButton";
        startButton.innerText = "Start!";
        startButton.onclick = (e) => {
            let data = {
                type: "STARTGAME"
            };
            postHitlerData(data);
            actionBox.removeChild(startAction);
        };
    }
}
const handlePlayerJoin = (update, numPlayers) => {
    let name = update.substring(10);
    if (name != username) {
        let button = document.createElement("BUTTON");
        button.className = "playerButton hitlerButton";
        button.id = name;
        button.innerText = name;
        button.onclick = (e) => {
            playerButtonEvent(name);
        };
        playerButtonBox.appendChild(button);
        gameLog(name + " joined the game.");
    } else {
        gameLog("You joined the game!");
    }
    if (numPlayers > 2) {
        makeStartButton();
    }
}

const handleGameStarted = (update) => {
    let name = update.substring(11);
    let startAction = document.querySelector("#startAction");
    if (startAction != null) {
        actionBox.removeChild(startAction);
    }
    if (name != username) {
        gameLog("Game started by: " + name);
    } else {
        gameLog("You started the game");
    }
}

const handleRolesGiven = (update, players) => {
    let me;
    players.forEach( (player) => {
        if (player.username == username) {
            me = player;
        }
    });
    let hitlerIndex;
    let comrades = [];
    players.forEach( (player,index) => {
        if (player.username != username) {
            if (player.party == "fascist") {
                if (player.role == "hitler") {
                    hitlerIndex = index;
                } else {
                    comrades.push(player.username);
                }
            }
        }
    });
    if (me.party == "liberal") {
        gameLog("Welcome liberal! Good luck finding Hitler :)");
    } else if (me.role == "hitler") {
        if (comrades.length == 1) {
            gameLog("Welcome Hitler! "+comrade[0]+" is here to help!");
        } else {
            gameLog("Welcome Hitler! Good luck finding your fascists! Don't die :P");
        }
    } else {
        gameLog("Welcome fascist! Support Hitler, but be ready to sacrifice!");
        if (comrades.length > 1) {
            let welcomeString = "Welcome your comrades:";
            comrades.forEach( (comrade,index) => {
                if (index != 0 && comrades.length != 2) {
                    welcomeString += ",";
                }
                if (index == comrades.length - 1) {
                    welcomeString += " and";
                }
                welcomeString += " "+comrade;
            });
            gameLog(welcomeString+"!");
        }
        gameLog(players[hitlerIndex].username + " is your fearless leader Hitler!");
    }
    gameLog("Now just one of you, tap someone's button to make them the starting president.");
    choosePlayerPrompt.innerText = "Select someone to be the first president:";
    choosePlayerSection.style.display = "";
    playerButtonEvent = (name) => {
        let data = {
            type: "PICKPRESIDENT DOCONFIRM",
            name: name,
        };
        postHitlerData(data);
        choosePlayerSection.style.display = "none";
    };
}

const handlePresidentChosen = (update) => {
    let requestedPresident = update.substring(15,update.indexOf("BY"));
    let picker = update.substring(update.indexOf("BY")+2)
    if (picker == username) {
        gameLog("You requested for " + requestedPresident + " to be president.");
    } else {
        gameLog(picker + " requested for " + requestedPresident + " to be president.");
    }
    choosePlayerPrompt.innerText = "Select a player:";
    choosePlayerSection.style.display = "none";
    playerButtonEvent = (name) => {
        console.log(name);
    }
}

const handlePresidentElected = (update) => {
    let continueAction = document.querySelector("#continueAction");
    if (continueAction != null) {
        actionBox.removeChild(continueAction);
    }
    let newPresident = update.substring(14);
    let presStr = newPresident;
    if (newPresident == username) {
        presStr = "You";
    }
    if (update.includes("BY")) {
        newPresident = newPresident.substring(0,update.indexOf("BY"))
        let picker = update.substring(update.indexOf("BY")+2)
        let pickerStr = picker;
        if (picker == username) {
            pickerStr = "You";
        }
        if (newPresident == username) {
            presStr = "You";
        }
        gameLog(pickerStr + " elected " + presStr.toLowerCase() + " as president.");
    } else {
        if (newPresident == username) {
            presStr += " were";
        } else {
            presStr += " was";
        }
        gameLog(newPresident + " elected as president!");
    }
    if (newPresident == username) {
        gameLog("Choose your chancellor!")
        choosePlayerPrompt.innerText = "Select your chancellor:";
        choosePlayerSection.style.display = "";
        playerButtonEvent = (name) => {
            let data = {
                type: "CHOOSECHANCELLOR",
                chosen: name,
                president: username
            };
            postHitlerData(data);
            choosePlayerSection.style.display = "none";
        }
    } else {
        gameLog(newPresident + " is choosing someone to be chancellor.");
    }
}

const sendVote = (decision, chancellor, president) => {
    let data = {
        type: "VOTE",
        chancellor: chancellor,
        decision: decision,
        president: president
    };
    postHitlerData(data);
}
const handleVoteNow = (update) => {
    let chancellor = update.substring(7,update.indexOf("BY"));
    let president = update.substring(update.indexOf("BY")+2);
    if (chancellor == username) {
        chancellor = "You";
    }
    if (president == username) {
        president = "You";
        choosePlayerSection.style.display = "none";
    }
    gameLog(president + " selected " + chancellor.toLowerCase() + " as chancellor. Vote now!");
    let action = document.createElement("DIV");
    action.className = "action";
    action.id = "voteFor"+update.substring(7,update.indexOf("BY"));
    let title = document.createElement("P");
    title.innerText = president + " choosing " + chancellor.toLowerCase();
    action.appendChild(title);
    let buttonBox = document.createElement("DIV");
    buttonBox.className = "buttonBox";
    action.appendChild(buttonBox);
    let yesButton = document.createElement("BUTTON");
    yesButton.className = "hitlerButton";
    buttonBox.appendChild(yesButton);
    yesButton.className += " voteYes";
    yesButton.innerText = "Ja! (yes)";
    let noButton = document.createElement("BUTTON");
    noButton.className = "hitlerButton";
    buttonBox.appendChild(noButton);
    noButton.className += " voteNo";
    noButton.innerText = "Nein! (no)";

    yesButton.onclick = (e) => {
        sendVote("yes",update.substring(7,update.indexOf("BY")),update.substring(update.indexOf("BY")+2));
        actionBox.removeChild(action);
    }
    noButton.onclick = (e) => {
        sendVote("no",update.substring(7,update.indexOf("BY")),update.substring(update.indexOf("BY")+2));
        actionBox.removeChild(action);
    }
    actionBox.appendChild(action);
}

const handleVoteSent = (update) => {
    let chancellor = update.substring(8,update.indexOf("CHOICE"));
    let vote = update.substring(update.indexOf("CHOICE")+6,update.indexOf("BY"))
    let voter = update.substring(update.indexOf("BY")+2);
    if (chancellor == username) {
        chancellor = "You";
    }
    if (voter == username) {
        voter = "You";
    }
    gameLog(voter + " voted " + vote + " for " + chancellor.toLowerCase() + " as chancellor." + (vote == "yes" ? " Nice!" : " How sad."));
    if (voter == "You") {
        let voteAction = document.querySelector("#voteFor"+update.substring(8,update.indexOf("CHOICE")));
        if (voteAction != null) {
            actionBox.removeChild(voteAction);
        }
    }
}

const handleChancellorElected = (update) => {
    let newChancellor = update.substring(15,update.indexOf("BY"));
    let president = update.substring(update.indexOf("BY")+2);
    let chanceStr = newChancellor + " was";
    let presStr = "president " + president + "'s";
    if (newChancellor == username) {
        chanceStr = "You were";
    }
    if (president == username) {
        presStr = "your";
    }
    gameLog(chanceStr + " voted in as " + presStr + " chancellor.");
    let voteAction = document.querySelector("#voteFor"+newChancellor);
    if (voteAction != null) {
        actionBox.removeChild(voteAction);
    }
}

const handleChancellorFailed = (update) => {
    let newChancellor = update.substring(14,update.indexOf("BY"));
    let president = update.substring(update.indexOf("BY")+2);
    let chanceStr = newChancellor;
    let presStr = "president " + president + "'s";
    if (newChancellor == username) {
        chanceStr = "you";
    }
    if (president == username) {
        presStr = "your";
    }
    gameLog("The democracy does not want " + chanceStr + " to be " + presStr + " chancellor.");
    let voteAction = document.querySelector("#voteFor"+newChancellor);
    if (voteAction != null) {
        actionBox.removeChild(voteAction);
    }
}

const getPoliciesFromSetString = (setString) => {
    let policies = [];
    for (let i = 0; i < setString.length; i++) {
        if (setString.charAt(i) == "L") {
            policies.push("liberal");
        } else {
            policies.push("fascist");
        }
    }
    return policies;
}
const discardPolicy = (policy) => {
    let data = {
        type: "DISCARDPOLICY",
        policy: policy
    };
    postHitlerData(data);
}
const handlePresidentChoosingPolicy = (update) => {
    let president = update.substring(21,update.indexOf("POLICIES"));
    let policies = getPoliciesFromSetString(update.substring(update.indexOf("POLICIES")+8))
    if (president == username) {
        gameLog("You need to pick a policy to discard. These are your policies: " + policies.join(", "));
        let action = document.createElement("DIV");
        action.className = "action";
        action.id = "policyDiscard"
        let title = document.createElement("P");
        title.innerText = "Choose one to discard:";
        action.appendChild(title);
        let buttonBox = document.createElement("DIV");
        buttonBox.className = "buttonBox";
        action.appendChild(buttonBox);
        policies.forEach( (policy) => {
            let button = document.createElement("BUTTON");
            button.className = "hitlerButton";
            buttonBox.appendChild(button);
            button.className += " policy";
            button.innerText = policy;
            button.onclick = (e) => {
                discardPolicy(policy);
                actionBox.removeChild(action);
            }
        });
        actionBox.appendChild(action);
    } else {
        gameLog("The president is choosing a policy to discard now.");
    }
}
const enactPolicy = (policy) => {
    let data = {
        type: "ENACTPOLICY",
        policy: policy
    };
    postHitlerData(data);
}
const handleChancellorChoosingPolicy = (update) => {
    let chancellor = update.substring(22,update.indexOf("POLICIES"));
    let policies = getPoliciesFromSetString(update.substring(update.indexOf("POLICIES")+8))
    if (chancellor == username) {
        gameLog("You need to pick a policy to enact. These are your policies: " + policies.join(", "));
        let action = document.createElement("DIV");
        action.className = "action";
        action.id = "policyEnact";
        let title = document.createElement("P");
        title.innerText = "Choose one to enact:";
        action.appendChild(title);
        let buttonBox = document.createElement("DIV");
        buttonBox.className = "buttonBox";
        action.appendChild(buttonBox);
        policies.forEach( (policy) => {
            let button = document.createElement("BUTTON");
            button.className = "hitlerButton";
            buttonBox.appendChild(button);
            button.className += " policy";
            button.innerText = policy;
            button.onclick = (e) => {
                enactPolicy(policy);
                actionBox.removeChild(action);
            }
        });
        actionBox.appendChild(action);
    } else {
        gameLog("The chancellor is choosing a policy to enact now.");
    }
}

const handlePolicyDiscard = (update) => {
    let president = update.substring(13);
    if (president == username) {
        president = "You"
        let discardAction = document.querySelector("#policyDiscard");
        if (discardAction != null) {
            actionBox.removeChild(discardAction);
        }
    }
    gameLog(president + " discarded a policy.");
}

const handlePolicyPass = (update, forced) => {
    let policy = update.substring(10,update.indexOf("BY"));
    if (forced) {
        policy = policy.substring(7)
    }
    let president = update.substring(update.indexOf("BY")+2,update.indexOf("CHANCE"));
    let chancellor = update.substring(update.indexOf("CHANCE")+6);
    if (forced) {
        gameLog("Three consecutive downvotes caused a policy to be forced. A " + policy + " policy has passed" + (policy == "fascist" ? "; no power will be enacted." : "."));
    } else {
        let chanceStr = chancellor == username ? "You" : chancellor;
        let presStr = president == username ? "your" : ("president " + president + "'s");
        gameLog(chanceStr + " passed a " + policy + " policy as " + presStr + " chancellor");
        if (chancellor == username) {
            let enactAction = document.querySelector("#policyEnact");
            if (enactAction != null) {
                actionBox.removeChild(enactAction);
            }
        }
    }
}

const handleRoundComplete = (update) => {
    let numLiberalPassed = update.substring(13,update.indexOf("FFF"));
    let numFascistPassed = update.substring(update.indexOf("FFF")+3);
    gameLog("Round completed.<br>Liberal policies: " + numLiberalPassed + "<br>Fascist policies: " + numFascistPassed);
    let continueAction = document.querySelector("#continueAction");
    if (continueAction == null) {
        continueAction = document.createElement("DIV");
        continueAction.id = "continueAction";
        actionBox.appendChild(continueAction);
        let continueTitle = document.createElement("P");
        continueTitle.innerText = "Press when done with discussion.";
        continueAction.appendChild(continueTitle);
        let buttonBox = document.createElement("DIV");
        buttonBox.className = "buttonBox";
        let continueButton = document.createElement("BUTTON");
        buttonBox.appendChild(continueButton);
        continueAction.appendChild(buttonBox);
        continueButton.className = "hitlerButton";
        continueButton.id = "continueButton";
        continueButton.innerText = "Next Round";
        continueButton.onclick = (e) => {
            let data = {
                type: "BEGINROUND"
            };
            postHitlerData(data);
            actionBox.removeChild(continueAction);
        };
    }
}


const handleUpdates = (game) => {
    let started = false;
    if (handledUpdates.length > game["updates"].length) {
        document.location.reload(true);
    }
    game["updates"].forEach( (update) => {
        if (update.includes("PLAYERJOIN")) {
            started = false;
        } else if (update.includes("GAMESTARTED")) {
            started = true;
        }
        if (!handledUpdates.includes(update)) {
            if (update.includes("PLAYERJOIN")) {
                handlePlayerJoin(update,game["players"].length);
            } else if (update.includes("GAMESTARTED")) {
                handleGameStarted(update);
            } else if (update.includes("ROLESGIVEN")) {
                handleRolesGiven(update,game["players"]);
            } else if (update.includes("PRESIDENTCHOOSE")) {
                handlePresidentChosen(update);
            } else if (update.includes("PRESIDENTELECT")) {
                handlePresidentElected(update);
            } else if (update.includes("VOTENOW")) {
                handleVoteNow(update);
            } else if (update.includes("VOTESENT")) {
                handleVoteSent(update);
            } else if (update.includes("CHANCELLORELECT")) {
                handleChancellorElected(update);
            } else if (update.includes("CHANCELLORFAIL")) {
                handleChancellorFailed(update);
            } else if (update.includes("PRESIDENTPOLICYCHOOSE")) {
                handlePresidentChoosingPolicy(update);
            } else if (update.includes("POLICYDISCARD")) {
                handlePolicyDiscard(update);
            } else if (update.includes("CHANCELLORPOLICYCHOOSE")) {
                handleChancellorChoosingPolicy(update);
            } else if (update.includes("POLICYPASS")) {
                handlePolicyPass(update,update.includes("FORCED"));
            } else if (update.includes("ROUNDCOMPLETE")) {
                handleRoundComplete(update);
            }
            handledUpdates.push(update);
        }
    });
    if (!started) {
        makeStartButton();
    }
    // console.log(handledUpdates);
}



const acceptJoinRequest = (name,requestID) => {
    acknowledgedRequestIDs.push(requestID);
    let data = {
        type: "ACCEPTJOINRQ",
        accepted: name,
        requestID: requestID
    };
    postHitlerData(data);
}

const acceptPresident = (name,requestID) => {
    acknowledgedRequestIDs.push(requestID);
    let data = {
        type: "ACCEPTPRESIDENT",
        accepted: name,
        requestID: requestID
    };
    postHitlerData(data);
}


const handleRequests = (game) => {
    // let pendingIDs = []
    game["requests"].forEach( (requestString) => {
        let id = requestString.substring(requestString.indexOf("ID:")+3);
        // pendingIDs.push(id);
        if (!requestString.includes("PROCESSED") && !acknowledgedRequestIDs.includes(id)) {
            let existingRequest = document.querySelector("#req"+id);
            if (existingRequest == null) {
                let request = document.createElement("DIV");
                request.className = "request";
                // acknowledgedRequestIDs.push(id);
                request.id = "req"+id;
                let title = document.createElement("P");
                request.appendChild(title);
                let buttonBox = document.createElement("DIV");
                buttonBox.className = "buttonBox";
                request.appendChild(buttonBox);
                let button = document.createElement("BUTTON");
                buttonBox.appendChild(button);
                button.className = "hitlerButton";
                if (requestString.includes("JOIN")) {
                    let name = requestString.substring(4,requestString.indexOf("ID"));
                    title.innerText = name + " wants to join back into your game!";
                    button.className += " allowJoin";
                    button.innerText = "Allow";
                    button.onclick = (e) => {
                        acceptJoinRequest(name,id);
                        requestBox.removeChild(request);
                    }
                    requestBox.appendChild(request);
                } else if (requestString.includes("CONFIRMPRES")) {
                    let requestedPresident = requestString.substring(11,requestString.indexOf("BY"));
                    let picker = requestString.substring(requestString.indexOf("BY")+2)
                    if (picker != username && requestedPresident != username) {
                        title.innerText = picker + " wants " + requestedPresident + " to be president.";
                        button.className += " confirmPres";
                        button.innerText = "Proceed";
                        button.onclick = (e) => {
                            acceptPresident(requestedPresident,id);
                            requestBox.removeChild(request);
                        }
                        requestBox.appendChild(request);
                    }
                }
            }
        } else {
            id = id.substring(0,id.indexOf("PROCESSED"));
            let existingRequest = document.querySelector("#req"+id);
            if (existingRequest != null) {
                requestBox.removeChild(existingRequest);
            }
        }
    });

    // acknowledgedRequestIDs.forEach( (id) => {
    //     if (!pendingIDs.includes(id)) {
    //         let requestElement = document.querySelector("#req"+id);
    //         if (requestElement != null) {
    //             requestBox.removeChild(requestElement);
    //         }
    //     }
    // });
}




const handleHitlerResult = (text) => {
    // console.log(text);
    let gameJSON = text;
    let game = JSON.parse(gameJSON);
    // console.log("updates", game["updates"]);
    // console.log("requests", game["requests"]);

    handleUpdates(game);
    handleRequests(game);

    setTimeout(function () {
        pollHitlerData();
    }, 2000);
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




const gameLog = (message) => {
  let logDiv = document.querySelector("#gameLog");
  logDiv.innerHTML += '<p>&gt;&nbsp;' + message + '</p>';
  logDiv.scrollTop = logDiv.scrollHeight;
};
