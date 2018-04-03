<a href="https://ibb.co/gRM3wc"><img src="https://preview.ibb.co/dUtu2H/Screen_Shot_2018_04_03_at_1_39_55_PM.png" alt="Screen_Shot_2018_04_03_at_1_39_55_PM" border="0"></a><br /><a target='_blank' href='https://imgbb.com/'>image hosting for ebay</a><br />

## 1. Users 

This table is almost all the things we would ask an user during sign up. 
  - Username
  - Email Address
  - Organization
  - Date added 
  - Password
  - fc_team - this is just a flag so that we can differentiate ourselves from regular users
  - User uuid - we need to start creating unique uuids for every user it's secure and aslo stops the dependence on the id's in SQL
  
 ## 2. User session
 
 This table is used to store login tokens for the users. This allows us to keep users logged in till their token expires. 
 
 - user_uuid 
 - session_token REQUIRED string
 - date_added REQUIRED string
 - expiration_date REQUIRED string
 
 ## 3. Devices
 
 A user can have multiple devices registered to his name. 
 
 - device_uuid  - unique device id
 - device_name NULL string - Totally optional too. 
 - device_reg_no string - 6 digit number from rob's work
 - device_notes NULL text - Any additional optional ntoes users can add 
 - recipe_uuid NULL - unique id of recipes
 - user_uuid NULL string -  Who the device belongs to
 - device_type REQUIRED string  - EDU or PFC or etc
 
  ## 4. DeviceHistory
 
 This table keeps a track of what recipe is running on what device, what recipe was run in the past and when that stopped. 
 
 - device_uuid PK int
 - recipe_uuid NULL string
 - date_added NULL timestamp
 - date_expired NULL timestamp
 
 ## 5. Recipe

 Recipe json holds the key-value pairs for the fields needed for a recipe. Recipes are created by an user so user uuid is attached 
 Every recipe is made up of different components - like for example - temp and humidity sensors are components of type SENSOR and for that type of sensor we have questions to answer like - how often do i publish my values? 
 The information about what questions need to be answered for a given component type are stored in the seperate component type table. 
 
 - recipe_uuid PK int
 - recipe_plant NULL string
 - created_from_uuid string
 - recipe_json NULL string
 - modified_at NULL string
 - user_uuid NULL string
 - components NULL string 

 
 ## 6. Components
 
 component_name are the sensor or actuator names and the component type is sensor or actuator etc. The fields json will have a array of json objects that will be sent to the front end which then uses the json to show the input fields needed for that component. for example- temperature may only need one input field to ask how often we want to publish it's values. So in the json we will have an arry like [{"type":"textnox","label":"How many should i publish my values"}]

- component_id PK int
- component_name NULL string
- component_type NULL string
- component_description string
- fields_json NULL json - fields json will be a json like this [{"field":"textbox","label":"How often do i publish my values"},{},{}]
- modified_at NULL string

 
