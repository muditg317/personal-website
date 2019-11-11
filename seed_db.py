from models import *


def seed_db():
    gameQuery = SH_Game.query()
    entries = gameQuery.fetch()
    for game in entries:
        game.requests = []
        for player in game.players:
            player.displayed = False
        game.put()
