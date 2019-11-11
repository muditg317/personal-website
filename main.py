import webapp2
import sys
sys.path.append('../')
from handlers.Base import BasePage
from handlers.Main import MainPage
from handlers.GameLounge import GameLoungePage
from handlers.SecretHitler import SecretHitlerPage
from handlers.SecretHitler import SecretHitlerData
from seed_db import seed_db


class SeedDB(webapp2.RequestHandler):
    def get(self):
        seed_db()
        self.redirect("/main")

app = webapp2.WSGIApplication([
    ("/", BasePage),
    ("/seed-db",SeedDB),
    ("/main", MainPage),
    ("/game-lounge", GameLoungePage),
    ("/game-lounge/secret-hitler", SecretHitlerPage),
    ("/game-lounge/secret-hitler/data", SecretHitlerData),
], debug=True)
