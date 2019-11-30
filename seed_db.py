from models import *



def seed_db():
    gameQuery = SH_Game.query()
    games = gameQuery.fetch()
    for game in games:
        game.offerNextRound()
        game.put()
