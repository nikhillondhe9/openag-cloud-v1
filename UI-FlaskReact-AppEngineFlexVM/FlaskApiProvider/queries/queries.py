# In BigQuery, in the vals table, the id field has tokens at the following
# indexes, delimited with '~' chars:
# The regex function indexes fields starting at zero!
# 0: Key
# 1: Variable Name
# 2: timestamp
# 3: Device ID


#------------------------------------------------------------------------------
def formatQuery( query, device_id ):
    return query.replace( 'PlaceHolderForDeviceUUID', device_id )


#------------------------------------------------------------------------------
# There is one replaceable {} parameter for device_id in this query:
fetch_temp_results_history = """#standardsql
SELECT
FORMAT_TIMESTAMP( '%c', TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){2}([^~]*)')), 'America/New_York') as eastern_time,
values
FROM openag_public_user_data.vals
WHERE 'air_humidity_percent' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){1}([^~]*)') 
AND 'PlaceHolderForDeviceUUID' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)')
AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){2}([^~]*)')) <= TIMESTAMP(CURRENT_DATE())
AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){2}([^~]*)')) >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){2}([^~]*)') DESC 
LIMIT 2500"""


#------------------------------------------------------------------------------
# There is one replaceable {} parameter for device_id in this query:
fetch_co2_results_history = """#standardsql
SELECT
FORMAT_TIMESTAMP( '%c', TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){2}([^~]*)')), 'America/New_York') as eastern_time,
values
FROM openag_public_user_data.vals
WHERE 'air_carbon_dioxide_ppm' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){1}([^~]*)')
AND 'PlaceHolderForDeviceUUID' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)')
AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){2}([^~]*)')) <= TIMESTAMP(CURRENT_DATE())
AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){2}([^~]*)')) >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){2}([^~]*)') DESC 
LIMIT 2500"""


#------------------------------------------------------------------------------
# There is one replaceable {} parameter for device_id in this query:
fetch_led_panel_history = """#standardsql
SELECT
FORMAT_TIMESTAMP( '%c', TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){2}([^~]*)')), 'America/New_York') as eastern_time,
values 
FROM openag_public_user_data.vals
WHERE 'light_spectrum_nm_percent' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){1}([^~]*)')
AND 'PlaceHolderForDeviceUUID' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)')
ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){2}([^~]*)') DESC 
LIMIT 50"""


#------------------------------------------------------------------------------
# There is one replaceable {} parameter for device_id in this query:
fetch_current_co2_value = """#standardsql
SELECT
FORMAT_TIMESTAMP( '%c', TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){2}([^~]*)')), 'America/New_York') as eastern_time,
values
FROM openag_public_user_data.vals
WHERE 'air_carbon_dioxide_ppm' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){1}([^~]*)')
AND 'PlaceHolderForDeviceUUID' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)')
ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){2}([^~]*)') DESC 
LIMIT 1"""



