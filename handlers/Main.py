import webapp2
import jinja2
import os
# from models import

the_jinja_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)+"/../templates/"),
    extensions=["jinja2.ext.autoescape"],
    autoescape=True)

class MainPage(webapp2.RequestHandler):
    def get(self):
        main_template = the_jinja_env.get_template("main/main.html")
        self.response.write(main_template.render({
        }))
