#------------------------------------------------------------------------------
insert_user_query = """#standardsql
SELECT
FORMAT_TIMESTAMP( '%c', TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')), 'America/New_York') as eastern_time,
REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)') as var,
REGEXP_EXTRACT(id, r'(?:[^\~]*\~){5}([^~]*)') as device,  
values
FROM test.vals
WHERE 'co2_t6713' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)')
AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')) <= TIMESTAMP(CURRENT_DATE())
AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')) >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)') DESC 
LIMIT 1"""


#------------------------------------------------------------------------------
def formatQuery( query, device_id ):
    return query.replace( 'PlaceHolderForDeviceUUID', device_id )


#------------------------------------------------------------------------------
# There is one replaceable {} parameter for device_id in this query:
fetch_temp_results_history = """#standardsql
SELECT
FORMAT_TIMESTAMP( '%c', TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')), 'America/New_York') as eastern_time,
values
FROM test.vals
WHERE 'temp_humidity_sht25' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)') 
AND 'PlaceHolderForDeviceUUID' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){5}([^~]*)')
AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')) <= TIMESTAMP(CURRENT_DATE())
AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')) >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)') DESC 
LIMIT 2500"""


#------------------------------------------------------------------------------
# There is one replaceable {} parameter for device_id in this query:
fetch_co2_results_history = """#standardsql
SELECT
FORMAT_TIMESTAMP( '%c', TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')), 'America/New_York') as eastern_time,
values
FROM test.vals
WHERE 'co2_t6713' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)')
AND 'PlaceHolderForDeviceUUID' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){5}([^~]*)')
AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')) <= TIMESTAMP(CURRENT_DATE())
AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')) >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)') DESC 
LIMIT 2500"""


#------------------------------------------------------------------------------
# There is one replaceable {} parameter for device_id in this query:
fetch_led_panel_history = """#standardsql
SELECT
FORMAT_TIMESTAMP( '%c', TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')), 'America/New_York') as eastern_time,
values 
FROM test.vals
WHERE 'LED_panel' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)')
AND 'PlaceHolderForDeviceUUID' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){5}([^~]*)')
ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)') DESC 
LIMIT 50"""


#------------------------------------------------------------------------------
# There is one replaceable {} parameter for device_id in this query:
fetch_current_co2_value = """#standardsql
SELECT
FORMAT_TIMESTAMP( '%c', TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')), 'America/New_York') as eastern_time,
values
FROM test.vals
WHERE 'co2_t6713' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)')
AND 'PlaceHolderForDeviceUUID' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){5}([^~]*)')
ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)') DESC 
LIMIT 1"""



