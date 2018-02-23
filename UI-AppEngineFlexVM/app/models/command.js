// Commands that are published to a device.

const PubSub = require('@google-cloud/pubsub');
const projectId = process.env.PROJECT_ID;
const psTopic = process.env.PUBSUB_TOPIC;

const PS = PubSub({ projectId: projectId });
const TOPIC = PS.topic( psTopic );
const PUBLISHER = TOPIC.publisher();

const TREATMENT_ID = '0'; 

// temporary JSON recipes
const recipes = [ 
'{ "dtype": "4", "measurement_period_ms": "60000", "num_cycles": "1", "curr_cycle": "0", "cycles": [ { "num_steps": "1", "num_repeats": "20", "curr_step": "0", "curr_repeat": "0", "steps": [ { "set_point": "0.000000", "duration": "120" } ] } ] }',  // measure every minute
'{ "dtype": "10", "measurement_period_ms": "500", "num_cycles": "1", "curr_cycle": "0", "cycles": [ { "num_steps": "62", "num_repeats": "60", "curr_step": "0", "curr_repeat": "0", "steps": [ { "set_point": ["255","255","255","255","255","255"], "duration": "1" }, { "set_point": ["255","180","255","255","255","255"], "duration": "1" }, { "set_point": ["255","150","255","255","255","255"], "duration": "1" }, { "set_point": ["255","100","255","255","255","255"], "duration": "1" }, { "set_point": ["255","50","255","255","255","255"], "duration": "1" }, { "set_point": ["255","0","255","255","255","255"], "duration": "1" }, { "set_point": ["255","50","255","255","255","255"], "duration": "1" }, { "set_point": ["255","100","255","255","255","255"], "duration": "1" }, { "set_point": ["255","150","255","255","255","255"], "duration": "1" }, { "set_point": ["255","180","255","255","255","255"], "duration": "1" }, { "set_point": ["255","255","255","255","255","255"], "duration": "1" }, { "set_point": ["255","255","180","255","255","255"], "duration": "1" }, { "set_point": ["255","255","150","255","255","255"], "duration": "1" }, { "set_point": ["255","255","100","255","255","255"], "duration": "1" }, { "set_point": ["255","255","50","255","255","255"], "duration": "1" }, { "set_point": ["255","255","0","255","255","255"], "duration": "1" }, { "set_point": ["255","255","50","255","255","255"], "duration": "1" }, { "set_point": ["255","255","100","255","255","255"], "duration": "1" }, { "set_point": ["255","255","150","255","255","255"], "duration": "1" }, { "set_point": ["255","255","180","255","255","255"], "duration": "1" }, { "set_point": ["255","255","255","255","255","255"], "duration": "1" }, { "set_point": ["255","255","255","180","255","255"], "duration": "1" }, { "set_point": ["255","255","255","150","255","255"], "duration": "1" }, { "set_point": ["255","255","255","100","255","255"], "duration": "1" }, { "set_point": ["255","255","255","50","255","255"], "duration": "1" }, { "set_point": ["255","255","255","0","255","255"], "duration": "1" }, { "set_point": ["255","255","255","50","255","255"], "duration": "1" }, { "set_point": ["255","255","255","100","255","255"], "duration": "1" }, { "set_point": ["255","255","255","150","255","255"], "duration": "1" }, { "set_point": ["255","255","255","180","255","255"], "duration": "1" }, { "set_point": ["255","255","255","255","255","255"], "duration": "1" }, { "set_point": ["255","255","255","255","180","255"], "duration": "1" }, { "set_point": ["255","255","255","255","150","255"], "duration": "1" }, { "set_point": ["255","255","255","255","100","255"], "duration": "1" }, { "set_point": ["255","255","255","255","50","255"], "duration": "1" }, { "set_point": ["255","255","255","255","0","255"], "duration": "1" }, { "set_point": ["255","255","255","255","50","255"], "duration": "1" }, { "set_point": ["255","255","255","255","100","255"], "duration": "1" }, { "set_point": ["255","255","255","255","150","255"], "duration": "1" }, { "set_point": ["255","255","255","255","180","255"], "duration": "1" }, { "set_point": ["255","255","255","255","255","255"], "duration": "1" }, { "set_point": ["255","255","255","255","255","180"], "duration": "1" }, { "set_point": ["255","255","255","255","255","150"], "duration": "1" }, { "set_point": ["255","255","255","255","255","100"], "duration": "1" }, { "set_point": ["255","255","255","255","255","50"], "duration": "1" }, { "set_point": ["255","255","255","255","255","0"], "duration": "1" }, { "set_point": ["255","255","255","255","255","50"], "duration": "1" }, { "set_point": ["255","255","255","255","255","100"], "duration": "1" }, { "set_point": ["255","255","255","255","255","150"], "duration": "1" }, { "set_point": ["255","255","255","255","255","180"], "duration": "1" }, { "set_point": ["255","255","255","255","255","255"], "duration": "1" }, { "set_point": ["180","255","255","255","255","255"], "duration": "1" }, { "set_point": ["150","255","255","255","255","255"], "duration": "1" }, { "set_point": ["100","255","255","255","255","255"], "duration": "1" }, { "set_point": ["50","255","255","255","255","255"], "duration": "1" }, { "set_point": ["0","255","255","255","255","255"], "duration": "1" }, { "set_point": ["50","255","255","255","255","255"], "duration": "1" }, { "set_point": ["100","255","255","255","255","255"], "duration": "1" }, { "set_point": ["150","255","255","255","255","255"], "duration": "1" }, { "set_point": ["150","255","255","255","255","255"], "duration": "1" }, { "set_point": ["255","255","255","255","255","255"], "duration": "1" }, { "set_point": ["255","255","255","255","255","255"], "duration": "1" } ] } ] }', // LED disco set points
'{ "dtype": "4", "measurement_period_ms": "4000", "num_cycles": "1", "curr_cycle": "0", "cycles": [ { "num_steps": "2", "num_repeats": "10", "curr_step": "0", "curr_repeat": "0", "steps": [ { "set_point": "800", "duration": "360" }, { "set_point": "0", "duration": "60" } ] } ] }'  // light control 800 LUX 
];


