import webapp2
import jinja2
import os
from google.appengine.api import users,images
from models import ThreadContent,Drawing,Caption,TeleUser,Thread,Edit

the_jinja_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)+"/../templates/"),
    extensions=["jinja2.ext.autoescape"],
    autoescape=True)

class HomePage(webapp2.RequestHandler):
    def get(self):
        request = self.request.get("request")
        user = users.get_current_user()
        if not user:
            self.redirect("/welcome")
        else:
            teleUser = TeleUser.get_by_id(user.user_id())
            if not teleUser:
                print "no teleUser"
                teleUser = TeleUser.fromGSI(user=user)
                teleUser.put()
                print teleUser
            thread_entity_list = Thread.query().fetch()
            user_bailOuts = [bailOut_key.get() for bailOut_key in teleUser.bailOuts]
            user_open_threads = []
            for thread in thread_entity_list:
                bailed = False
                for bailOut in user_bailOuts:
                    if thread.key == bailOut.thread:
                        bailed = True
                        break
                if not bailed:
                    user_open_threads.append(thread)
            # print user_open_threads
            edits_by_thread = {}
            for thread in user_open_threads:
                thread_key = thread.key
                edit_entity_list = Edit.query().filter(Edit.thread==thread_key).fetch()
                if edit_entity_list:
                    edit_entity_list.sort(key=lambda x: x.addition.get().date)
                    for edit in edit_entity_list:
                        print edit.thread.id(),":",edit.thread.get().thread_id,":",edit.addition.kind()
                edits_by_thread[str(thread_key.id())]=edit_entity_list
            # for thread_id in edits_by_thread:
            #     print thread_id,":"
            #     for edit in edits_by_thread[thread_id]:
            #         print edit
            # drawing_entity_list = Drawing.query().order(Drawing.date).fetch()
            # # drawing_entity_list.sort(key=lambda x: x.date)
            # caption_entity_list = Caption.query().order(Caption.date).fetch()
            # # caption_entity_list.sort(key=lambda x: x.date)
            home_template = the_jinja_env.get_template("home.html")
            self.response.write(home_template.render({
                "request":request,
                "user_info":teleUser,
                "logout_url":users.create_logout_url("/welcome"),
                "threads":user_open_threads,
                "edits_by_thread":edits_by_thread,
                # "drawings":drawing_entity_list,
                # "captions":caption_entity_list
            }))
