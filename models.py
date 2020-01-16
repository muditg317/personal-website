from google.appengine.ext import ndb

import random
import json
import datetime

class SH_Player(ndb.Model):

    username = ndb.StringProperty(required=True)
    displayed = ndb.BooleanProperty(required=True,default=False)
    lastCheckin = ndb.DateTimeProperty()
    uniqueID = ndb.IntegerProperty(required=True)
    updates = ndb.StringProperty(repeated=True)

    role = ndb.StringProperty()
    party = ndb.StringProperty()
    alive = ndb.BooleanProperty()

    vote = ndb.BooleanProperty()
    voted = ndb.BooleanProperty()

    def markDisplayed(self):
        self.displayed = True

    def unmarkDisplayed(self):
        self.displayed = False

    def checkIn(self):
        self.markDisplayed()
        self.lastCheckin = datetime.datetime.now()

    def checkOut(self):
        self.unmarkDisplayed()

    def confirmOnline(self):
        if not self.lastCheckin:
            return self.checkOut()
        timeSinceCheckin = datetime.datetime.now() - self.lastCheckin
        if timeSinceCheckin > self.MAX_TIME_SINCE_CHECKIN():
            self.checkOut()

    def revive(self):
        self.alive = True

    def die(self):
        self.alive = False

    def assignParty(self, party):
        self.party = party

    def assignRole(self, role):
        self.role = role

    def clearVote(self):
        self.voted = False
        self.vote = None

    def registerVote(self, vote):
        self.voted = True
        self.vote = vote == "yes"

    def getNextUpdateID(self):
        id = str(len(self.updates))
        id = "0"*(4-len(id)) + id
        return "ID:" + id + "|"

    def reset(self):
        # startUpdate = next(iter(filter(lambda update: "GAMESTARTED" in update, self.updates)),None)
        # if startUpdate:
        #     self.updates[self.updates.index(startUpdate):] = []
        self.role = None
        self.party = None
        self.alive = None
        self.vote = None
        self.voted = None

    def postUpdate(self, update):
        self.updates.append(self.getNextUpdateID() + update)

    def as_dict(self):
        dictionary = {
            "username": self.username,
            "displayed": self.displayed,
            "uniqueID": self.uniqueID,
            "role": self.role,
            "party": self.party,
            "alive": self.alive
        }
        return dictionary

    def __nonzero__(self):
        return 1

    def MAX_TIME_SINCE_CHECKIN(self):
        return datetime.timedelta(seconds=2)

    def json(self):
        return json.dumps(self.as_dict())

class ErrorLog(ndb.Model):
    errors = ndb.StringProperty(repeated=True)

