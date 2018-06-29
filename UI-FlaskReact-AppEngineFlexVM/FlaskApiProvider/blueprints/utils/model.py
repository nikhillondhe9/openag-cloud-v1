"""Base model class for Google Cloud Datastore

Works like Django's or any other ORM. Define classes that correspond with
Entities, like this

    class Users(Model):
        access_codes = StringProperty(repeated=True)
        date_added = DatetimeProperty()
        email_address = StringProperty()
        is_verified = BoolProperty()
        organization = StringProperty()
        password = StringProperty()
        profile_image = StringProperty()
        saved_recipes = StringProperty(repeated=True)
        user_uuid = StringProperty()
        username = StringProperty()

It uses the class name as the Entity type in the datastore. You can use
model classes like this

    jason = Users(username="json", email="test@example.com")
    jason.password = hash_password("somePassword")
    jason.put()

And the entity will be saved to the datastore. In addition, there are class
methods on model classes that query the datastore for you and converts the
results into model objects.

    jason = Users.get_one(filters=[
        ["username", "=", "json"]
    ])
    jason.username = "jason_new_name"
    jason.put()

The filters have the same syntax as query filters for datastore.Query. You can
also specify an order.

Property classes have validation methods. Each type has its own validation,
and custom validators could be specified. Validators should throw TypeError
if the value fails validation, perform necessary transformations and always
return the value at the end.

    def validator(value):
        if value > 5:
            return value
        return 5

    class Person(Model):
        age = NumberProperty(validator=validator)

    dude = Person()
    dude.age = 0  # age will be set to 5
    dude.age = "a string"  # will throw TypeError
"""
from datetime import datetime

from google.cloud import datastore
from .env_variables import datastore_client

class Model:
    def __init__(self, **kwargs):
        for name, value in kwargs.items():
            setattr(self, name, value)

    def __setattr__(self, name, value):
        if name == "_id":
            self.__dict__[name] = value
            return

        # If there's a class attribute with the name that is a
        # Property, validate and set the value.
        prop = getattr(self.__class__, name)
        if isinstance(prop, Property):
            value = prop.do_validate(value)
            self.__dict__[name] = value
        else:
            raise AttributeError("Can only assign to attributes that are"
                                 " Properties.")

    def put(self):
        not_indexed = []
        for name, value in self.__dict__.items():
            if name == "_id":
                continue
            prop = getattr(self.__class__, name)
            if isinstance(prop, Property) and not prop.indexed:
                not_indexed.append(name)

        if hasattr(self, "_id"):
            key = datastore_client.key(self.__class__.__name__, self._id)
        else:
            key = datastore_client.key(self.__class__.__name__)

        entity = datastore.Entity(key,
                                  exclude_from_indexes=not_indexed)
        entity.update(self.__dict__)
        entity.pop("_id", None)
        datastore_client.put(entity)
        self._id = entity.id

    @classmethod
    def get(cls, filters=[], order=[], limit=None):
        query = datastore_client.query(kind=cls.__name__, order=order)
        for query_filter in filters:
            query.add_filter(*query_filter)
        results = list(query.fetch(limit=limit))
        entities = []
        for entity in results:
            entity_object = cls(**entity)
            entity_object._id = entity.id
            entities.append(entity_object)
        return entities

    @classmethod
    def get_one(cls, filters=[], order=[]):
        result = cls.get(filters, order, limit=1)
        if result:
            return result[0]
        return None

class Property:
    """Base class for data properties."""
    def __init__(self, repeated=False, validator=None, indexed=True):
        self.repeated = repeated
        self.indexed = indexed

        if validator is not None and not hasattr(validator, "__call__"):
            raise ValueError("validator must be callable.")
        self.custom_validator = validator

    def _validate(self, value):
        if self.custom_validator is not None:
            value = self.custom_validator(value)
        return value

    def do_validate(self, value):
        if self.repeated:
            if not isinstance(value, (list, set, frozenset)):
                raise TypeError(f"Expected a list or a set, got {value}")
            return [self._validate(x) for x in value]
        else:
            return self._validate(value)

class StringProperty(Property):
    def _validate(self, value):
        value = super()._validate(value)
        if isinstance(value, bytes):
            # Decode from UTF-8 -- if this fails, we can't write it.
            try:
                value = value.decode("utf-8")
            except UnicodeError:
                raise TypeError(f"Expected valid UTF-8, got {value}")
        elif not isinstance(value, str):
            raise TypeError(f"Expected string, got {value}")
        return value

class NumberProperty(Property):
    def _validate(self, value):
        value = super()._validate(value)
        if not isinstance(value, (int, float)):
            raise TypeError(f"Expected number, got {value}")
        return value

class DatetimeProperty(Property):
    def _validate(self, value):
        value = super()._validate(value)
        if not isinstance(value, datetime):
            raise TypeError(f"Expected datetime, got {value}")
        return value

class BoolProperty(Property):
    def _validate(self, value):
        value = super()._validate(value)
        if not isinstance(value, bool):
            raise TypeError(f"Expected bool, got {value}")
        return value
