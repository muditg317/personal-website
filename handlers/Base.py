import webapp2
import jinja2
import os
1569# from models import

the_jinja_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)+"/../templates/"),
    extensions=["jinja2.ext.autoescape"],
    autoescape=True)


class BasePage(webapp2.RequestHandler):
    def get(self):
        self.redirect("/main")
