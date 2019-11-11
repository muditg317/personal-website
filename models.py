from google.appengine.ext import ndb

import random
import json

class SH_Player(ndb.Model):
    username = ndb.StringProperty(required=True)
    displayed = ndb.BooleanProperty(required=True)
    uniqueID = ndb.IntegerProperty(required=True)

    def as_dict(self):
        dictionary = {
            "username": self.username,
            "displayed": self.displayed
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

    @staticmethod
    def getDefaultPolicies():
        policyList = ["liberal"]*6 + ["fascist"]*11
        random.shuffle(policyList)
        return policyList

    @staticmethod
    def defaultGame(gameID,players):
        policyList = ["liberal"]*6 + ["fascist"]*11
        random.shuffle(policyList)
        return SH_Game(gameID=gameID,players=players,policies=policyList,discard=[],policySet=[])

    def shufflePolicies(self):
        random.shuffle(self.policies)

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
            "updates": self.updates,
            "requests": self.requests
        }
        players = []
        for player in self.players:
            playerDict = player.as_dict()
            players.append(playerDict)
        dictionary["players"] = players
        return dictionary

    def json(self):
        return json.dumps(self.as_dict())
