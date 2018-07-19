# All common database code.  For BigQuery and Datastore.

import ast
from google.cloud import bigquery
from google.cloud import datastore

# Eventually we won't query BigQuery because it is so slow.  
# Perhaps someday we will use it again for a research console that 
# uses a lot of historical data.
# This should be the only place we use queries.
from queries import queries

from .env_variables import bigquery_client
from .env_variables import datastore_client
from .datastore import get_one

# keys for datastore Devices entity
DS_Devices_KEY = 'Devices'
DS_env_vars_KEY = 'env_vars'
DS_device_uuid_KEY = 'device_uuid'
DS_co2_KEY = 'air_carbon_dioxide_ppm'
DS_rh_KEY = 'air_humidity_percent' 
DS_temp_KEY = 'air_temperature_celcius'
DS_led_KEY = 'light_spectrum_nm_percent'
DS_status_KEY = 'status'  # not used yet debugrob


# NOTE: The XX_from_BQ() methods are only used if there is no data found
# in the Datastore.   Eventually we will phase out the BQ functions (slow).


#------------------------------------------------------------------------------
# Get the historical CO2 values for this device.  
# Returns a list.
def get_co2_history_from_BQ( device_uuid ):
    if device_uuid is None or device_uuid is 'None':
        return []
    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False

    query_str = queries.formatQuery(
        queries.fetch_co2_results_history, device_uuid )

    query_job = bigquery_client.query( query_str, job_config=job_config )
    query_result = query_job.result()
    results = []
    for row in list( query_result ):
        values_json = (ast.literal_eval( row[ 1 ] ))
        if "values" in values_json:
            values = values_json["values"]
            results.append( {'value': values[0]['value'], 
                             'time': row.eastern_time} )
    return results


#------------------------------------------------------------------------------
# Generic function to return a float value from BQ for the given query.
# Returns a float or None.
def get_current_float_value_from_BQ( query, device_uuid ):
    if device_uuid is None or device_uuid is 'None':
        return None
    # Use a NEW QueryJobConfig for each query, or you will get  this error: 
    # google.api_core.exceptions.BadRequest: 
    # 400 Cannot explicitly modify anonymous table
    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False
    query_str = queries.formatQuery( query, device_uuid )
    query_job = bigquery_client.query( query_str, job_config=job_config )
    query_result = query_job.result()
    for row in list( query_result ):
        values_json = (ast.literal_eval( row[ 1 ] ))
        if "values" in values_json:
            values = values_json["values"]
            return "{0:.2f}".format( float( values[0]['value'] ))
    return None # no data


#------------------------------------------------------------------------------
# Get a list of the led panel historical values.
# Returns a list.
def get_led_panel_history_from_BQ( device_uuid ):
    if device_uuid is None or device_uuid is 'None':
        return []
    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False
    query_str = queries.formatQuery(
        queries.fetch_led_panel_history, device_uuid )
    query_job = bigquery_client.query( query_str, job_config=job_config)
    query_result = query_job.result()
    result_json = []
    for row in list( query_result ):
        values_json = ast.literal_eval( row[ 1 ] )
        if "values" in values_json:
            values = values_json["values"]
            if len(values) > 0:
                led_json = values[0]['value']
                result_json.append( led_json )
    return result_json



#------------------------------------------------------------------------------
# Get a dict with two arrays of the temp and humidity historical values.
# Returns a dict.
def get_temp_and_humidity_history_from_BQ( device_uuid ):

    humidity_array = []
    temp_array = []
    result_json = {
        'RH': humidity_array,
        'temp': temp_array
    }
    if device_uuid is None or device_uuid is 'None':
        return result_json 

    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False
    query_str = queries.formatQuery(
        queries.fetch_temp_results_history, device_uuid )
    query_job = bigquery_client.query( query_str, job_config=job_config)
    query_result = query_job.result()
    for row in list(query_result):
        rvalues = row[2] # can't use row.values
        values_json = (ast.literal_eval(rvalues))

        if 'air_temperature_celcius' == row.var and 'values' in values_json:
            values = values_json["values"]
            result_json["temp"].append(
                {'value': values[0]['value'], 'time': row.eastern_time})

        if 'air_humidity_percent' == row.var and 'values' in values_json:
            values = values_json["values"]
            result_json["RH"].append(
                {'value': values[0]['value'], 'time': row.eastern_time})
    return result_json 


#------------------------------------------------------------------------------
# Get the historical CO2 values for this device.  
# Returns a list.
def get_co2_history( device_uuid ):
    if device_uuid is None or device_uuid is 'None':
        return []

    # First, try to get the data from the datastore...
    device = get_one(
        kind=DS_Devices_KEY, key=DS_device_uuid_KEY, value=device_uuid
    )
    env_vars = device.get( DS_env_vars_KEY )
    if env_vars is None or DS_co2_KEY not in env_vars:
        # If we didn't find any data in the DS, look in BQ...
        return get_co2_history_from_BQ( device_uuid )

    # process the env_vars dict from the DS into the same format as BQ
    results = []
    valuesList = env_vars[ DS_co2_KEY ]
    for val in valuesList:
        print('debugrob get_co2_history: val={}'.format(val))
        ts = val['timestamp']
        if isinstance( ts, bytes ):
            ts = ts.decode( 'utf-8' )
        results.append( {'value': val['value'], 'time': ts })
    print('debugrob get_co2_history: results={}'.format(results))
    return results


