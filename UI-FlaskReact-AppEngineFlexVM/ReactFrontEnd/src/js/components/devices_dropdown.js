import React from 'react';
import {
    Dropdown,
    DropdownToggle,
    DropdownMenu,
    DropdownItem
} from 'reactstrap';

/**
 * DevicesDropdown
 *
 * props
 * - devices (array): Device objects to display.
 * - selectedDevice (string): Name of the currently selected device.
 * - onSelectDevice (function): callback for when a device is selected from
 * the dropdown. Called with the device uuid.
 * - onAddDevice (function): callback for when "Add a new device" is clicked.
 * - onAddAccessCode (function): callback for when "Add access code" is
 * clicked.
 */
export class DevicesDropdown extends React.PureComponent {

    state = {
        isOpen: false
    }

    toggle = () => {
        this.setState(prevState => {
            return { isOpen: !prevState.isOpen };
        });
    }

    onSelectDevice = (e) => {
        this.props.onSelectDevice(e.target.value);
    }

    render() {
        return (
            <Dropdown isOpen={this.state.isOpen} toggle={this.toggle} >
                <DropdownToggle caret>
                    {this.props.selectedDevice}
                </DropdownToggle>
                <DropdownMenu>
                    <DropdownItem header>Devices</DropdownItem>
                    {this.props.devices.map(device =>
                        <DropdownItem
                            key={device.device_uuid}
                            value={device.device_uuid}
                            onClick={this.onSelectDevice}>
                            {device.device_name} ({device.device_reg_no})
                        </DropdownItem>
                    )}
                    <DropdownItem divider />
                    <DropdownItem onClick={this.props.onAddDevice}>
                        Add new device
                    </DropdownItem>
                    <DropdownItem onClick={this.props.onAddAccessCode}>
                        Add access code
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        );
    }

}
