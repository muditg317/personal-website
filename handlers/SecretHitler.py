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

    def post(self):
        pass

SECRET = "secret hitler is the best game ever"

class SecretHitlerData(webapp2.RequestHandler):
    def dispatch(self):
        secret = self.request.get("secret")
        if secret == SECRET:
            super(SecretHitlerData, self).dispatch()
        else:
            self.abort(403)
    def get(self):
        type = self.request.get("type")
        gameID = self.request.get("gameID")
        games = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()
        if len(games) == 0:
            return self.redirect("/game-lounge#secretHitler")
        elif len(games) > 1:
            return self.redirect("/game-lounge#secretHitler")
        else:
            game = games[0]
            if "UPDATE" in type.split():
                time.sleep(.5)
                username = self.request.get("username")
                player = next(iter(filter(lambda user: user.username == username, game.players)))
                if not player.displayed:
                    player.displayed = True
                    game.put()
                gameJSON = game.json()
                updated = False
                for i in range(len(game.requests)):
                    if "PENDING:"+username in game.requests[i]:
                        updated = True
                    game.requests[i] = game.requests[i].replace("PENDING:"+username,"")
                if updated:
                    game.put()
                self.response.write(gameJSON)
            elif "QUERY" in type.split():
                if "DISPLAYED" in type.split():
                    username = self.request.get("username")
                    player = next(iter(filter(lambda user: user.username == username, game.players)))
                    if not player.displayed:
                        self.response.write("SUCCESS")
            else:
                self.abort(404)

    def post(self):
        type = self.request.get("type")
        if "JOIN" in type.split():
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
                if player != None or game.state != "INIT":
                    if "FORCE" not in type.split():
                        if "REQUEST" in type.split():
                            request = "JOIN"+username
                            for member in players:
                                if member.username != player.username and member.displayed:
                                    request += "PENDING:"+member.username
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
                else:
                    newPlayer = SH_Player(username=username,displayed=False,uniqueID=random.randint(1000000000,9999999999))
                    # newPlayer.put()
                    game.players.append(newPlayer)
                    game.updates.append("PLAYERJOIN")
                    game.put()
                    self.response.write("SUCCESS")
        elif "CREATE" in type.split():
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
                game.put()
                self.response.write("SUCCESS")
        elif "PLAYEREXIT" in type.split():
            gameID = self.request.get("gameID")
            username = self.request.get("username")
            game = SH_Game.query().filter(SH_Game.gameID == gameID).fetch()[0]
            player = next(iter(filter(lambda user: user.username == username, game.players)))
            player.displayed = False
            game.put()
            self.response.write(username+" marked as undisplayed.")
        elif "UPDATE" in type.split():
            gameID = self.request.get("gameID")
            username = self.request.get("username")
            game = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()[0]
            player = next(iter(filter(lambda user: user.username == username, game.players)))
            if "POLICYREMOVE" in type.split():
                game.policies.pop(0)
                game.put()
        elif "ACCEPTJOINRQ" in type.split():
            gameID = self.request.get("gameID")
            acceptedUser = self.request.get("accepted")
            requestID = self.request.get("requestID")
            game = SH_Game.query().filter(SH_Game.gameID==gameID).fetch()[0]
            player = next(iter(filter(lambda user: user.username == acceptedUser, game.players)))
            player.displayed = False
            self.response.write(str(game.requests)+"\n\n")
            otherRequests = filter(lambda request: "ID:"+requestID not in request, game.requests)
            game.requests = otherRequests
            self.response.write(str(game.requests)+"\n\n")
            game.put()
        else:
            self.abort(404)
