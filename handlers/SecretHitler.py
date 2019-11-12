import webapp2
import jinja2
import os
from models import *

import time
import json
import random

the_jinja_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)+"/../templates/"),
    extensions=["jinja2.ext.autoescape"],
    autoescape=True)

class SecretHitlerPage(webapp2.RequestHandler):
    def get(self):
        time.sleep(1)
        gameID = self.request.get("gameID")
        username = self.request.get("username")
        games = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()
        if len(games) == 0:
            return self.redirect("/game-lounge#secretHitler"+str(games))
        elif len(games) > 1:
            return self.redirect("/game-lounge#secretHitler"+str(games))
        else:
            game = games[0]
            players = game.players
            player = next(iter(filter(lambda user: user.username == username, players)), None)
            if player == None:
                return self.redirect("/game-lounge#secretHitler"+str([user.username for user in players]))
            else:
                # return self.redirect("/game-lounge#"+str(player))
                if player.displayed:
                    return self.redirect("/game-lounge?displayed=true#secretHitler")
                else:
                    player.displayed = True
                    others = [pp.username for pp in filter(lambda user: user.username != username, players)]
                    game.put()
                    gameJSON = game.json()
                    secret_hitler_template = the_jinja_env.get_template("game_lounge/secret_hitler.html")
                    self.response.write(secret_hitler_template.render({
                        "gameID" : gameID,
                        "player" : player.username,
                        "others" : others,
                        "gameJSON" : gameJSON
                    }))

SECRET = "secret hitler is the best game ever"