class SH_Game(ndb.Model):
    gameID = ndb.StringProperty(required=True)
    players = ndb.LocalStructuredProperty(SH_Player,repeated=True)
    numPlayers = ndb.IntegerProperty(default=0)
    policies = ndb.StringProperty(repeated=True)
    discard = ndb.StringProperty(repeated=True)
    numLiberalPassed = ndb.IntegerProperty(required=True,default=0)
    numFascistPassed = ndb.IntegerProperty(required=True,default=0)
    president = ndb.StringProperty()
    chancellor = ndb.StringProperty()
    policySet = ndb.StringProperty(repeated=True)
    state = ndb.StringProperty(required=True,default="INIT")
    requests = ndb.StringProperty(repeated=True)
    voted = ndb.StringProperty(repeated=True)
    presidentIndex = ndb.IntegerProperty()
    consecutiveDowns = ndb.IntegerProperty(default=0)
    vetoEnabled = ndb.BooleanProperty(default=False)
    vetos = ndb.StringProperty(repeated=True)

    def postError(self, error):
        query = ErrorLog.query().fetch()
        errorLog = query[0] if len(query)>0 else ErrorLog()
        errorLog.errors.append(str(error))
        errorLog.put()
        return error

    def registerNewPlayer(self, username):
        newPlayer = SH_Player(username=username,uniqueID=random.randint(1000000000,9999999999))
        self.players.append(newPlayer)
        self.numPlayers+=1
        otherUsernames = self.getOtherUsernames(username)
        for otherUsername in otherUsernames:
            self.postUpdate("PLAYERJOIN"+otherUsername, username)
        joinUpdate = "PLAYERJOIN"+username
        self.postUpdate(joinUpdate)

    def getUsernames(self, *players):
        if not players:
            players = self.players
        return [player.username for player in players]

    def getPlayer(self, username):
        return next(iter(filter(lambda player: player.username == username, self.players)), None)

    def getPlayers(self, *usernames):
        return filter(lambda player: player.username in usernames, self.players)

    def getOthers(self, *usernames):
        return filter(lambda player: player.username not in usernames, self.players)

    def getOtherUsernames(self, *usernames):
        return [player.username for player in self.getOthers(*usernames)]

    def getDisplayed(self):
        return filter(lambda player: player.displayed, self.players)

    def getOthersDisplayed(self, username):
        return filter(lambda player: player.displayed, self.getOthers(username))

    def checkIn(self, username):
        self.getPlayer(username).checkIn()
        self.confirmOthersActive(username)

    def checkOut(self, username):
        self.getPlayer(username).checkOut()
        self.confirmOthersActive(username)

    def confirmOthersActive(self, username):
        for player in self.getOthersDisplayed(username):
            player.confirmOnline()

    def requestPlayerEntry(self, username):
        joinRequest = "JOIN"+username
        self.postRequest(joinRequest)

    def living(self):
        return [player for player in self.players if player.alive]

    def revive(self, *usernames):
        for player in self.getPlayers(*usernames):
            player.revive()

    def awaitingStart(self):
        return self.state == "INIT"

    def beginNewGame(self, username):
        self.postUpdate("GAMESTARTED"+username)
        self.shufflePolicies()
        self.revive(*self.getUsernames())
        self.applyRoles()

    def sendRoleUpdates(self):
        roleUpdate = "ROLESGIVEN"
        self.postUpdate(roleUpdate, *self.getUsernames(*self.liberals()))
        nonHitlerFascists = self.nonHitlerFascists()
        fascistNames = self.getUsernames(*nonHitlerFascists)
        self.postUpdate(roleUpdate+"+FASCIST+".join(fascistNames)+"HITLER"+self.hitler().username, *fascistNames)
        self.postUpdate(roleUpdate+("+FASCIST+"+fascistNames[0] if len(fascistNames) == 1 else ""), self.hitler().username)
        self.state = "PICKINGFIRSTPRES"

    def applyRoles(self):
        numPlayers = len(self.players)
        if numPlayers % 2 == 0:
            numFascists = (numPlayers / 2) - 1
        else:
            numFascists = numPlayers / 2
        numLiberals = numPlayers - numFascists
        parties = ["fascist"]*numFascists + ["liberal"]*numLiberals
        random.shuffle(parties)
        while True:
            hitlerIndex = random.randint(0,numPlayers-1)
            if parties[hitlerIndex] == "fascist":
                break
        for i in range(numPlayers):
            self.players[i].assignParty(parties[i])
            self.players[i].assignRole(parties[i] if i != hitlerIndex else "hitler")
        self.sendRoleUpdates()

    def fascists(self):
        return [player for player in self.living() if player.party=="fascist"]

    def hitler(self):
        return next(iter(filter(lambda player: player.role == "hitler", self.players)))

    def nonHitlerFascists(self):
        return [player for player in self.living() if player.role=="fascist"]

    def liberals(self):
        return [player for player in self.living() if player.party=="liberal"]

    def pickingFirstPres(self):
        return self.state == "PICKINGFIRSTPRES"

    def requestFirstPres(self, requestedPresident, picker):
        presRequest = "CONFIRMPRES"+requestedPresident+"BY"+picker
        self.postRequest(presRequest)
        self.postUpdate("PRESIDENTCHOOSE"+requestedPresident+"BY"+picker)
        self.state = "ACCEPTINGFIRSTPRES"

    def acceptingFirstPres(self):
        return self.state == "ACCEPTINGFIRSTPRES"

    def acceptFirstPres(self, acceptedPresident):
        newPres = self.getPlayer(acceptedPresident)
        self.presidentIndex = self.players.index(newPres)
        self.electPresident(acceptedPresident)

    def electPresident(self, president, picker=None):
        newPres = self.getPlayer(president)
        self.president = president
        electionUpdate = "PRESIDENTELECT"+president + ("BY"+picker if picker else "")
        self.postUpdate(electionUpdate)
        self.state = "CHOOSINGCHANCELLOR"+president

    def clearVotes(self):
        for player in self.players:
            player.clearVote()

    def sendChancellorVoteRequest(self, chancellor, president):
        chancellorChosenUpdate = "VOTENOW"+chancellor+"BY"+president
        self.postUpdate(chancellorChosenUpdate)
        self.clearVotes()
        self.state = "VOTING"+chancellor

    def voting(self, chancellor, president):
        return "VOTING"+chancellor == self.state and president == self.president

    def registerVote(self, voter, chancellor, vote):
        if self.getPlayer(voter).voted:
            return
        self.getPlayer(voter).registerVote(vote)
        self.postUpdate("VOTESENT"+chancellor+"CHOICE"+vote+"BY"+voter)
        self.evaluateVote(chancellor)

    def getVotes(self):
        return [player.vote for player in self.living() if player.voted]

    def getVoteResult(self):
        numPlayers = len(self.living())
        votes = self.getVotes()
        numVoted = len(votes)
        vote = sum(votes)
        if vote > numPlayers / 2:
            return True
        if numVoted - vote >= numPlayers / 2.0:
            return True
        if numVoted == numPlayers and vote <= numPlayers / 2:
            return False

    def evaluateVote(self, chancellor):
        voteResult = self.getVoteResult()
        if voteResult:
            self.electChancellor(chancellor)
            self.sendPoliciesToPresident()
        elif voteResult == False:
            self.failChancellor(chancellor)

    def electChancellor(self, chancellor):
        self.postUpdate("CHANCELLORELECT"+chancellor+"BY"+self.president)
        self.chancellor = chancellor
        self.consecutiveDowns = 0
        if self.getPlayer(self.chancellor).role == "hitler":
            self.postUpdates("HITLERELECT"+chancellor)
            self.fascistsWin()

    def failChancellor(self, chancellor):
        self.postUpdate("CHANCELLORFAIL"+chancellor+"BY"+self.president)
        self.consecutiveDowns += 1
        if self.consecutiveDowns == 3:
            forcedPolicy = self.policies.pop(0)
            self.passPolicy(forcedPolicy,forced=True,chancellor=chancellor)
            self.consecutiveDowns = 0
        self.endRound()
        self.offerNextRound()

    def makePolicySet(self):
        self.policySet = self.policies[0:3]
        self.policies[0:3] = []

    def getPolicySetString(self):
        return "L"*self.policySet.count("liberal")+"F"*self.policySet.count("fascist")

    def sendPoliciesToPresident(self):
        self.makePolicySet()
        presChoosingPolicyUpdate = "PRESIDENTPOLICYCHOOSE"+self.president
        self.postUpdate(presChoosingPolicyUpdate, *self.getOtherUsernames(self.president))
        policySetString = self.getPolicySetString()
        presChoosingPolicyUpdate += "POLICIES"+policySetString
        self.postUpdate(presChoosingPolicyUpdate, self.president)
        self.state = "PRESIDENTPOLICY"+self.president

    def presidentPicking(self, president, discarded_policy):
        return "PRESIDENTPOLICY"+president == self.state and discarded_policy in self.policySet

    def discardPolicy(self, to_discard):
        self.policySet.remove(to_discard)
        self.discard.append(to_discard)
        self.postUpdate("POLICYDISCARD"+self.president)
        self.sendPoliciesToChancellor()

    def sendPoliciesToChancellor(self):
        chanceChoosingPolicyUpdate = "CHANCELLORPOLICYCHOOSE"+self.chancellor
        self.postUpdate(chanceChoosingPolicyUpdate, *self.getOtherUsernames(self.chancellor))
        policySetString = self.getPolicySetString()
        chanceChoosingPolicyUpdate += "POLICIES"+policySetString
        self.postUpdate(chanceChoosingPolicyUpdate, self.chancellor)
        self.state = "CHANCELLORPOLICY"+self.chancellor

    def chancellorPicking(self, chancellor, enacted_policy):
        return "CHANCELLORPOLICY"+chancellor == self.state and enacted_policy in self.policySet

    def enactPolicy(self, to_enact):
        self.policySet.remove(to_enact)
        self.discard += self.policySet
        self.policySet = []
        if not self.vetoEnabled:
            self.completePolicy(to_enact)
        else:
            self.offerVeto(to_enact)

    def completePolicy(self, policy):
        self.passPolicy(policy)
        self.checkPolicyDeck()
        self.endRound()
        if not self.checkWin():
            if policy == "fascist":
                if not self.checkPowers():
                    self.offerNextRound()
            else:
                self.offerNextRound()

    def checkPolicyDeck(self):
        if len(self.policies) < 3:
            self.policies += self.discard
            self.discard = []
            self.shufflePolicies()
            shuffleUpdate = "POLICIESSHUFFLED|L" + str(self.policies.count("liberal")) + "F" + str(self.policies.count("fascist"))
            self.postUpdate(shuffleUpdate)

    def shufflePolicies(self):
        random.shuffle(self.policies)

    def offerVeto(self, to_enact):
        vetoUpdate = "OFFERVETO"+to_enact + "PRESIDENT" + self.president + "CHANCELLOR" + self.chancellor
        self.postUpdate(vetoUpdate)
        self.state = "VETOPENDING"+to_enact

    def vetoPending(self, policy):
        return "VETOPENDING" in self.state and policy in self.state

    def receiveVeto(self, veto, player, policy):
        self.vetos.append(veto)
        self.postUpdate("VETOSENT"+player+"|"+policy+"|"+veto)
        if len(self.vetos) == 2 or "pass" in self.vetos:
            self.state = "VETOPROCESSED"
            self.vetos = []
            if self.vetos.count("veto") == 2:
                self.postUpdate("POLICYVETO"+policy)
                self.checkPolicyDeck()
                self.endRound()
                self.offerNextRound()
            else:
                self.completePolicy(policy)

    def passPolicy(self, policy, forced=False, chancellor=None):
        if not chancellor:
            chancellor = self.chancellor
        if policy == "liberal":
            self.numLiberalPassed += 1
        else:
            self.numFascistPassed += 1
        policyPassUpdate = "POLICYPASS" + ("-FORCED" if forced else "") + policy+"BY"+self.president+"CHANCE"+chancellor
        self.postUpdate(policyPassUpdate)

    def checkPowers(self):
        if self.numPlayers == 5 or self.numPlayers == 6:
            if self.numFascistPassed < 3:
                pass
            elif self.numFascistPassed == 3:
                return self.executePeekPower()
            elif self.numFascistPassed == 4:
                return self.executeKillPower()
            elif self.numFascistPassed == 5:
                self.unlockVeto()
                return self.executeKillPower()
        elif self.numPlayers == 7 or self.numPlayers == 8:
            if self.numFascistPassed < 2:
                pass
            elif self.numFascistPassed == 2:
                return self.executeInvestigatePower()
            elif self.numFascistPassed == 3:
                return self.executeSpecialElectionPower()
            elif self.numFascistPassed == 4:
                return self.executeKillPower()
            elif self.numFascistPassed == 5:
                self.unlockVeto()
                return self.executeKillPower()
        elif self.numPlayers == 9 or self.numPlayers == 10:
            if self.numFascistPassed < 1:
                pass
            elif self.numFascistPassed == 1 or self.numFascistPassed == 2:
                return self.executeInvestigatePower()
            elif self.numFascistPassed == 3:
                return self.executeSpecialElectionPower()
            elif self.numFascistPassed == 4:
                return self.executeKillPower()
            elif self.numFascistPassed == 5:
                self.unlockVeto()
                return self.executeKillPower()
        elif self.numPlayers > 10:
            if self.numFascistPassed < 1:
                pass
            elif self.numFascistPassed == 1 or self.numFascistPassed == 2:
                return self.executeInvestigatePower()
            elif self.numFascistPassed == 3:
                return self.executeSpecialElectionPower()
            elif self.numFascistPassed == 4:
                return self.executeKillPower()
            elif self.numFascistPassed == 5:
                self.executeNukePower()
                return self.unlockVeto()

    def usePower(self, powerUpdate, presidentUpdate=""):
        self.postUpdate("POWER-" + powerUpdate, *self.getOtherUsernames(self.president))
        self.postUpdate("POWER-" + powerUpdate + "|PRES|" + presidentUpdate, self.president)
        return True
    def postPowerResult(self, resultUpdate, presidentUpdate=""):
        self.postUpdate("POWERRESULT-" + resultUpdate, *self.getOtherUsernames(self.president))
        self.postUpdate("POWERRESULT-" + resultUpdate + "|PRES|" + presidentUpdate, self.president)

    def executePeekPower(self):
        return not self.usePower("PEEK", ",,".join(self.policies[0:3]))

    def executeInvestigatePower(self):
        self.state = "INVESTIGATING|"+self.president
        return self.usePower("INVESTIGATE")
    def investigating(self, president):
        return self.state == "INVESTIGATING|"+president
    def investigate(self, username):
        investigationUpdate = "INVESTIGATION|"+username
        self.postPowerResult(investigationUpdate, self.getPlayer(username).party)
        self.offerNextRound()

    def executeSpecialElectionPower(self):
        self.state = "SPECIALELECTING|"+self.president
        return self.usePower("SPECIALELECTION")
    def specialElecting(self, president):
        return self.state == "SPECIALELECTING|"+president
    def specialElection(self, chosenPresident):
        electionUpdate = "SPECIALELECTION|"+chosenPresident
        self.postPowerResult(electionUpdate)
        self.electPresident(chosenPresident,self.president)

    def executeKillPower(self):
        self.state = "KILLING|"+self.president
        return self.usePower("KILL")
    def killing(self, president):
        return self.state == "KILLING|"+president
    def kill(self, victim):
        killUpdate = "ASSASSINATION|"+victim
        self.postPowerResult(killUpdate)
        self.getPlayer(victim).die()
        if self.getPlayer(victim).role == "hitler":
            self.postUpdates("HITLERKILL"+victim)
            self.liberalsWin()
        else:
            self.offerNextRound()

    def unlockVeto(self):
        self.vetoEnabled = True
        return not self.usePower("VETOENABLED")

    def executeNukePower(self):
        self.state = "NUKING|"+self.president
        return self.usePower("NUKE")
    def nuking(Self, president):
        return self.state == "NUKING|"+president
    def nuke(self, victim):
        victimIndex = self.getUsernames(self.players).index(victim)
        leftVictim = next(iter(filter(lambda player: player.alive, self.players[0:victimIndex:-1]+self.players[victimIndex+1::-1]))).username
        rightVictim = next(iter(filter(lambda player: player.alive, self.players[victimIndex+1:]+self.players[0:victimIndex]))).username
        victims = [leftVictim,victim,rightVictim]
        nukeUpdate = "NUKED|"+",,".join(victims)
        self.postPowerResult(nukeUpdate)
        for player in self.getPlayers(victims):
            player.die()
        if not self.hitler().alive:
            self.postUpdates("HITLERKILL"+victim)
            self.liberalsWin()
        else:
            self.offerNextRound()

    def checkWin(self):
        if self.numLiberalPassed == 5:
            self.liberalsWin()
            return True
        elif self.numFascistPassed == 6:
            self.fascistsWin()
            return True

    def liberalsWin(self):
        winUpdate = "WIN-LIBERAL"
        self.postUpdate(winUpdate)
        self.endGame()

    def fascistsWin(self):
        winUpdate = "WIN-FASCIST"
        self.postUpdate(winUpdate)
        self.endGame()

    def endRound(self):
        self.postUpdate("ROUNDCOMPLETE" + str(self.numLiberalPassed) + "FFF" + str(self.numFascistPassed))

    def offerNextRound(self):
        self.state = "AWAITINGNEXTROUND"
        self.postUpdate("OFFERNEXTROUND")

    def awaitingNextRound(self):
        return self.state == "AWAITINGNEXTROUND"

    def nextRound(self):
        self.presidentIndex += 1
        self.presidentIndex %= len(self.players)
        while not self.players[self.presidentIndex].alive:
            self.presidentIndex += 1
            self.presidentIndex %= len(self.players)
        self.electPresident(self.players[self.presidentIndex].username)

    def endGame(self):
        exposeRolesList = [player.username + "||" + player.role for player in self.players]
        self.postUpdate("GAMEOVER+" + "PLAYER".join(exposeRolesList))
        self.state = "GAMEOVER"
        self.offerNewGame()

    def gameOver(self):
        return self.state == "GAMEOVER"

    def offerNewGame(self):
        self.postUpdate("OFFERNEWGAME")

    def reset(self):
        self.policies = ["liberal"]*6 + ["fascist"]*11
        self.discard = []
        self.numLiberalPassed = 0
        self.numFascistPassed = 0
        self.president = None
        self.chancellor = None
        self.policySet = []
        self.state = "INIT"
        self.requests = []
        self.voted = []
        self.presidentIndex = None
        self.consecutiveDowns = 0
        self.vetoEnabled = False
        for player in self.players:
            player.reset()
        self.postUpdate("GAMERESET|"+",".join(self.getUsernames()))

    def startNewGame(self, username):
        self.reset()
        self.beginNewGame(username)

    def postUpdate(self, update, *usernames):
        if not usernames:
            receivers = self.players
        else:
            receivers = self.getPlayers(*usernames)
        # self.postError("update ||" + update + "|| to: "+str([player.username for player in receivers])+"||||")
        for player in receivers:
            player.postUpdate(update)

    def postRequest(self, request):
        request += "ID:"+str(random.randint(10000,99999))
        self.requests.append(request)

    def processRequest(self, requestID):
        processedRequestIndex = self.requests.index(next(iter(filter(lambda request: "ID:"+requestID in request, self.requests))))
        self.requests[processedRequestIndex] += "PROCESSED"


    def as_dict(self):
        dictionary = {
            "gameID": self.gameID,
            "policies": self.policies,
            "discard": self.discard,
            "numLiberalPassed": self.numLiberalPassed,
            "numFascistPassed": self.numFascistPassed,
            "president": self.president,
            "chancellor": self.chancellor,
            "policySet": self.policySet,
            "state": self.state,
            "requests": self.requests,
            "presidentIndex": self.presidentIndex,
            "consecutiveDowns": self.consecutiveDowns,
            "vetoEnabled": self.vetoEnabled
        }
        players = []
        for player in self.players:
            playerDict = player.as_dict()
            players.append(playerDict)
        dictionary["players"] = players
        return dictionary

    def json(self):
        return json.dumps(self.as_dict())

    @staticmethod
    def getDefaultPolicies():
        policyList = ["liberal"]*6 + ["fascist"]*11
        random.shuffle(policyList)
        return policyList

    @staticmethod
    def defaultGame(gameID,*players):
        return SH_Game(gameID=gameID,policies=["liberal"]*6 + ["fascist"]*11,players=players)
