// Commands that are published to a device.

const PubSub = require('@google-cloud/pubsub');
const projectId = process.env.PROJECT_ID;
const psTopic = process.env.PUBSUB_TOPIC;
const DEVICE_ID = '288b5931-d089-43f0-b91f-32392ae72afb';

const PS = PubSub({ projectId: projectId });
const TOPIC = PS.topic( psTopic );
const PUBLISHER = TOPIC.publisher();


//-----------------------------------------------------------------------------
// Command class 
class Command {
    constructor() {
    }

    //-------------------------------------------------------------------------
    // Run a configuration (send all necessary commands).
    static sendRun( user, var1, var2, sched1, sched2, callback ) {
        console.log('Command: sendRun() called')

        // reset, load vars, add vars to treat 0, run treat 0
        Command.sendReset( function( err ) {
            return callback( err );
        });

        if( 0 < var1.length && 0 < sched1.length ) {
//debugrob: get the JSON of the sched1 recipe
            var recipe = "";
            Command.sendLoadRecipeIntoVariable( var1, recipe, function( err ) {
                return callback( err );
            });
            Command.sendAddVariableToTreatment( '0', var1, function( err ) {
                return callback( err );
            });
        }

        if( 0 < var2.length && 0 < sched2.length ) {
//debugrob: get the JSON of the sched2 recipe
            var recipe = "";
            Command.sendLoadRecipeIntoVariable( var2, recipe, function( err ) {
                return callback( err );
            });
            Command.sendAddVariableToTreatment( '0', var2, function( err ) {
                return callback( err );
            });
        }

        Command.sendRunTreatment( '0', function( err ) {
            return callback( err );
        });

        return callback( null );
    }

    //-------------------------------------------------------------------------
    // sendReset( function( err ) {} )
    static sendReset( callback ) {
        Command.send( 'Reset', '0', '0', callback );
    }

    //-------------------------------------------------------------------------
    // sendRunTreatment( treatment, function( err ) {} )
    static sendRunTreatment( treatment, callback ) {
        Command.send( 'RunTreatment', treatment, '0', callback );
    }

    //-------------------------------------------------------------------------
    // sendStopTreatment( treatment, function( err ) {} )
    static sendStopTreatment( treatment, callback ) {
        Command.send( 'StopTreatment', treatment, '0', callback );
    }

    //-------------------------------------------------------------------------
    // sendStatus( function( err ) {} )
    static sendStatus( callback ) {
        Command.send( 'Status', '0', '0', callback );
    }

    //-------------------------------------------------------------------------
    // sendLoadRecipeIntoVariable( variable, recipe, function( err ) {} )
    static sendLoadRecipeIntoVariable( variable, recipe, callback ) {
        Command.send( 'LoadRecipeIntoVariable', variable, recipe, callback );
    }

    //-------------------------------------------------------------------------
    // sendAddVariableToTreatment( treatment, variable, function( err ) {} )
    static sendAddVariableToTreatment( treatment, variable, callback ) {
        Command.send( 'AddVariableToTreatment', treatment, variable, callback);
    }

    //-------------------------------------------------------------------------
    // send( command, arg0, arg1, function( err ) {} )
    static send( command, arg0, arg1, callback ) {
        console.log( 'Command: send() ' + command + ', ' + arg0 + ', ' + arg1);
        var msg = {
            deviceID: DEVICE_ID,
            command: command,
            arg0: arg0,
            arg1: arg1
        };
        var jstr = JSON.stringify( msg );
        const data = Buffer.from( jstr );
        PUBLISHER.publish( data, function( err, messageId ) {
            if( err ) {
                return callback( err );
            }
        });

        return callback( null );
    }

}


//-----------------------------------------------------------------------------
// create the model class for commands and expose it to our app
module.exports = Command;


