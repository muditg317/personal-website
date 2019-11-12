from google.appengine.ext import ndb

import random
import json

class SH_Player(ndb.Model):
    username = ndb.StringProperty(required=True)
    displayed = ndb.BooleanProperty(required=True)
    uniqueID = ndb.IntegerProperty(required=True)

    role = ndb.StringProperty()
    party = ndb.StringProperty()


    def as_dict(self):
        dictionary = {
            "username": self.username,
            "displayed": self.displayed,
            "role": self.role,
            "party": self.party
        }
        return dictionary

class SH_Game(ndb.Model):
    gameID = ndb.StringProperty(required=True)
    players = ndb.StructuredProperty(SH_Player,repeated=True)
    policies = ndb.StringProperty(repeated=True)
    discard = ndb.StringProperty(repeated=True)
    numLiberalPassed = ndb.IntegerProperty(required=True,default=0)
    numFascistPassed = ndb.IntegerProperty(required=True,default=0)
    president = ndb.StructuredProperty(SH_Player)
    chancellor = ndb.StructuredProperty(SH_Player)
    policySet = ndb.StringProperty(repeated=True)
    state = ndb.StringProperty(required=True,default="INIT")
    updates = ndb.StringProperty(repeated=True)
    requests = ndb.StringProperty(repeated=True)
    votes = ndb.StringProperty(repeated=True)
    voted = ndb.StringProperty(repeated=True)
    presidentIndex = ndb.IntegerProperty()
    consecutiveDowns = ndb.IntegerProperty()

    def applyRoles(self):
        numPlayers = len(self.players)
        if numPlayers % 2 == 0:
            numFascists = (numPlayers / 2) - 1
        else:
            numFascists = numPlayers / 2
        numLiberals = numPlayers - numFascists
        roles = ["fascist"]*numFascists + ["liberal"]*numLiberals
        random.shuffle(roles)
        while True:
            hitlerIndex = random.randint(0,numPlayers)
            if roles[hitlerIndex] == "fascist":
                break
        for i in range(numPlayers):
            self.players[i].party = roles[i]
            self.players[i].role = roles[i] if i != hitlerIndex else "hitler"

    def getVoteResult(self):
        numPlayers = len(self.players)
        numYesses = self.votes.count("yes")
        numNos = self.votes.count("no")
        if numYesses+numNos < numPlayers:
            return False,False
        if numYesses > numNos:
            return True,True
        return True,False

    def passPolicy(self, policy):
        if policy == "liberal":
            self.numLiberalPassed += 1
        else:
            self.numFascistPassed += 1

    def makePolicySet(self):
        if len(self.policies) < 3:
            self.policies += self.discard
            self.discard = []
        self.shufflePolicies()
        self.policySet = self.policies[0:3]
        self.policies[0:3] = []

    @staticmethod
    def getDefaultPolicies():
        policyList = ["liberal"]*6 + ["fascist"]*11
        random.shuffle(policyList)
        return policyList

    @staticmethod
    def defaultGame(gameID,players):
        policyList = ["liberal"]*6 + ["fascist"]*11
        random.shuffle(policyList)
        return SH_Game(gameID=gameID,players=players,policies=policyList)

    def shufflePolicies(self):
        random.shuffle(self.policies)

    def as_dict(self):
        dictionary = {
            "gameID": self.gameID,
            "policies": self.policies,
            "discard": self.discard,
            "numLiberalPassed": self.numLiberalPassed,
            "numFascistPassed": self.numFascistPassed,
            "president": None if self.president == None else self.president.as_dict(),
            "chancellor": None if self.chancellor == None else self.chancellor.as_dict(),
            "policySet": self.policySet,
            "state": self.state,
            "updates": self.updates,
            "requests": self.requests,
            "votes": self.votes,
            "voted": self.voted,
            "presidentIndex": self.presidentIndex,
            "consecutiveDowns": self.consecutiveDowns
        }
        players = []
        for player in self.players:
            playerDict = player.as_dict()
            players.append(playerDict)
        dictionary["players"] = players
        return dictionary

    def json(self):
        return json.dumps(self.as_dict())
