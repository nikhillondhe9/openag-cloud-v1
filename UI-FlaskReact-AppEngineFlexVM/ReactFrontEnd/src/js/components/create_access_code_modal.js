import React from 'react';
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Form,
    FormGroup,
    Button
} from 'reactstrap';

/**
 * CreateAccessCodeModal
 *
 * props
 * - isOpen (bool): Whether modal is open.
 * - toggle (function): Callback to toggle modal.
 * - onSubmit (function): Callback for submission (will be called with
 *   modal state)
 * - devices (array): Array of device objects.
 */
export class CreateAccessCodeModal extends React.PureComponent {

    state = {};

    resetState = () => {
        let default_state = {};
        for (const device of this.props.devices) {
            default_state[device.device_uuid] = '';
        }
        this.setState(default_state);
    }

    toggle = () => {
        this.resetState();
        this.props.toggle()
    }

    onSubmit = (e) => {
        e.preventDefault();
        this.props.onSubmit(this.state);
        this.resetState();
   }

    onChange = (e) => {
        // Need to persist event because we are using it asynchronously.
        e.persist();
        this.setState(prevState => {
            if (prevState[e.target.name] == e.target.value) {
                return {[e.target.name]: ''};
            } else {
                return {[e.target.name]: e.target.value};
            }
        })
    }

    render() {
        return (
            <Modal
                isOpen={this.props.isOpen}
                toggle={this.toggle}
                className={this.props.className}
            >
                <Form onSubmit={this.onSubmit}>
                    <ModalHeader toggle={this.toggle}>
                        <i>Select which devices to share</i>
                    </ModalHeader>
                    <ModalBody className="create-access-code-body">
                        <div></div>
                        <div>View</div>
                        <div>Control</div>
                        {this.props.devices.map(device =>
                            <React.Fragment key={device.device_uuid}>
                                <div className="device-name">{device.device_name}</div>

                                {/* Using native input because we don't want bootstrap styles here. */}
                                <input
                                    type="checkbox" aria-label="View"
                                    name={device.device_uuid}
                                    value="view"
                                    disabled={device.permissions != 'control'}
                                    checked={this.state[device.device_uuid] == 'view'}
                                    onChange={this.onChange}
                                />
                                <input type="checkbox" aria-label="Control"
                                    name={device.device_uuid}
                                    value="control"
                                    disabled={device.permissions != 'control'}
                                    checked={this.state[device.device_uuid] == 'control'}
                                    onChange={this.onChange}
                                />
                            </React.Fragment>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" type="submit">
                            Get Access Code
                        </Button>
                        <Button color="secondary" onClick={this.toggle}>
                            Close
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>
        )
    }

}
