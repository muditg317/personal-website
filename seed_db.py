from models import *


def seed_db():
    gameQuery = SH_Game.query()
    entries = gameQuery.fetch()
    for game in entries:
        # game.requests = []
        # game.votes = []
        # game.voted = []
        # game.updates = game.updates[:-1]
        # for player in game.players:
        #     player.displayed = False
        # game.updates.pop(-1)
        # game.policySet.append("fascist")
        # game.updates[-1]+="F"
        game.policies.remove("fascist");
        game.policies.append("liberal");
        game.put()
