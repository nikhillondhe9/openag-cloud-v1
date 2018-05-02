insert_user_query = """#standardsql
        SELECT
          FORMAT_TIMESTAMP( '%c', TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')), 'America/New_York') as eastern_time,
          REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)') as var,
          REGEXP_EXTRACT(id, r'(?:[^\~]*\~){5}([^~]*)') as device,  #replace the last '~' with a '-' to only show up to the -
          values

          FROM test.vals

          WHERE 'co2_t6713' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)')

          AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')) <= TIMESTAMP(CURRENT_DATE())
          AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')) >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))

          ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)') DESC 
          LIMIT 1"""

fetch_temp_results_history  = """#standardsql
            SELECT
              FORMAT_TIMESTAMP( '%c', TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')), 'America/New_York') as eastern_time,
              REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)') as var,
              REGEXP_EXTRACT(id, r'(?:[^\~]*\~){5}([^~]*)') as device,  #replace the last '~' with a '-' to only show up to the -
              values

              FROM test.vals

              WHERE 'temp_humidity_sht25' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)') AND starts_with(id, "FS-2-40") 

              AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')) <= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL 10 DAY))
              AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')) >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL 40 DAY))

              ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)') DESC 
              LIMIT 2000"""

fetch_co2_results_history = """#standardsql
    SELECT
      FORMAT_TIMESTAMP( '%c', TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')), 'America/New_York') as eastern_time,
      REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)') as var,
      REGEXP_EXTRACT(id, r'(?:[^\~]*\~){5}([^~]*)') as device,  #replace the last '~' with a '-' to only show up to the -
      values

      FROM test.vals

      WHERE 'co2_t6713' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)')

      AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')) <= TIMESTAMP(CURRENT_DATE())
      AND TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')) >= TIMESTAMP(DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))

      ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)') DESC 
      LIMIT 500"""

fetch_led_panel_history = """SELECT
  FORMAT_TIMESTAMP( '%c', TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')), 'America/New_York') as eastern_time,
  REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)') as var,
  REGEXP_EXTRACT(id, r'(?:[^\~]*\~){5}([^-]*)') as device,  
  values as row_values
  # , id
  FROM test.vals
  #WHERE starts_with(id, "Exp~")
  #WHERE starts_with(id, "EDU_Basil_test_grow_1~Cmd~")
  #WHERE starts_with(id, "EDU_Basil_test_grow_1")
  WHERE starts_with(id, "EDU_Basil_test_grow_2")
  #WHERE starts_with(id, "FS-2-40")
  #WHERE starts_with(id, "FS-2-40~Cmd")
  AND 'LED_panel' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)')
  ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)') DESC 
  LIMIT 50"""