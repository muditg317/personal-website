from models import *



def seed_db():
    gameQuery = SH_Game.query()
    games = gameQuery.fetch()
    for game in games:
        game.requests = []
        for player in game.players:
            player.updates[-2:]=[]
        game.put()
