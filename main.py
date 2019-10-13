import webapp2
import sys
sys.path.append('../')
from handlers.BasePage import BasePage
from handlers.MainPage import MainPage
from seed_db import seed_db


class SeedDB(webapp2.RequestHandler):
    def get(self):
        seed_db()
        self.redirect("/main")

app = webapp2.WSGIApplication([
    ("/", BasePage),
    ("/seed-db",SeedDB),
    ("/main", MainPage),
], debug=True)
