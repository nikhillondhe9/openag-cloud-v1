export
InputFields = function (field) {
    if (field['type'] === "text_input") {
        return <div className="row input-modal-row">
            <span>Publish sensor values every</span>
            <Input value={this.state.T6713} onChange={this.sensorOnChange} id="SHT25" name="SHT25" type="text"/>
            <span>Seconds</span>
        </div>
    }
}