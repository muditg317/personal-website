import webapp2
import sys
sys.path.append('../')
from handlers.BasePage import BasePage
from handlers.BailPage import BailPage
from handlers.ConfirmationPage import ConfirmationPage
from handlers.ConfirmationNewThreadPage import ConfirmationNewThreadPage
from handlers.CreatePage import CreatePage
from handlers.EditPage import EditPage
from handlers.HomePage import HomePage
from handlers.MyThreadsPage import MyThreadsPage
from handlers.WelcomePage import WelcomePage
from handlers.EditDrawingPage import EditDrawingPage
from handlers.EditCaptionPage import EditCaptionPage
from handlers.DrawingsHandler import DrawingsHandler
from seed_teleDrawing_db import seed_db
from handlers.RulesPage import RulesPage


class SeedDB(webapp2.RequestHandler):
    def get(self):
        seed_db()
        self.redirect("/home")

app = webapp2.WSGIApplication([
    ("/", BasePage),
    ("/bail", BailPage),
    # ("/seed-db",SeedDB),
    ("/confirmation",ConfirmationPage),
    ("/confirmation-newthread",ConfirmationNewThreadPage),
    ("/create", CreatePage),
    ("/edit", EditPage),
    ("/home", HomePage),
    ("/my-threads", MyThreadsPage),
    ("/welcome", WelcomePage),
    ('/edit-drawing', EditDrawingPage),
    ('/edit-caption', EditCaptionPage),
    ("/drawings",DrawingsHandler),
    ("/about",RulesPage),
], debug=True)
