/* eslint indent: "off" */
/* eslint no-multiple-empty-lines: "off" */
(function (window) {
const dataBox = document.querySelector('#web_data');
const HITLER_SECRET = document.querySelector('#secret').textContent;
dataBox.removeChild(document.querySelector('#secret'));

const gameID = document.querySelector('#gameID').textContent;
const username = document.querySelector('#username').textContent;
let me;

let actionBox = document.querySelector('#actionBox');

let choosePlayerSection = document.querySelector('#choosePlayerDiv > .sectionBox > .choosePlayerSection');
let choosePlayerPrompt = document.querySelector('#choosePlayerDiv > .sectionBox > .choosePlayerSection > p');
let playerButtonBox = document.querySelector('#playerButtonBox');
let handledUpdates = [];

let requestBox = document.querySelector('#requestBox');
let acknowledgedRequestIDs = [];


let pollTimeout;
const resetPollTimeout = () => {
    let quickPolling = setInterval(() => {
      clearTimeout(pollTimeout);
      pollHitlerData();
    }, 100);
    setTimeout(() => {
      clearInterval(quickPolling);
    }, 550);
};

const tempDisableButton = (button) => {
    let buttonContainer = button.parentNode;
    let items = buttonContainer.childNodes;
    items.forEach((btn) => {
        if (btn.nodeName === 'BUTTON') {
          btn.disabled = true;
          btn.style.backgroundColor = 'rgb(80,80,80)';
          setTimeout(() => {
              btn.style.backgroundColor = 'rgba(255,255,255,0)';
              btn.disabled = false;
          }, 2000);
        }
    });
    resetPollTimeout();
};

let playerButtonEvent = (name) => {
    console.log(name);
};

const playerChooserButtonEvent = (name, button) => {
    playerButtonEvent(name);
    tempDisableButton(button);
};
const resetPlayerChooser = () => {
    choosePlayerPrompt.innerText = 'Select a player:';
    choosePlayerSection.style.display = 'none';
    playerButtonEvent = (name) => {
        console.log(name);
    };
};
const createPlayerButton = (name) => {
    let playerButton = document.querySelector(`#${name.replace(' ', '')}`);
    if (playerButton === null) {
        let button = document.createElement('BUTTON');
        button.className = 'playerButton prettyButton';
        button.id = name.replace(' ', '');
        button.innerText = name;
        button.onclick = (e) => {
            playerChooserButtonEvent(name, button);
        };
        playerButtonBox.appendChild(button);
    }
};
const removePlayerButton = (name) => {
    let playerButton = document.querySelector(`#${name.replace(' ', '')}`);
    if (playerButton !== null) {
        playerButtonBox.removeChild(playerButton);
    }
};


const makeStartButton = () => {
    let startAction = document.querySelector('#startAction');
    if (startAction === null) {
        startAction = document.createElement('DIV');
        startAction.id = 'startAction';
        actionBox.appendChild(startAction);
        let startTitle = document.createElement('P');
        startTitle.innerText = 'Press to start game. No more players willl be able to join!';
        startAction.appendChild(startTitle);
        let buttonBox = document.createElement('DIV');
        buttonBox.className = 'buttonBox';
        let startButton = document.createElement('BUTTON');
        buttonBox.appendChild(startButton);
        startAction.appendChild(buttonBox);
        startButton.className = 'prettyButton';
        startButton.id = 'startButton';
        startButton.innerText = 'Start!';
        startButton.onclick = (e) => {
            let data = {
                type: 'STARTGAME'
            };
            postHitlerData(data);
            tempDisableButton(startButton);
        };
    }
};
const handlePlayerJoin = (update) => {
    let name = update.substring(10);
    if (name !== username) {
        createPlayerButton(name);
        gameLog(name + ' joined the game.');
    } else {
        gameLog('You joined the game!');
    }
    if (playerButtonBox.childElementCount + 1 >= 5) {
        makeStartButton();
    }
};

const handleGameStarted = (update) => {
    let name = update.substring(11);
    let startAction = document.querySelector('#startAction');
    if (startAction !== null) {
        actionBox.removeChild(startAction);
    }
    if (name !== username) {
        gameLog('Game started by: ' + name);
    } else {
        gameLog('You started the game');
    }
};

const setChooseFirstPresButtons = () => {
    choosePlayerPrompt.innerText = 'Select someone to be the first president:';
    choosePlayerSection.style.display = '';
    playerButtonEvent = (name) => {
        let data = {
            type: 'PICKPRESIDENT DOCONFIRM',
            name: name
        };
        postHitlerData(data);
    };
};
const handleRolesGiven = (update) => {
    if (me.party === 'liberal') {
        gameLog('Welcome liberal! Good luck finding Hitler :)');
    } else if (me.role === 'hitler') {
        if (update.includes('+FASCIST+')) {
            let comrade = update.substring(update.indexOf('+FASCIST+') + 9);
            gameLog('Welcome Hitler! ' + comrade + ' is here to help!');
        } else {
            gameLog('Welcome Hitler! Good luck finding your fascists! Don\'t die :P');
        }
    } else {
        gameLog('Welcome fascist! Support Hitler, but be ready to sacrifice!');
        let comradeString = update.substring(10, update.indexOf('HITLER'));
        let comrades = comradeString.split('+FASCIST+').filter((value, index, arr) => {
            return value !== me.username;
        });
        if (comrades.length > 1 || (comrades.length === 1 && comrades[0].length > 0)) {
            let welcomeString = 'Welcome your comrades:';
            comrades.forEach((comrade, index) => {
                if (index !== 0 && comrades.length !== 2) {
                    welcomeString += ',';
                }
                if (index === comrades.length - 1) {
                    welcomeString += ' and';
                }
                welcomeString += ' ' + comrade;
            });
            gameLog(welcomeString + '!');
        }
        let hitler = update.substring(update.indexOf('HITLER') + 6);
        gameLog(hitler + ' is your fearless leader Hitler!');
    }
    gameLog('Now just one of you, tap someone\'s button to make them the starting president.');
    setChooseFirstPresButtons();
};

const handlePresidentChosen = (update) => {
    let requestedPresident = update.substring(15, update.indexOf('BY'));
    let picker = update.substring(update.indexOf('BY') + 2);
    if (picker === username) {
        gameLog('You requested for ' + requestedPresident + ' to be president.');
    } else {
        gameLog(picker + ' requested for ' + requestedPresident + ' to be president.');
    }
    resetPlayerChooser();
};

const setChooseChancellorButtons = () => {
    choosePlayerPrompt.innerText = 'Select your chancellor:';
    choosePlayerSection.style.display = '';
    playerButtonEvent = (name) => {
        let data = {
            type: 'CHANCELLORCHOSEN',
            chancellor: name
        };
        postHitlerData(data);
    };
};
const handlePresidentElected = (update) => {
    let continueAction = document.querySelector('#continueAction');
    if (continueAction !== null) {
        actionBox.removeChild(continueAction);
    }
    let newPresident = update.substring(14);
    let presStr = newPresident;
    if (update.includes('BY')) {
        newPresident = newPresident.substring(0, newPresident.indexOf('BY'));
        let picker = update.substring(update.indexOf('BY') + 2);
        let pickerStr = picker;
        if (picker === username) {
            pickerStr = 'You';
        }
        if (newPresident === username) {
            presStr = 'you';
        }
        gameLog(pickerStr + ' elected ' + presStr + ' as president.');
    } else {
        if (newPresident === username) {
            presStr = 'You were';
        } else {
            presStr += ' was';
        }
        gameLog(presStr + ' elected as president!');
    }
    if (newPresident === username) {
        gameLog('Choose your chancellor!');
        setChooseChancellorButtons();
    } else {
        gameLog(newPresident + ' is choosing someone to be chancellor.');
    }
};

const sendVote = (decision, chancellor, president) => {
    let data = {
        type: 'VOTE',
        chancellor: chancellor,
        decision: decision,
        president: president
    };
    postHitlerData(data);
};
const setVoteButtons = (chancellor, president, chanceStr, presStr) => {
    let action = document.createElement('DIV');
    action.className = 'action';
    action.id = 'voteFor' + chancellor.replace(' ', '');
    let title = document.createElement('P');
    title.innerText = presStr + ' choosing ' + chanceStr;
    action.appendChild(title);
    let buttonBox = document.createElement('DIV');
    buttonBox.className = 'buttonBox';
    action.appendChild(buttonBox);
    let yesButton = document.createElement('BUTTON');
    yesButton.className = 'prettyButton';
    buttonBox.appendChild(yesButton);
    yesButton.className += ' voteYes';
    yesButton.innerText = 'Ja! (yes)';
    let noButton = document.createElement('BUTTON');
    noButton.className = 'prettyButton';
    buttonBox.appendChild(noButton);
    noButton.className += ' voteNo';
    noButton.innerText = 'Nein! (no)';

    yesButton.onclick = (e) => {
        sendVote('yes', chancellor, president);
        tempDisableButton(yesButton);
    };
    noButton.onclick = (e) => {
        sendVote('no', chancellor, president);
        tempDisableButton(noButton);
    };
    actionBox.appendChild(action);
};
const handleVoteNow = (update, doLog = true) => {
    let chancellor = update.substring(7, update.indexOf('BY'));
    let president = update.substring(update.indexOf('BY') + 2);
    let chanceStr = chancellor;
    let presStr = president;
    if (chancellor === username) {
        chanceStr = 'you';
    }
    if (president === username) {
        presStr = 'You';
        resetPlayerChooser();
    }
    if (me.alive) {
        setVoteButtons(chancellor, president, chanceStr, presStr);
        gameLog(presStr + ' selected ' + chanceStr + ' as chancellor. Vote now!', doLog);
    } else {
        gameLog(presStr + ' selected ' + chanceStr + ' as chancellor. Everyone is voting!', doLog);
    }
};

const handleVoteSent = (update) => {
    let chancellor = update.substring(8, update.indexOf('CHOICE'));
    let vote = update.substring(update.indexOf('CHOICE') + 6, update.indexOf('BY'));
    let voter = update.substring(update.indexOf('BY') + 2);
    if (chancellor === username) {
        chancellor = 'You';
    }
    if (voter === username) {
        voter = 'You';
    }
    gameLog(voter + ' voted ' + vote + ' for ' + chancellor.toLowerCase() + ' as chancellor.' + (vote === 'yes' ? ' Nice!' : ' How sad.'));
    if (voter === 'You') {
        let voteAction = document.querySelector('#voteFor' + (update.substring(8, update.indexOf('CHOICE'))).replace(' ', ''));
        if (voteAction !== null) {
            actionBox.removeChild(voteAction);
        }
    }
};

const handleChancellorElected = (update) => {
    let newChancellor = update.substring(15, update.indexOf('BY'));
    let president = update.substring(update.indexOf('BY') + 2);
    let chanceStr = newChancellor + ' was';
    let presStr = 'president ' + president + '\'s';
    if (newChancellor === username) {
        chanceStr = 'You were';
    }
    if (president === username) {
        presStr = 'your';
    }
    gameLog(chanceStr + ' voted in as ' + presStr + ' chancellor.');
    let voteAction = document.querySelector('#voteFor' + newChancellor.replace(' ', ''));
    if (voteAction !== null) {
        actionBox.removeChild(voteAction);
    }
};
const handleHitlerElected = (update) => {
    gameLog('Hitler was elected as chancellor!!');
};

const handleChancellorFailed = (update) => {
    let newChancellor = update.substring(14, update.indexOf('BY'));
    let president = update.substring(update.indexOf('BY') + 2);
    let chanceStr = newChancellor;
    let presStr = 'president ' + president + '\'s';
    if (newChancellor === username) {
        chanceStr = 'you';
    }
    if (president === username) {
        presStr = 'your';
    }
    gameLog('The democracy does not want ' + chanceStr + ' to be ' + presStr + ' chancellor.');
    let voteAction = document.querySelector('#voteFor' + newChancellor.replace(' ', ''));
    if (voteAction !== null) {
        actionBox.removeChild(voteAction);
    }
};

const getPoliciesFromSetString = (setString) => {
    let policies = [];
    for (let i = 0; i < setString.length; i++) {
        if (setString.charAt(i) === 'L') {
            policies.push('liberal');
        } else {
            policies.push('fascist');
        }
    }
    return policies;
};
const discardPolicy = (policy) => {
    let data = {
        type: 'DISCARDPOLICY',
        policy: policy
    };
    postHitlerData(data);
};
const createPresidentDiscardButtons = (policies) => {
    let action = document.createElement('DIV');
    action.className = 'action';
    action.id = 'policyDiscard';
    let title = document.createElement('P');
    title.innerText = 'Choose one to discard:';
    action.appendChild(title);
    let buttonBox = document.createElement('DIV');
    buttonBox.className = 'buttonBox';
    action.appendChild(buttonBox);
    policies.forEach((policy) => {
        let button = document.createElement('BUTTON');
        button.className = 'prettyButton';
        buttonBox.appendChild(button);
        button.className += ' policy';
        button.innerText = policy;
        button.onclick = (e) => {
            discardPolicy(policy);
            tempDisableButton(button);
        };
    });
    actionBox.appendChild(action);
};
const handlePresidentChoosingPolicy = (update, doLog = true) => {
    let president = update.substring(21, update.indexOf('POLICIES'));
    let policies = getPoliciesFromSetString(update.substring(update.indexOf('POLICIES') + 8));
    if (president === username) {
        gameLog('You need to pick a policy to discard. These are your policies: ' + policies.join(', '), doLog);
        createPresidentDiscardButtons(policies);
    } else {
        gameLog('The president is choosing a policy to discard now.', doLog);
    }
};

const handlePolicyDiscard = (update) => {
    let president = update.substring(13);
    if (president === username) {
        president = 'You';
        let discardAction = document.querySelector('#policyDiscard');
        if (discardAction !== null) {
            actionBox.removeChild(discardAction);
        }
    }
    gameLog(president + ' discarded a policy.');
};

const enactPolicy = (policy) => {
    let data = {
        type: 'ENACTPOLICY',
        policy: policy
    };
    postHitlerData(data);
};
const createChancellorEnactButtons = (policies) => {
    let action = document.createElement('DIV');
    action.className = 'action';
    action.id = 'policyEnact';
    let title = document.createElement('P');
    title.innerText = 'Choose one to enact:';
    action.appendChild(title);
    let buttonBox = document.createElement('DIV');
    buttonBox.className = 'buttonBox';
    action.appendChild(buttonBox);
    policies.forEach((policy) => {
        let button = document.createElement('BUTTON');
        button.className = 'prettyButton';
        buttonBox.appendChild(button);
        button.className += ' policy';
        button.innerText = policy;
        button.onclick = (e) => {
            enactPolicy(policy);
            tempDisableButton(button);
        };
    });
    actionBox.appendChild(action);
};
const handleChancellorChoosingPolicy = (update, doLog = true) => {
    let chancellor = update.substring(22, update.indexOf('POLICIES'));
    let policies = getPoliciesFromSetString(update.substring(update.indexOf('POLICIES') + 8));
    if (chancellor === username) {
        gameLog('You need to pick a policy to enact. These are your policies: ' + policies.join(', '), doLog);
        createChancellorEnactButtons(policies);
    } else {
        gameLog('The chancellor is choosing a policy to enact now.', doLog);
    }
};

const createVetoButton = (policy) => {
    let vetoAction = document.querySelector('#vetoAction');
    if (vetoAction === null) {
        vetoAction = document.createElement('DIV');
        vetoAction.id = 'vetoAction';
        actionBox.appendChild(vetoAction);
        let vetoTitle = document.createElement('P');
        vetoTitle.innerText = `Do you want to veto the ${policy} policy?`;
        vetoAction.appendChild(vetoTitle);
        let buttonBox = document.createElement('DIV');
        buttonBox.className = 'buttonBox';
        let vetoButton = document.createElement('BUTTON');
        buttonBox.appendChild(vetoButton);
        let noButton = document.createElement('BUTTON');
        buttonBox.appendChild(noButton);
        vetoAction.appendChild(buttonBox);
        vetoButton.className = 'prettyButton';
        vetoButton.id = 'vetoButton';
        vetoButton.innerText = 'VETO!';
        vetoButton.onclick = (e) => {
            let data = {
                type: 'SENDVETO',
                veto: 'veto',
                policy: policy
            };
            postHitlerData(data);
            tempDisableButton(vetoButton);
        };
        noButton.className = 'prettyButton';
        noButton.id = 'noButton';
        noButton.innerText = 'Let it pass.';
        noButton.onclick = (e) => {
            let data = {
                type: 'SENDVETO',
                veto: 'pass',
                policy: policy
            };
            postHitlerData(data);
            tempDisableButton(noButton);
        };
    }
};
const handleOfferVeto = (update) => {
    let presidentIndex = update.indexOf('PRESIDENT');
    let chancellorIndex = update.indexOf('CHANCELLOR');
    let policy = update.substring(9, presidentIndex);
    let president = update.substring(presidentIndex + 9, chancellorIndex);
    let chancellor = update.substring(chancellorIndex + 10);
    if (me.username !== president && me.username !== chancellor) {
        gameLog(`A ${policy} policy is about to be passed. President ${president} and chancellor ${chancellor} are deciding if they wish to veto.`);
    } else {
        gameLog(`A ${policy} policy is about to be passed. You may veto if you want to.`);
        let policyEnactAction = document.querySelector('#policyEnact');
        if (policyEnactAction !== null) {
            actionBox.removeChild(policyEnactAction);
        }
        createVetoButton(policy);
    }
};

const removeVetoAction = () => {
    let vetoAction = document.querySelector('#vetoAction');
    if (vetoAction !== null) {
        actionBox.removeChild(vetoAction);
    }
};
const handleVetoSent = (update) => {
    let params = update.substring(8).split('|');
    let player = params[0];
    let playerStr = player;
    let policy = params[1];
    let veto = params[2];
    if (player === me.username) {
        removeVetoAction();
        playerStr = 'You';
    }
    if (veto === 'veto') {
        gameLog(`${playerStr} vetoed the ${policy} policy.`);
    } else {
        gameLog(`${playerStr} is letting the ${policy} policy pass.`);
    }
};

const handlePolicyVetoed = (update) => {
    removeVetoAction();
    let policy = update.substring(10);
    gameLog(`The ${policy} policy was vetoed! Keep playing.`);
};

const handlePolicyPass = (update, forced) => {
    removeVetoAction();
    let policy = update.substring(10, update.indexOf('BY'));
    if (forced) {
        policy = policy.substring(7);
    }
    let president = update.substring(update.indexOf('BY') + 2, update.indexOf('CHANCE'));
    let chancellor = update.substring(update.indexOf('CHANCE') + 6);
    if (forced) {
        gameLog('Three consecutive downvotes caused a policy to be forced. A ' + policy + ' policy has passed' + (policy === 'fascist' ? '; no power will be enacted.' : '.'));
    } else {
        let chanceStr = chancellor === username ? 'You' : chancellor;
        let presStr = president === username ? 'your' : ('president ' + president + '\'s');
        gameLog(chanceStr + ' passed a ' + policy + ' policy as ' + presStr + ' chancellor');
        if (chancellor === username) {
            let enactAction = document.querySelector('#policyEnact');
            if (enactAction !== null) {
                actionBox.removeChild(enactAction);
            }
        }
    }
};

const handlePoliciesShuffled = (update) => {
    let details = update.split('|')[1];
    let indexL = details.indexOf('L');
    let indexF = details.indexOf('F');
    let numLiberalPolicies = parseInt(details.substring(indexL + 1, indexF));
    let numFascistPolicies = parseInt(details.substring(indexF + 1));
    gameLog(`The policies were shuffled. There are ${numLiberalPolicies} liberal policies and ${numFascistPolicies} fascist policies remaining.`);
};

const handlePeekPower = (power) => {
    if (!power.includes('|PRES|')) {
        gameLog('The president is peeking at the top three policies.');
        return;
    }
    let peek = power.substring(10);
    let policies = peek.split(',,');
    let revealString = policies.join(', ');
    revealString = revealString.substring(0, revealString.lastIndexOf(', ') + 2) + 'and ' + policies[policies.length - 1];
    gameLog(`The next three policies are ${revealString}.`);
};
const handleInvestigatePower = (power) => {
    if (!power.includes('|PRES|')) {
        gameLog('The president is choosing someone to investigate.');
        return;
    }
    choosePlayerPrompt.innerText = 'Select someone to investigate:';
    choosePlayerSection.style.display = '';
    playerButtonEvent = (name) => {
        let data = {
            type: 'INVESTIGATE',
            choice: name
        };
        postHitlerData(data);
    };
};
const handleSpecialElectionPower = (power) => {
    if (!power.includes('|PRES|')) {
        gameLog('The president is choosing the next president.');
        return;
    }
    choosePlayerPrompt.innerText = 'Select someone to be the next president:';
    choosePlayerSection.style.display = '';
    playerButtonEvent = (name) => {
        let data = {
            type: 'SPECIALELECTION',
            newPres: name
        };
        postHitlerData(data);
    };
};
const handleKillPower = (power) => {
    if (!power.includes('|PRES|')) {
        gameLog('The president is choosing someone to kill.');
        return;
    }
    choosePlayerPrompt.innerText = 'Select someone to kill:';
    choosePlayerSection.style.display = '';
    playerButtonEvent = (name) => {
        let data = {
            type: 'KILL',
            victim: name
        };
        postHitlerData(data);
    };
};
const handleVetoEnabledPower = (power) => {
    gameLog('Veto power has been unlocked!');
};
const handleNukePower = (power) => {
    if (!power.includes('|PRES|')) {
        gameLog('The president is choosing where to drop a nuke!');
        return;
    }
    choosePlayerPrompt.innerText = 'Select where to drop a nuke:';
    choosePlayerSection.style.display = '';
    playerButtonEvent = (name) => {
        let data = {
            type: 'NUKE',
            victim: name
        };
        postHitlerData(data);
    };
};
const handlePower = (update) => {
    let power = update.substring(6);
    if (power.includes('PEEK')) {
        handlePeekPower(power);
    } else if (power.includes('INVESTIGATE')) {
        handleInvestigatePower(power);
    } else if (power.includes('SPECIALELECTION')) {
        handleSpecialElectionPower(power);
    } else if (power.includes('KILL')) {
        handleKillPower(power);
    } else if (power.includes('VETOENABLED')) {
        handleVetoEnabledPower(power);
    } else if (power.includes('NUKE')) {
        handleNukePower(power);
    }
};

const handleInvestigationResult = (powerResult) => {
    let investigationUpdate = powerResult.split('|');
    let player = investigationUpdate[1];
    if (!investigationUpdate.includes('PRES')) {
        gameLog(`The president chose to investigate ${player}`);
        return;
    }
    resetPlayerChooser();
    let party = investigationUpdate[3];
    gameLog(`${player} is a ${party}. Are you gonna spill the beans or lie??`);
};
const handleSpecialElectionResult = (powerResult) => {
    let electionUpdate = powerResult.split('|');
    let president = electionUpdate[1];
    gameLog(`${president} was elected in the special election!`);
    if (powerResult.includes('|PRES|')) {
        resetPlayerChooser();
    }
};
const handleKillResult = (powerResult) => {
    let killUpdate = powerResult.split('|');
    let victim = killUpdate[1];
    gameLog(`${victim} was assassinated!`);
    if (powerResult.includes('|PRES|')) {
        resetPlayerChooser();
    }
    removePlayerButton(victim);
};
const handleNukedResult = (powerResult) => {
    let nukeUpdate = powerResult.split('|');
    let victims = nukeUpdate[1].split(',,');
    let nukedString = victims.join(', ');
    nukedString = nukedString.substring(0, nukedString.lastIndexOf(', ') + 2) + 'and ' + victims[victims.length - 1];
    gameLog(`${nukedString} were hit by the nuke!`);
    if (powerResult.includes('|PRES|')) {
        resetPlayerChooser();
    }
    victims.forEach((victim) => {
        removePlayerButton(victim);
    });
};
const handlePowerResult = (update) => {
    let powerResult = update.substring(12);
    if (powerResult.includes('INVESTIGATION')) {
        handleInvestigationResult(powerResult);
    } else if (powerResult.includes('SPECIALELECTION')) {
        handleSpecialElectionResult(powerResult);
    } else if (powerResult.includes('ASSASSINATION')) {
        handleKillResult(powerResult);
    } else if (powerResult.includes('NUKED')) {
        handleNukedResult(powerResult);
    }
};
const handleHitlerKilled = (update) => {
    gameLog('Hitler was assassinated!');
};

const handleRoundComplete = (update) => {
    let numLiberalPassed = update.substring(13, update.indexOf('FFF'));
    let numFascistPassed = update.substring(update.indexOf('FFF') + 3);
    gameLog('Round completed.<br>Liberal policies: ' + numLiberalPassed + '<br>Fascist policies: ' + numFascistPassed);
};

const createRoundContinueButton = () => {
    let continueAction = document.querySelector('#continueAction');
    if (continueAction === null) {
        continueAction = document.createElement('DIV');
        continueAction.id = 'continueAction';
        actionBox.appendChild(continueAction);
        let continueTitle = document.createElement('P');
        continueTitle.innerText = 'Press when done with discussion.';
        continueAction.appendChild(continueTitle);
        let buttonBox = document.createElement('DIV');
        buttonBox.className = 'buttonBox';
        let continueButton = document.createElement('BUTTON');
        buttonBox.appendChild(continueButton);
        continueAction.appendChild(buttonBox);
        continueButton.className = 'prettyButton';
        continueButton.id = 'continueButton';
        continueButton.innerText = 'Next Round';
        continueButton.onclick = (e) => {
            let data = {
                type: 'BEGINROUND'
            };
            postHitlerData(data);
            tempDisableButton(continueButton);
        };
    }
};
const handleNextRoundOffered = (update) => {
    if (me.alive) {
        createRoundContinueButton();
    }
};

const handleGameWin = (update) => {
    let party = update.substring(4).toLowerCase();
    let won = party === me.party;
    if (won) {
        gameLog(`Your team won!! AYYYY!`);
    } else {
        gameLog(`The ${party}s won. Big oof.`);
    }
};

const handleGameOver = (update) => {
    if (me.role !== 'fascist') {
        let exposeString = update.substring(update.indexOf('+') + 1);
        let exposures = exposeString.split('PLAYER');
        exposures.forEach((exposure) => {
            let indexPipe = exposure.indexOf('||');
            let player = exposure.substring(0, indexPipe);
            if (player !== me.username) {
                let role = exposure.substring(indexPipe + 2);
                let hitler = role === 'hitler';
                if (hitler) {
                    gameLog(`${player} was Hitler!`);
                } else {
                    gameLog(`${player} was a ${role}`);
                }
            }
        });
    }
};

const createNewGameButton = () => {
    let newGameAction = document.querySelector('#newGameAction');
    if (newGameAction === null) {
        newGameAction = document.createElement('DIV');
        newGameAction.id = 'newGameAction';
        actionBox.appendChild(newGameAction);
        let newGameTitle = document.createElement('P');
        newGameTitle.innerText = 'Press when done with discussion.';
        newGameAction.appendChild(newGameTitle);
        let buttonBox = document.createElement('DIV');
        buttonBox.className = 'buttonBox';
        let newGameButton = document.createElement('BUTTON');
        buttonBox.appendChild(newGameButton);
        newGameAction.appendChild(buttonBox);
        newGameButton.className = 'prettyButton';
        newGameButton.id = 'newGameButton';
        newGameButton.innerText = 'Next Round';
        newGameButton.onclick = (e) => {
            let data = {
                type: 'NEWGAME'
            };
            postHitlerData(data);
            tempDisableButton(newGameButton);
        };
    }
};
const handleNewGameOffered = (update) => {
    createNewGameButton();
};

const handleGameReset = (update) => {
    let players = update.substring(update.indexOf('|') + 1).split(',');
    players.forEach((player) => {
        if (player !== me.username) {
            removePlayerButton(player);
            createPlayerButton(player);
        }
    });
};


// let prevUpdated;
// let expectingUpdate = '';
// let responseExpectors = ['PICKPRESIDENT DOCONFIRM', 'CHANCELLORCHOSEN', 'VOTE',     'DISCARDPOLICY', 'ENACTPOLICY', 'BEGINROUND'];
// let expectedResponse =  ['PRESIDENTCHOOSE',         'VOTENOW',          'VOTESENT', 'POLICYDISCARD', 'POLICYPASS',  'PRESIDENTELECT'];
const handleUpdate = (update) => {
    // if (expectedResponse.includes(expectingUpdate)) {
    //     if (expectingUpdate !== 'VOTESENT' || expectingUpdate.endsWith('BY' + me.username)) {
    //         expectingUpdate = '';
    //     }
    // }
    if (update.includes('PLAYERJOIN')) {
        handlePlayerJoin(update);
    } else if (update.includes('GAMESTARTED')) {
        handleGameStarted(update);
    } else if (update.includes('ROLESGIVEN')) {
        handleRolesGiven(update);
    } else if (update.includes('PRESIDENTCHOOSE')) {
        handlePresidentChosen(update);
    } else if (update.includes('PRESIDENTELECT')) {
        handlePresidentElected(update);
    } else if (update.includes('VOTENOW')) {
        handleVoteNow(update);
    } else if (update.includes('VOTESENT')) {
        handleVoteSent(update);
    } else if (update.includes('CHANCELLORELECT')) {
        handleChancellorElected(update);
    } else if (update.includes('HITLERELECT')) {
        handleHitlerElected(update);
    } else if (update.includes('CHANCELLORFAIL')) {
        handleChancellorFailed(update);
    } else if (update.includes('PRESIDENTPOLICYCHOOSE')) {
        handlePresidentChoosingPolicy(update);
    } else if (update.includes('POLICYDISCARD')) {
        handlePolicyDiscard(update);
    } else if (update.includes('CHANCELLORPOLICYCHOOSE')) {
        handleChancellorChoosingPolicy(update);
    } else if (update.includes('OFFERVETO')) {
        handleOfferVeto(update);
    } else if (update.includes('VETOSENT')) {
        handleVetoSent(update);
    } else if (update.includes('POLICYVETO')) {
        handlePolicyVetoed(update);
    } else if (update.includes('POLICYPASS')) {
        handlePolicyPass(update, update.includes('FORCED'));
    } else if (update.includes('POLICIESSHUFFLED')) {
        handlePoliciesShuffled(update);
    } else if (update.includes('POWER-')) {
        handlePower(update);
    } else if (update.includes('POWERRESULT-')) {
        handlePowerResult(update);
    } else if (update.includes('HITLERKILL')) {
        handleHitlerKilled(update);
    } else if (update.includes('ROUNDCOMPLETE')) {
        handleRoundComplete(update);
    } else if (update.includes('OFFERNEXTROUND')) {
        handleNextRoundOffered(update);
    } else if (update.includes('WIN-')) {
        handleGameWin(update);
    } else if (update.includes('GAMEOVER+')) {
        handleGameOver(update);
    } else if (update.includes('OFFERNEWGAME')) {
        handleNewGameOffered(update);
    } else if (update.includes('GAMERESET')) {
        handleGameReset(update);
    } else {
        console.log('OOF unknown update');
    }
};
const handleUpdates = (updates) => {
    let started = false;
    if (handledUpdates.length > updates.length) {
        for (let i = updates.length; i < handledUpdates.length; i++) {
            console.log(handledUpdates[i]);
        }
        document.location.reload(true);
    }
    console.log(updates.slice(-20));
    // let updated = false;
    updates.forEach((update, index, array) => {
        if (update.includes('PLAYERJOIN')) {
            started = false;
        } else if (update.includes('GAMESTARTED')) {
            started = true;
        }
        if (!handledUpdates.includes(update)) {
            handleUpdate(update.substring(8));
            handledUpdates.push(update);
            // updated = true;
        }
    });
    // if (expectingUpdate !== '') {
    //     let lastUpdate = updates[updates.length - 1];
    //     if (!lastUpdate.includes('ID:')) {
    //         lastUpdate = '00000000' + lastUpdate;
    //     }
    //     console.log('UPDATEFAILED' + expectingUpdate);
    //     console.log(lastUpdate);
    //     if (lastUpdate.includes('ROLESGIVEN')) {
    //         setChooseFirstPresButtons();
    //     } else if (lastUpdate.includes('PRESIDENTELECT')) {
    //         setChooseChancellorButtons();
    //     } else if (lastUpdate.includes('VOTENOW') || lastUpdate.includes('VOTESENT')) {
    //         let index = updates.lenth - 1;
    //         while (index > 0 && updates[index].includes('VOTESENT')) {
    //             index = index - 1;
    //         }
    //         let voteNowUpdate = updates[index];
    //         console.log(index, updates[index]);
    //         if (voteNowUpdate.includes('VOTENOW')) {
    //             handleVoteNow(voteNowUpdate.substring(8), false);
    //         }
    //     } else if (lastUpdate.includes('PRESIDENTPOLICYCHOOSE') && expectingUpdate !== 'VOTESENT') {
    //         handlePresidentChoosingPolicy(lastUpdate.substring(8), false);
    //     } else if (lastUpdate.includes('CHANCELLORPOLICYCHOOSE')) {
    //         handleChancellorChoosingPolicy(lastUpdate.substring(8), false);
    //     } else if (lastUpdate.includes('ROUNDCOMPLETE')) {
    //         handleRoundComplete(lastUpdate.substring(8), false);
    //     } else {
    //         expectingUpdate = true;
    //         console.log('OOF unknown update');
    //     }
    //     expectingUpdate = '';
    // }
    // prevUpdated = updated;
    if (!started && playerButtonBox.childElementCount + 1 >= 5) {
        makeStartButton();
    }
};



const acceptJoinRequest = (name, requestID) => {
    acknowledgedRequestIDs.push(requestID);
    let data = {
        type: 'ACCEPTRQ REJOIN',
        accepted: name,
        requestID: requestID
    };
    postHitlerData(data);
};

const acceptPresident = (name, requestID) => {
    acknowledgedRequestIDs.push(requestID);
    let data = {
        type: 'ACCEPTRQ FIRSTPRESIDENT',
        accepted: name,
        requestID: requestID
    };
    postHitlerData(data);
};


const handleRequests = (requests) => {
    // let pendingIDs = []
    requests.forEach((requestString) => {
        let id = requestString.substring(requestString.indexOf('ID:') + 3);
        // pendingIDs.push(id);
        if (!requestString.includes('PROCESSED') && !acknowledgedRequestIDs.includes(id)) {
            let existingRequest = document.querySelector('#req' + id);
            if (existingRequest === null) {
                let request = document.createElement('DIV');
                request.className = 'request';
                // acknowledgedRequestIDs.push(id);
                request.id = 'req' + id;
                let title = document.createElement('P');
                request.appendChild(title);
                let buttonBox = document.createElement('DIV');
                buttonBox.className = 'buttonBox';
                request.appendChild(buttonBox);
                let button = document.createElement('BUTTON');
                buttonBox.appendChild(button);
                button.className = 'prettyButton';
                if (requestString.includes('JOIN')) {
                    let name = requestString.substring(4, requestString.indexOf('ID'));
                    title.innerText = name + ' wants to join back into your game!';
                    button.className += ' allowJoin';
                    button.innerText = 'Allow';
                    button.onclick = (e) => {
                        acceptJoinRequest(name, id);
                        requestBox.removeChild(request);
                    };
                    requestBox.appendChild(request);
                } else if (requestString.includes('CONFIRMPRES')) {
                    let requestedPresident = requestString.substring(11, requestString.indexOf('BY'));
                    let picker = requestString.substring(requestString.indexOf('BY') + 2, requestString.indexOf('ID'));
                    if (picker !== username && requestedPresident !== username) {
                        title.innerText = picker + ' wants ' + requestedPresident + ' to be president.';
                        button.className += ' confirmPres';
                        button.innerText = 'Proceed';
                        button.onclick = (e) => {
                            acceptPresident(requestedPresident, id);
                            requestBox.removeChild(request);
                        };
                        requestBox.appendChild(request);
                    }
                }
            }
        } else {
            id = id.substring(0, id.indexOf('PROCESSED'));
            let existingRequest = document.querySelector('#req' + id);
            if (existingRequest !== null) {
                requestBox.removeChild(existingRequest);
            }
        }
    });

    // acknowledgedRequestIDs.forEach((id) => {
    //     if (!pendingIDs.includes(id)) {
    //         let requestElement = document.querySelector('#req' + id);
    //         if (requestElement !== null) {
    //             requestBox.removeChild(requestElement);
    //         }
    //     }
    // });
};



const handleHitlerResult = (updateJSON) => {
    pollTimeout = setTimeout(function () {
        pollHitlerData();
    }, 2000);

    let update = JSON.parse(updateJSON);

    me = update.player;

    handleUpdates(update.updates);
    handleRequests(update.requests);
};
const pollHitlerData = () => {
    let xhttp = new XMLHttpRequest();
    // let time = 0;
    // let counter = setInterval(function () {
    //     time += 100;
    //     console.log(time);
    // }, 100);
    let url = '/game-lounge/secret-hitler/data';
    let params = xwwwfurlenc({
        secret: HITLER_SECRET,
        type: 'UPDATE',
        gameID: gameID,
        username: username
    });
    xhttp.open('GET', url + '?' + params, true);
    xhttp.timeout = 20000;

    xhttp.onreadystatechange = () => {
        if (this.readyState === 4) {
            // clearInterval(counter);
            if (this.status === 200) {
                handleHitlerResult(this.responseText);
            }
        }
    };
    xhttp.send(params);
};
pollHitlerData();


const postHitlerData = (jsonParams) => {
    let xhttp = new XMLHttpRequest();
    let url = '/game-lounge/secret-hitler/data';
    let params = {
        secret: HITLER_SECRET,
        gameID: gameID,
        username: username
    };
    Object.keys(jsonParams).forEach((key) => {
        params[key] = jsonParams[key];
    });
    xhttp.open('POST', url + '?' + xwwwfurlenc(params), true);

    xhttp.onreadystatechange = () => {
        if (this.readyState === 4) {
            if (this.status === 200) {
                console.log('data was received');
                console.log(this.responseText);
                // let ind = responseExpectors.indexOf(params['type']);
                // if (ind >= 0) {
                //     expectingUpdate = expectedResponse[ind];
                // }
            }
        }
    };
    xhttp.send(params);
};

// Set the name of the hidden property and the change event for visibility
var hidden, visibilityChange;
if (typeof document.hidden !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
    hidden = 'hidden';
    visibilityChange = 'visibilitychange';
} else if (typeof document.msHidden !== 'undefined') {
    hidden = 'msHidden';
    visibilityChange = 'msvisibilitychange';
} else if (typeof document.webkitHidden !== 'undefined') {
    hidden = 'webkitHidden';
    visibilityChange = 'webkitvisibilitychange';
}


// If the page is hidden, pause the video;
// if the page is shown, play the video
const handleVisibilityChange = () => {
    clearTimeout(pollTimeout);
    if (!document[hidden]) {
        pollHitlerData();
    }
};

// Warn if the browser doesn't support addEventListener or the Page Visibility API
if (typeof document.addEventListener === 'undefined' || hidden === undefined) {
    console.log('This demo requires a browser, such as Google Chrome or Firefox, that supports the Page Visibility API.');
} else {
    // Handle page visibility change
    document.addEventListener(visibilityChange, handleVisibilityChange, false);
}



const confirmLeave = () => {
    console.log('leaving: ' + username);
    let xhttp = new XMLHttpRequest();
    let url = '/game-lounge/secret-hitler/data';
    let params = xwwwfurlenc({
        secret: HITLER_SECRET,
        type: 'PLAYEREXIT',
        gameID: gameID,
        username: username
    });
    xhttp.open('POST', url + '?' + params, true);
    xhttp.timeout = 20000;
    xhttp.onreadystatechange = () => {
        if (this.readyState === 4) {
            // clearInterval(counter);
            if (this.status === 200) {
                console.log(this.responseText);
            }
        }
    };
    xhttp.send(params);
};
let isOnIOS = navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPhone/i);
let beforeUnloadEvent = isOnIOS ? 'pagehide' : 'beforeunload';
window.addEventListener(beforeUnloadEvent, confirmLeave);



let logDiv = document.querySelector('#gameLog');
const gameLog = (message, doLog = true) => {
    if (doLog) {
        logDiv.innerHTML += '<p>&gt;&nbsp;' + message + '</p>';// + logDiv.innerHTML;
        logDiv.scrollTop = logDiv.scrollHeight;
    }
};
})(window);
