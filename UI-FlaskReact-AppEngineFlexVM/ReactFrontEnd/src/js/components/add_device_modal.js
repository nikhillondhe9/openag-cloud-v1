import React from 'react';
import {
    Button,
    Form,
    FormGroup,
    Input,
    Label,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter
} from 'reactstrap';

const DEFAULT_STATE = {
    device_name: '',
    device_reg_no: '',
    device_notes: '',
    device_type: 'EDU'
};

/**
 * AddDeviceModal
 *
 * props
 * - isOpen (bool): Whether modal is open.
 * - toggle (function): Callback for opening and closing the modal.
 * - onSubmit (function): Callback for form submission. Will be called
 * with the state, which contains the form responses.
 * - error_message (string): Error message to be displayed.
 * - device_reg_no (string): Device registration number to display.
 */
export class AddDeviceModal extends React.PureComponent {

    state = DEFAULT_STATE;

    onChange = (e) => {
        console.log("Me")
        console.log(e.target.value)
        console.log(e.target.name)
        this.setState({[e.target.name]: e.target.value});
    }

    onSubmit = (e) => {
        e.preventDefault();
        this.props.onSubmit(this.state);
    }

    // Clears any input before closing
    toggle = () => {
        this.setState(DEFAULT_STATE);
        this.props.toggle();
    }

    render() {
        // we must use the property set externally to update the state
        this.state.device_reg_no = this.props.device_reg_no;
        return (
            <Modal
                isOpen={this.props.isOpen}
                toggle={this.toggle}
                className={this.props.className}
            >
                <ModalHeader toggle={this.toggle}>
                    New Device Registration
                </ModalHeader>
                <Form onSubmit={this.onSubmit}>
                    <ModalBody>
                        {this.props.error_message &&
                            <p style={{color: 'red'}}>
                                {this.props.error_message}
                            </p>
                        }
                        <FormGroup>
                            <Label for="device_name">Device name :</Label>
                            <Input
                                type="text" name="device_name" id="device_name"
                                placeholder="E.g Caleb's FC" value={this.state.device_name}
                                onChange={this.onChange} required
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="device_reg_no">Device Number :</Label>
                            <Input
                                type="text" name="device_reg_no" id="device_reg_no"
                                value={this.state.device_reg_no}
                                onChange={this.onChange}
                                required
                           />
                        </FormGroup>
                        <FormGroup>
                            <Label for="device_notes">Device Notes :</Label>
                            <Input
                                type="text" name="device_notes" id="device_notes"
                                placeholder="(Optional)" value={this.state.device_notes}
                                onChange={this.onChange}
                            />
                        </FormGroup>
                        <FormGroup>
                            <Label for="device_type">Device Type :</Label>
                            <select
                                className="form-control smallInput"
                                name="device_type" id="device_type"
                                onChange={this.onChange}
                                value={this.state.device_type}
                            >
                                <option value="EDU">Personal Food Computer+EDU</option>
                                <option value="FS">Food Server</option>
                            </select>
                        </FormGroup>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" type="submit">
                            Register Device
                        </Button>
                        <Button color="secondary" onClick={this.toggle}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>
        )
    }

}
