import webapp2
import jinja2
import os
# from models import

the_jinja_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)+"/../templates/"),
    extensions=["jinja2.ext.autoescape"],
    autoescape=True)

class GameLoungePage(webapp2.RequestHandler):
    def get(self):
        displayed = self.request.get("displayed")
        game_lounge_template = the_jinja_env.get_template("game_lounge/game_lounge.html")
        self.response.write(game_lounge_template.render({
            "displayed": displayed
        }))
