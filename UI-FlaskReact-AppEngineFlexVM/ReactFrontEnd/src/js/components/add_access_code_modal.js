import React from 'react';
import {
    Button,
    Form,
    FormGroup,
    Input,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter
} from 'reactstrap';

const DEFAULT_STATE = {
    access_code: ''
};

/**
 * AddAccessCodeModal
 *
 * props
 * - isOpen (bool): Whether modal is open.
 * - toggle (function): Callback for opening and closing the modal.
 * - onSubmit (function): Callback for form submission. Will be called
 * with the state, which contains the form responses.
 * - error_message (string): Error message to display.
 */
export class AddAccessCodeModal extends React.PureComponent {

    state = DEFAULT_STATE;

    onChange = (e) => {
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
        return (
            <Modal
                isOpen={this.props.isOpen}
                toggle={this.toggle}
                className={this.props.className}
            >
                <ModalHeader toggle={this.toggle}>
                    Enter a access code
                </ModalHeader>
                <Form onSubmit={this.onSubmit}>
                    <ModalBody>
                        {this.props.error_message &&
                            <p style={{color: 'red'}}>
                                {this.props.error_message}
                            </p>
                        }
                        <FormGroup>
                            <Input
                                type="number" name="access_code"
                                min="100000" max="999999"
                                placeholder="6-digit Access Code"
                                value={this.state.access_code}
                                onChange={this.onChange} required
                            />
                        </FormGroup>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" type="submit">
                            Submit
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
