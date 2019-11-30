let createForm = document.forms["createHitler"];
let joinForm = document.forms["joinHitler"];


const attemptJoin = () => {
    let gameIDField = joinForm["gameID"];
    let usernameField = joinForm["username"];
    let gameID = gameIDField.value;
    if (gameID == "") {
        gameIDField.focus();
        return;
    }
    let username = usernameField.value;
    if (username == "") {
        usernameField.focus();
        return;
    }
    let xhttp = new XMLHttpRequest();
    let url = "/game-lounge/secret-hitler/data";
    let params = xwwwfurlenc({
        secret: "secret hitler is the best game ever",
        type: "JOIN",
        gameID: gameID,
        username: username
    });
    xhttp.open("POST", url+"?"+params, true);
    xhttp.timeout = 20000;


    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                console.log(this.responseText);
                if (this.responseText == "SUCCESS") {
                    setTimeout(() => {
                        window.location.href = "/game-lounge/secret-hitler?" + xwwwfurlenc({
                            gameID: gameID,
                            username: username
                        });
                    }, 500);
                } else if (this.responseText.includes("There is already a player")) {
                    joinForm["otherUser"].type = "text"
                    joinForm["submit"].onclick = function(e) {
                        attemptForceJoin();
                    };
                }
            }
        }
    };
    xhttp.send(params);
}

const attemptForceJoin = () => {
    let gameIDField = joinForm["gameID"];
    let usernameField = joinForm["username"];
    let otherUserField = joinForm["otherUser"];
    let gameID = gameIDField.value;
    if (gameID == "") {
        gameIDField.focus();
        return;
    }
    let username = usernameField.value;
    if (username == "") {
        usernameField.focus();
        return;
    }
    let otherUser = otherUserField.value;
    if (otherUser == "") {
        attemptJoin();
        return;
    }
    let xhttp = new XMLHttpRequest();
    let url = "/game-lounge/secret-hitler/data";
    let params = xwwwfurlenc({
        secret: "secret hitler is the best game ever",
        type: "FORCE JOIN",
        gameID: gameID,
        username: username,
        otherUser: otherUser
    });
    xhttp.open("POST", url+"?"+params, true);
    xhttp.timeout = 20000;

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                console.log(this.responseText);
                if (this.responseText == "SUCCESS") {
                    setTimeout(() => {
                        window.location.href = "/game-lounge/secret-hitler?" + xwwwfurlenc({
                            gameID: gameID,
                            username: username
                        });
                    }, 500);
                }
            }
        }
    };
    xhttp.send(params);
}

let acceptInterval;
const pollAccept = (gameID,name) => {
    let xhttp = new XMLHttpRequest();
    let url = "/game-lounge/secret-hitler/data";
    let params = xwwwfurlenc({
        secret: "secret hitler is the best game ever",
        type: "QUERY DISPLAYED",
        gameID: gameID,
        username: name
    });
    xhttp.open("GET", url+"?"+params, true);
    xhttp.timeout = 20000;

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                if (this.responseText == "SUCCESS") {
                    clearInterval(acceptInterval);
                    setTimeout(() => {
                        window.location.href = "/game-lounge/secret-hitler?" + xwwwfurlenc({
                            gameID: gameID,
                            username: name
                        });
                    }, 500);
                } else {
                    console.log("not accepted yet :(");
                }
            }
        }
    };
    xhttp.send(params);
};

const requestJoin = () => {
    let gameIDField = joinForm["gameID"];
    let usernameField = joinForm["username"];
    let gameID = gameIDField.value;
    if (gameID == "") {
        gameIDField.focus();
        return;
    }
    let username = usernameField.value;
    if (username == "") {
        usernameField.focus();
        return;
    }
    let xhttp = new XMLHttpRequest();
    let url = "/game-lounge/secret-hitler/data";
    let params = xwwwfurlenc({
        secret: "secret hitler is the best game ever",
        type: "JOIN REQUEST",
        gameID: gameID,
        username: username
    });
    xhttp.open("POST", url+"?"+params, true);
    xhttp.timeout = 20000;

    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                console.log(this.responseText);
                if (this.responseText == "SUCCESS") {
                    setTimeout(() => {
                        window.location.href = "/game-lounge/secret-hitler?" + xwwwfurlenc({
                            gameID: gameID,
                            username: username
                        });
                    }, 500);
                } else {
                    acceptInterval = setInterval(function () {
                        pollAccept(gameID,username);
                    }, 1000);
                }
            }
        }
    };
    xhttp.send(params);
}


const attemptCreate = () => {
    let gameIDField = createForm["gameID"];
    let usernameField = createForm["username"];
    let gameID = gameIDField.value;
    if (gameID == "") {
        gameIDField.focus();
        return;
    }
    let username = usernameField.value;
    if (username == "") {
        usernameField.focus();
        return;
    }
    let xhttp = new XMLHttpRequest();
    let url = "/game-lounge/secret-hitler/data";
    let params = xwwwfurlenc({
        secret: "secret hitler is the best game ever",
        type: "CREATE",
        gameID: gameID,
        username: username
    });
    xhttp.open("POST", url+"?"+params, true);
    xhttp.timeout = 20000;


    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                console.log(this.responseText);
                if (this.responseText == "SUCCESS") {
                    setTimeout(() => {
                        window.location.href = "/game-lounge/secret-hitler?" + xwwwfurlenc({
                            gameID: gameID,
                            username: username
                        });
                    }, 500);
                }
            }
        }
    };
    xhttp.send(params);
}