/* later: put in a utils.js if used.
//-----------------------------------------------------------------------------
function sleep( ms ) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
*/


////////////////////////////////
// private internal functions //
////////////////////////////////

//-----------------------------------------------------------------------------
/* send an array of commands.
{ 
    "deviceID": "<deviceID>", 
    "commands": [
        { 
            "command": "<command>", 
            "arg0": "<arg0>", 
            "arg1": "<arg1>"
        },
        { 
            "command": "<command>", 
            "arg0": "<arg0>", 
            "arg1": "<arg1>"
        }
    ]
}
 */
function send( commands ) {
    var jstr = JSON.stringify( commands );
    //console.log('send() ' + jstr );
    const data = Buffer.from( jstr );
    PUBLISHER.publish( data, function( err, internalPubSubMessageId ) {
        if( err ) {
            console.log( 'Error: Command: send(): ' + err );
            return false;
        }
    });
    return true;
}

//-----------------------------------------------------------------------------
function addCommandToArray( commands, command, arg0, arg1 ) {
    var cmd = {
        command: command,
        arg0: arg0,
        arg1: arg1
    };
    commands['commands'].push( cmd );
    return true;
}

//-----------------------------------------------------------------------------
function addReset( commands ) {
    addCommandToArray( commands, 'Reset', '0', '0' );
}

//-----------------------------------------------------------------------------
function addRunTreatment( commands, treatment ) {
    addCommandToArray( commands, 'RunTreatment', treatment, '0' );
}

//-----------------------------------------------------------------------------
function addStopTreatment( commands, treatment ) {
    addCommandToArray( commands, 'StopTreatment', treatment, '0' );
}

//-----------------------------------------------------------------------------
function addStatus( commands ) {
    addCommandToArray( commands, 'Status', '0', '0' );
}

//-----------------------------------------------------------------------------
function addLoadRecipeIntoVariable( commands, variable, recipe ) {
    addCommandToArray( commands, 'LoadRecipeIntoVariable', variable, recipe );
}

//-----------------------------------------------------------------------------
function addAddVariableToTreatment( commands, treatment, variable ) {
    addCommandToArray( commands, 'AddVariableToTreatment', treatment, variable);
}


//-----------------------------------------------------------------------------
// Command class (public)
class Command {
    constructor() {
    }

    //-------------------------------------------------------------------------
    // Send all the necessary commands to set up and run.
    // Returns the JSON string that is sent.
    static sendCommands( user, var1, var2, sched1, sched2, messageId, 
                         callback ) {
        console.log('Command: sendCommands() called')

        var commands = { 
            messageId: messageId,
            deviceId: user.DEVICE_ID,
            commands: []        // a empty JSON array of commands
        };

        addReset( commands );   // stop anything currently running and reset.

        if( 0 < var1.length && 0 < sched1.length ) {
            var recipe = "";
            if( "measure every minute" == sched1 ) {
                recipe = recipes[0];
            } else if( "LED disco set points" == sched1 ) {
                recipe = recipes[1];
            } else if( "light control 800 LUX" == sched1 ) {
                recipe = recipes[2];
            }
            addLoadRecipeIntoVariable( commands, var1, recipe );
            addAddVariableToTreatment( commands, TREATMENT_ID, var1 );
        }

        if( 0 < var2.length && 0 < sched2.length ) {
            var recipe = "";
            if( "measure every minute" == sched2 ) {
                recipe = recipes[0];
            } else if( "LED disco set points" == sched2 ) {
                recipe = recipes[1];
            } else if( "light control 800 LUX" == sched2 ) {
                recipe = recipes[2];
            }
            addLoadRecipeIntoVariable( commands, var2, recipe );
            addAddVariableToTreatment( commands, TREATMENT_ID, var2 );
        }

        addRunTreatment( commands, TREATMENT_ID ); 

        if( ! send( commands )) {
            callback( "Error in Commands send." );
            return "";
        }

        callback( null );

        // return the json for logging
        return JSON.stringify( commands );
    }

    //-------------------------------------------------------------------------
    // Send the stop command.
    static sendStop( user, messageId, callback ) {
        console.log('Command: sendStop() called')

        var commands = { 
            messageId: messageId,
            deviceId: user.DEVICE_ID,
            commands: []        // a empty JSON array of commands
        };

        addStopTreatment( commands, TREATMENT_ID ); 

        if( ! send( commands )) {
            callback( "Error in Commands send." );
            return "";
        }

        callback( null );
        return JSON.stringify( commands );
    }

    //-------------------------------------------------------------------------
    // Send the status command.
    static sendStatus( user, messageId, callback ) {
        console.log('Command: sendStatus() called')

        var commands = { 
            messageId: messageId,
            deviceId: user.DEVICE_ID,
            commands: []        // a empty JSON array of commands
        };

        addStatus( commands, TREATMENT_ID ); 

        if( ! send( commands )) {
            callback( "Error in Commands send." );
            return "";
        }

        callback( null );
        return JSON.stringify( commands );
    }
}


//-----------------------------------------------------------------------------
// create the model class for commands and expose it to our app
module.exports = Command;


