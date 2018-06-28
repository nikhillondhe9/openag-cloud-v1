import React from 'react';
import {Button, Modal, ModalBody, ModalFooter, ModalHeader} from 'reactstrap';

/**
 * DeviceIsRunningModal
 *
 * props
 * - isOpen (bool): Whether the modal is open.
 * - toggle (function): Callback for toggling modal
 * - className
 * - onApplyToDevice (function): Callback for when the user confirms the application.
 */
export class DeviceIsRunningModal extends React.PureComponent {

    render() {
        return (
            <Modal
                isOpen={this.props.isOpen}
                toggle={this.props.toggle}
                className={this.props.className}
            >
                <ModalHeader
                    toggle={this.props.toggle}
                >
                    Warning
                </ModalHeader>
                <ModalBody>
                    There's an existing recipe running on the device. Are you sure you
                    want to continue?
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" onClick={this.props.onApplyToDevice}>Apply</Button>
                    <Button color="secondary" onClick={this.props.toggle}>Cancel</Button>
                </ModalFooter>
            </Modal>
        );
    }

}
