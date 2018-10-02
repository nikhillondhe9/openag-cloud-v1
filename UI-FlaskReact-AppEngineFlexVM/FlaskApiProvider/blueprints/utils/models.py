from .model import Model, StringProperty, DatetimeProperty, BoolProperty


class Users(Model):
    access_codes = StringProperty(repeated=True)
    date_added = DatetimeProperty()
    email_address = StringProperty()
    is_verified = BoolProperty()
    is_admin = BoolProperty()
    organization = StringProperty()
    password = StringProperty()
    profile_image = StringProperty()
    saved_recipes = StringProperty(repeated=True)
    user_uuid = StringProperty(use_as_key=True)
    username = StringProperty()
