import webapp2
import jinja2
import os
from models import *

import json
import time

the_jinja_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)+"/../templates/"),
    extensions=["jinja2.ext.autoescape"],
    autoescape=True)

SECRET = "secret hitler is the best game ever"

class SecretHitlerPage(webapp2.RequestHandler):
    def get(self):
        time.sleep(.5)
        gameID = self.request.get("gameID")
        username = self.request.get("username")
        games = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()
        if len(games) == 0:
            return self.redirect("/game-lounge#secretHitler"+str(games))
        elif len(games) > 1:
            return self.redirect("/game-lounge#secretHitler"+str(games))
        else:
            game = games[0]
            player = game.getPlayer(username)
            if player == None:
                return self.redirect("/game-lounge#secretHitler")
            else:
                if player.displayed:
                    return self.redirect("/game-lounge?displayed=true#secretHitler")
                else:
                    secret_hitler_template = the_jinja_env.get_template("game_lounge/secret_hitler.html")
                    self.response.write(secret_hitler_template.render({
                        "gameID" : gameID,
                        "player" : player.username,
                        "secret": SECRET
                    }))


class SecretHitlerData(webapp2.RequestHandler):
    def dispatch(self):
        secret = self.request.get("secret")
        if secret == SECRET:
            gameID = self.request.get("gameID")
            games = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()
            if len(games) == 0 and "CREATE" not in self.request.get("type").split():
                return self.response.write("There is no game with id: {}".format(gameID))
            elif len(games) > 1:
                return self.response.write("Uhhhhhh, there's multiple games with the same gameID... Please contact Mudit immediately.")
            else:
                super(SecretHitlerData, self).dispatch()
        else:
            return self.abort(403)
    def get(self):
        type = self.request.get("type").split()
        gameID = self.request.get("gameID")
        game = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()[0]
        if "UPDATE" in type:
            username = self.request.get("username")
            game.checkIn(username)
            game.confirmOthersActive(username)
            game.put()
            player = game.getPlayer(username)
            playerDict = player.as_dict()
            updates = player.updates
            requests = game.as_dict()["requests"]
            parameterDict = {
                "player": playerDict,
                "updates": updates,
                "requests": requests
            }
            playerJSON = json.dumps(parameterDict)
            self.response.write(playerJSON)
        elif "QUERY" in type:
            if "DISPLAYED" in type:
                username = self.request.get("username")
                player = game.getPlayer(username)
                if not player.displayed:
                    self.response.write("SUCCESS")
        else:
            self.abort(404)

    def post(self):
        type = self.request.get("type").split()
        gameID = self.request.get("gameID")
        username = self.request.get("username")
        game = None if "CREATE" in type else SH_Game.query().filter(SH_Game.gameID==gameID).fetch()[0]
        if "JOIN" in type:
            player = game.getPlayer(username)
            if player:
                if "FORCE" in type:
                    otherUsername = self.request.get("otherUser")
                    otherPlayer = game.getPlayer(otherUsername)
                    if otherPlayer:
                        self.response.write("SUCCESS")
                    else:
                        self.response.write("Invalid other username")
                else:
                    if "REQUEST" in type:
                        if player.displayed:
                            game.requestPlayerEntry(username)
                            game.put()
                            self.response.write("A request to join the game was sent to the other players")
                        else:
                            self.response.write("SUCCESS")
                    else:
                        self.response.write("There is already a player with username {} in this room {}".format(username,gameID))
            elif game.state == "INIT":
                game.registerNewPlayer(username)
                game.put()
                self.response.write("SUCCESS")
            else:
                self.response.write("This game is started already!")
        elif "CREATE" in type:
            game = SH_Game.defaultGame(gameID)
            game.registerNewPlayer(username)
            game.put()
            self.response.write("SUCCESS")
        elif "PLAYEREXIT" in type:
            game.checkOut(username)
            game.put()
            self.response.write(username+" marked as undisplayed.")
        elif "STARTGAME" in type:
            game.beginNewGame(username)
            game.put()
        elif "PICKPRESIDENT" in type:
            requestedPresident = self.request.get("name")
            if "DOCONFIRM" in type:
                game.requestFirstPres(requestedPresident, username)
                game.put()
                self.response.write("A request to elect " + requestedPresident + " was sent.")
            else:
                game.electPresident(requestedPresident, username)
                game.put()
                self.response.write(username + " elected " + requestedPresident + " as president.")
        elif "CHANCELLORCHOSEN" in type:
            chosenChancellor = self.request.get("chancellor")
            game.sendChancellorVoteRequest(chosenChancellor, username)
            game.put()
            self.response.write("A request to elect " + chosenChancellor + " was sent.")
        elif "VOTE" in type:
            chancellor = self.request.get("chancellor")
            president = self.request.get("president")
            if not game.voting(chancellor, president):
                return self.abort(404);
            decision = self.request.get("decision")
            game.registerVote(username, chancellor, decision)
            game.evaluateVote(chancellor)
            game.put()
        elif "DISCARDPOLICY" in type:
            policy = self.request.get("policy")
            if not game.presidentPicking(username, policy):
                self.abort(404)
            game.discardPolicy(policy)
            game.sendPoliciesToChancellor()
            game.put()
        elif "ENACTPOLICY" in type:
            policy = self.request.get("policy")
            if not game.chancellorPicking(username, policy):
                self.abort(404)
            game.enactPolicy(policy)
            game.put()
        elif "SENDVETO" in type:
            veto = self.request.get("veto")
            policy = self.request.get("policy")
            if not game.vetoPending(policy):
                self.abort(404)
            game.receiveVeto(veto, username, policy)
            game.put()
        elif "INVESTIGATE" in type:
            player = self.request.get("choice")
            game.investigate(player)
            game.put()
        elif "SPECIALELECTION" in type:
            presidentChoice = self.request.get("president")
            game.specialElection(presidentChoice)
            game.put()
        elif "KILL" in type:
            victim = self.request.get("victim")
            game.kill(victim)
            game.put()
        elif "NUKE" in type:
            victim = self.request.get("victim")
            game.nuke(victim)
            game.put()
        elif "NEWGAME" in type:
            game.startNewGame(username)
            game.put()
        elif "BEGINROUND" in type:
            game.nextRound()
            game.put()
            self.response.write("starting next round")
        elif "ACCEPTRQ" in type:
            requestID = self.request.get("requestID")
            game.processRequest(requestID)
            if "REJOIN" in type:
                acceptedUser = self.request.get("accepted")
                game.checkOut(acceptedUser)
                game.put()
                self.response.write(str(game.requests))
            elif "FIRSTPRESIDENT" in type:
                acceptedPres = self.request.get("accepted")
                game.acceptFirstPres(acceptedPres)
                game.put()
            else:
                return self.abort(404)
        else:
            return self.abort(404)