#------------------------------------------------------------------------------
# Get a list of the led panel historical values.
# Returns a list.
def get_led_panel_history( device_uuid ):
    if device_uuid is None or device_uuid is 'None':
        return []
    # First, try to get the data from the datastore...
    device = get_one(
        kind=DS_Devices_KEY, key=DS_device_uuid_KEY, value=device_uuid
    )
    env_vars = device.get( DS_env_vars_KEY )
    if env_vars is None or DS_led_KEY not in env_vars:
        # If we didn't find any data in the DS, look in BQ...
        return get_led_panel_history_from_BQ( device_uuid )

    # process the env_vars dict from the DS into the same format as BQ
    results = []
    valuesList = env_vars[ DS_led_KEY ]
    for val in valuesList:
        print('debugrob get_led_panel_history: val={}'.format(val))
        led_json = val['value']
        results.append( led_json )
    print('debugrob get_led_panel_history: results={}'.format(results))
    return results


#------------------------------------------------------------------------------
# Get a dict with two arrays of the temp and humidity historical values.
# Returns a dict.
def get_temp_and_humidity_history( device_uuid ):
    humidity_array = []
    temp_array = []
    result_json = {
        'RH': humidity_array,
        'temp': temp_array
    }
    if device_uuid is None or device_uuid is 'None':
        return result_json 

    # First, try to get the data from the datastore...
    device = get_one(
        kind=DS_Devices_KEY, key=DS_device_uuid_KEY, value=device_uuid
    )
    env_vars = device.get( DS_env_vars_KEY )
    if env_vars is None or \
            ( DS_temp_KEY not in env_vars and \
              DS_rh_KEY not in env_vars ):
        # If we didn't find any data in the DS, look in BQ...
        return get_temp_and_humidity_history_from_BQ( device_uuid )

    # process the env_vars dict from the DS into the same format as BQ

    # Get temp values
    if DS_temp_KEY in env_vars:
        valuesList = env_vars[ DS_temp_KEY ]
        for val in valuesList:
            ts = val['timestamp']
            if isinstance( ts, bytes ):
                ts = ts.decode( 'utf-8' )
            result_json["temp"].append( {'value': val['value'], 'time': ts })

    # Get RH values
    if DS_rh_KEY in env_vars:
        valuesList = env_vars[ DS_rh_KEY ]
        for val in valuesList:
            ts = val['timestamp']
            if isinstance( ts, bytes ):
                ts = ts.decode( 'utf-8' )
            result_json["RH"].append( 
                    {'value': val['value'], 'time': ts })

    print('debugrob get_temp_and_humidity_history: results={}'.format(result_json))
    return result_json


#------------------------------------------------------------------------------
# Generic function to return a float value from Device.env_vars[key]
def get_current_float_value_from_DS( key, device_uuid ):
    if device_uuid is None or device_uuid is 'None':
        return None

    device = get_one( kind=DS_Devices_KEY, key=DS_device_uuid_KEY, value=device_uuid )
    if device is None:
        return None
    print('debugrob type of device: {}'.format(type(device)))
    print('debugrob device: {}'.format( device ))
    env_vars = device.get( DS_env_vars_KEY )
    if env_vars is None or key not in env_vars:
        return None

    # process the env_vars dict from the DS into the same format as BQ
    result = None
    valuesList = env_vars[ key ]
    val = valuesList[0] # the first item in the list is most recent
    print('debugrob get_current_float_value_from_DS: val={}'.format(val))
    result = "{0:.2f}".format( float( val['value'] ))
    print('debugrob get_current_float_value_from_DS: key={}, result={}'.format(key, result))
    return result


#------------------------------------------------------------------------------
# Get the current CO2 value for this device.  
# Returns a float or None.
def get_current_CO2_value( device_uuid ):
    # First: look in the Datastore Device data dict...
    result = get_current_float_value_from_DS( DS_co2_KEY, device_uuid )
    if result is not None:
        return result

    # Second: do a big (slow) query
    return get_current_float_value_from_BQ( 
            queries.fetch_current_co2_value, device_uuid )

#------------------------------------------------------------------------------
# Get the current temp value for this device.
# Returns a float or None.
def get_current_temp_value( device_uuid ):
    # First: look in the Datastore Device data dict...
    result = get_current_float_value_from_DS( DS_temp_KEY, device_uuid )
    if result is not None:
        return result

    # Second: do a big (slow) query
    return get_current_float_value_from_BQ( 
            queries.fetch_current_temperature_value, device_uuid )

#------------------------------------------------------------------------------
# Get the current RH value for this device.
# Returns a float or None.
def get_current_RH_value( device_uuid ):
    # First: look in the Datastore Device data dict...
    result = get_current_float_value_from_DS( DS_rh_KEY, device_uuid )
    if result is not None:
        return result

    # Second: do a big (slow) query
    return get_current_float_value_from_BQ( 
            queries.fetch_current_RH_value, device_uuid )