class SecretHitlerData(webapp2.RequestHandler):
    def dispatch(self):
        secret = self.request.get("secret")
        if secret == SECRET:
            super(SecretHitlerData, self).dispatch()
        else:
            self.abort(403)
    def get(self):
        type = self.request.get("type").split()
        gameID = self.request.get("gameID")
        games = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()
        if len(games) == 0:
            return self.redirect("/game-lounge#secretHitler")
        elif len(games) > 1:
            return self.redirect("/game-lounge#secretHitler")
        else:
            game = games[0]
            if "UPDATE" in type:
                time.sleep(.5)
                username = self.request.get("username")
                player = next(iter(filter(lambda user: user.username == username, game.players)))
                if not player.displayed:
                    player.displayed = True
                    game.put()
                gameJSON = game.json()
                # updated = False
                # for i in range(len(game.requests)):
                #     if "PENDING:"+username in game.requests[i]:
                #         updated = True
                #     game.requests[i] = game.requests[i].replace("PENDING:"+username,"")
                # if updated:
                #     game.put()
                self.response.write(gameJSON)
            elif "QUERY" in type:
                if "DISPLAYED" in type:
                    username = self.request.get("username")
                    player = next(iter(filter(lambda user: user.username == username, game.players)))
                    if not player.displayed:
                        self.response.write("SUCCESS")
            else:
                self.abort(404)

    def post(self):
        type = self.request.get("type").split()
        if "JOIN" in type:
            gameID = self.request.get("gameID")
            username = self.request.get("username")
            games = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()
            if len(games) == 0:
                self.response.write("There is no game with id: {}".format(gameID))
            elif len(games) > 1:
                self.response.write("Uhhhhhh, there's multiple games with the same gameID... Please contact Mudit immediately.")
            else:
                game = games[0]
                players = game.players
                player = next(iter(filter(lambda user: user.username == username, players)), None)
                if player != None:
                    if "FORCE" not in type:
                        if "REQUEST" in type:
                            request = "JOIN"+username
                            # for member in players:
                            #     if member.username != player.username and member.displayed:
                            #         request += "PENDING:"+member.username
                            request += "ID:"+str(random.randint(10000,99999))
                            game.requests.append(request)
                            game.put()
                            self.response.write("A request to join the game was sent to the other players")
                        else:
                            self.response.write("There is already a player with username {} in this room {}".format(username,gameID))
                    else:
                        otherUser = self.request.get("otherUser")
                        found = False
                        if otherUser != username:
                            for player in players:
                                if otherUser == player.username:
                                    found = True
                                    break
                        if found:
                            self.response.write("SUCCESS")
                        else:
                            self.response.write("Invalid other username")
                elif game.state == "INIT":
                    newPlayer = SH_Player(username=username,displayed=False,uniqueID=random.randint(1000000000,9999999999))
                    game.players.append(newPlayer)
                    game.updates.append("PLAYERJOIN"+username)
                    game.put()
                    self.response.write("SUCCESS")
                else:
                    self.response.write("This game is started already!")
        elif "CREATE" in type:
            gameID = self.request.get("gameID")
            username = self.request.get("username")
            games = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()
            if len(games) == 1:
                self.response.write("There is already game with id: {}".format(gameID))
            elif len(games) > 1:
                self.response.write("Uhhhhhh, there's multiple games with the same gameID... Please contact Mudit immediately.")
            else:
                player = SH_Player(username=username,displayed=False,uniqueID=random.randint(1000000000,9999999999))
                game = SH_Game.defaultGame(gameID,[player])
                game.updates.append("PLAYERJOIN"+username)
                game.put()
                self.response.write("SUCCESS")
        elif "PLAYEREXIT" in type:
            gameID = self.request.get("gameID")
            username = self.request.get("username")
            game = SH_Game.query().filter(SH_Game.gameID == gameID).fetch()[0]
            player = next(iter(filter(lambda user: user.username == username, game.players)))
            player.displayed = False
            game.put()
            self.response.write(username+" marked as undisplayed.")
        elif "UPDATE" in type:
            gameID = self.request.get("gameID")
            username = self.request.get("username")
            game = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()[0]
            player = next(iter(filter(lambda user: user.username == username, game.players)))
            if "POLICYREMOVE" in type:
                game.policies.pop(0)
                game.put()
        elif "ACCEPTJOINRQ" in type:
            gameID = self.request.get("gameID")
            acceptedUser = self.request.get("accepted")
            requestID = self.request.get("requestID")
            game = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()[0]
            player = next(iter(filter(lambda user: user.username == acceptedUser, game.players)))
            player.displayed = False
            requestIndex = game.requests.index(next(iter(filter(lambda request: "ID:"+requestID in request, game.requests))))
            game.requests[requestIndex] += "PROCESSED"
            game.put()
            self.response.write(str(game.requests))
        elif "STARTGAME" in type:
            gameID = self.request.get("gameID")
            game = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()[0]
            username = self.request.get("username")
            game.state = "ROLES"
            game.updates.append("GAMESTARTED"+username)
            game.put()
            game.applyRoles()
            game.updates.append("ROLESGIVEN")
            game.put()
        elif "PICKPRESIDENT" in type:
            gameID = self.request.get("gameID")
            game = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()[0]
            pickerName = self.request.get("username")
            requestedPresident = self.request.get("name")
            if "DOCONFIRM" in type:
                request = "CONFIRMPRES"+requestedPresident+"BY"+pickerName
                # for member in game.players:
                #     if member.username != pickerName and member.username != requestedPresident:
                #         request += "PENDING:"+member.username
                request += "ID:"+str(random.randint(10000,99999))
                game.requests.append(request)
                game.updates.append("PRESIDENTCHOOSE"+requestedPresident+"BY"+pickerName)
                game.put()
                self.response.write("A request to elect " + requestedPresident + " was sent.")
            else:
                newPres = next(iter(filter(lambda user: user.username == requestedPresident, game.players)))
                game.president = newPres
                game.updates.append("PRESIDENTELECT"+requestedPresident+"BY"+pickerName)
                game.state = "CHOOSINGCHANCELLOR"+requestedPresident
                game.put()
        elif "ACCEPTPRESIDENT" in type:
            gameID = self.request.get("gameID")
            acceptedPres = self.request.get("accepted")
            requestID = self.request.get("requestID")
            game = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()[0]
            newPres = next(iter(filter(lambda user: user.username == acceptedPres, game.players)))
            game.president = newPres
            game.presidentIndex = game.players.index(newPres)
            game.updates.append("PRESIDENTELECT"+acceptedPres)
            game.state = "CHOOSINGCHANCELLOR"+acceptedPres
            request = next(iter(filter(lambda request: "ID:"+requestID in request, game.requests)))
            request += "PROCESSED"
            game.put()
        elif "CHOOSECHANCELLOR" in type:
            gameID = self.request.get("gameID")
            game = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()[0]
            chosenChancellor = self.request.get("chosen")
            president = self.request.get("president")
            update = "VOTENOW"+chosenChancellor+"BY"+president
            game.updates.append(update)
            game.votes = []
            game.voted = []
            game.state = "VOTING"+chosenChancellor
            game.put()
            self.response.write("A request to elect " + chosenChancellor + " was sent.")
        elif "VOTE" in type:
            gameID = self.request.get("gameID")
            game = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()[0]
            username = self.request.get("username")
            if "VOTING" not in game.state:
                return self.abort(404);
            chancellor = self.request.get("chancellor")
            if chancellor not in game.state:
                return self.abort(404);
            decision = self.request.get("decision")
            president = self.request.get("president")
            if president != game.president.username:
                return self.abort(404)
            game.votes.append(decision)
            game.voted.append(username)
            game.updates.append("VOTESENT"+chancellor+"CHOICE"+decision+"BY"+username)
            voteResult = game.getVoteResult()
            self.response.write(str(game.votes))
            if voteResult[0]:
                if voteResult[1]:
                    game.updates.append("CHANCELLORELECT"+chancellor+"BY"+president)
                    newChance = next(iter(filter(lambda user: user.username == chancellor, game.players)))
                    game.chancellor = newChance
                    game.consecutiveDowns = 0
                    game.makePolicySet()
                    policySetString = "L"*game.policySet.count("liberal")+"F"*game.policySet.count("fascist")
                    game.updates.append("PRESIDENTPOLICYCHOOSE"+president+"POLICIES"+policySetString)
                    game.state = "PRESIDENTPOLICY"+president
                else:
                    game.updates.append("CHANCELLORFAIL"+chancellor+"BY"+president)
                    game.consecutiveDowns += 1
                    if game.consecutiveDowns == 3:
                        forcedPolicy = game.policies.pop(0)
                        game.passPolicy(forcedPolicy)
                        game.updates.append("POLICYPASS-FORCED"+forcedPolicy+"BY"+president+"CHANCE"+chancellor)
                        game.consecutiveDowns = 0
                    game.updates.append("ROUNDCOMPLETE")
            game.put()
        elif "DISCARDPOLICY" in type:
            gameID = self.request.get("gameID")
            game = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()[0]
            if "PRESIDENTPOLICY" not in game.state:
                self.abort(404)
            president = self.request.get("username")
            if president not in game.state:
                return self.abort(404);
            policy = self.request.get("policy")
            if policy not in game.policySet:
                return self.abort(404)
            game.policySet.remove(policy)
            game.discard.append(policy)
            game.updates.append("POLICYDISCARD"+president)
            chancellor = game.chancellor.username
            policySetString = "L"*game.policySet.count("liberal")+"F"*game.policySet.count("fascist")
            game.updates.append("CHANCELLORPOLICYCHOOSE"+chancellor+"POLICIES"+policySetString)
            game.state = "CHANCELLORPOLICY"+chancellor
            game.put()
        elif "ENACTPOLICY" in type:
            gameID = self.request.get("gameID")
            game = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()[0]
            if "CHANCELLORPOLICY" not in game.state:
                self.abort(404)
            chancellor = self.request.get("username")
            if chancellor not in game.state:
                return self.abort(404);
            policy = self.request.get("policy")
            if policy not in game.policySet:
                return self.abort(404)
            game.discard += game.policySet
            game.policySet = []
            # game.updates.append("POLICYENACT"+chancellor)
            game.passPolicy(policy)
            game.updates.append("POLICYPASS"+policy+"BY"+game.president.username+"CHANCE"+chancellor)
            game.updates.append("ROUNDCOMPLETE" + str(game.numLiberalPassed) + "FFF" + str(game.numFascistPassed))
            game.put()
        elif "BEGINROUND" in type:
            gameID = self.request.get("gameID")
            game = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()[0]
            game.presidentIndex += 1
            game.presidentIndex %= len(game.players)
            game.president = game.players[game.presidentIndex]
            game.updates.append("PRESIDENTELECT"+game.president.username)
            game.state = "CHOOSINGCHANCELLOR"+game.president.username
            game.put()
        else:
            return self.abort(404)
        # self.response.write("SUCCESS")
