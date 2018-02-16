
//-----------------------------------------------------------------------------
// EnvVar class - move to its own file later debugrob.
class EnvVar {
  constructor() {
    this.experiment = '';
    this.treatment = '';
    this.device = 'test-rack'; //debugrob, hardcode for now
    this.time = '';
    this.variable = '';
    this.value = '';
  }
}


//-----------------------------------------------------------------------------
// create the model class for commands and expose it to our app
module.exports = EnvVar;


