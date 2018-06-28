import '../../scss/components/led_spectrum_options.scss';

import React from 'react';
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';
import {Button, Card, CardBody, CardFooter, CardTitle} from 'reactstrap';

const createSliderWithTooltip = Slider.createSliderWithTooltip;
const Range = createSliderWithTooltip(Slider.Range);
const Handle = Slider.Handle;

const handle = (props) => {
    const {value, dragging, index, ...restProps} = props;
    return (
        <Tooltip
            prefixCls="rc-slider-tooltip"
            overlay={value}
            visible={dragging}
            placement="top"
            key={index}
        >
            <Handle value={value} {...restProps} />
        </Tooltip>
    );
};

/**
 * LEDSpectrumOptions
 *
 * props:
 * - title (string): Title on the card
 * - prefix (string): on or off
 * - OnLEDPanelChange (function): callback for when a value changes
 */
export class LEDSpectrumOptions extends React.Component {


    OnLEDPanelChange = (led_data_type, color_channel, value) => {
        this.props.onLEDPanelChange(led_data_type, color_channel, value);
    };

    OnLEDSpectrumSelection = (led_data_type, color_channel, spectrum_type,value)=>{
             this.props.onLEDSpectrumSelection(led_data_type, color_channel, spectrum_type,value);
    };

    render() {
        return (
            <Card className="led-stats-card">
                <CardTitle>
                    {this.props.title}
                </CardTitle>
                <CardBody>
                    <Button onClick={this.OnLEDSpectrumSelection.bind(this, 'led_panel_dac5578', this.props.prefix + '_selected_spectrum','flat')} className={this.props.led_panel_dac5578[this.props.prefix + '_selected_spectrum']==="flat"? "selected-spectrum-button" : "spectrum-button"} > Flat (General)</Button>
                    <Button onClick={this.OnLEDSpectrumSelection.bind(this, 'led_panel_dac5578', this.props.prefix + '_selected_spectrum','low_end')} className={this.props.led_panel_dac5578[this.props.prefix + '_selected_spectrum']==="low_end"? "selected-spectrum-button" : "spectrum-button"}  > Low End (Blue-ish)</Button>
                    <Button onClick={this.OnLEDSpectrumSelection.bind(this, 'led_panel_dac5578', this.props.prefix + '_selected_spectrum','mid_end')} className={this.props.led_panel_dac5578[this.props.prefix + '_selected_spectrum']==="mid_end"? "selected-spectrum-button" : "spectrum-button"}  > Mid End (Green-ish)</Button>
                    <Button onClick={this.OnLEDSpectrumSelection.bind(this, 'led_panel_dac5578', this.props.prefix + '_selected_spectrum','high_end')} className={this.props.led_panel_dac5578[this.props.prefix + '_selected_spectrum']==="high_end"? "selected-spectrum-button" : "spectrum-button"} > High End (Red-ish)</Button>
                </CardBody>
                <CardFooter>
                    <div className="row">
                        <div className="col-md-4">
                            <span>Illumination Distance  <br/>   (in <i>cm</i>)</span>
                        </div>
                        <div className="col-md-6">
                            <Slider min={5} max={20}
                                    value={this.props.led_panel_dac5578[this.props.prefix + '_illumination_distance']}
                                    handle={handle}
                                    onChange={this.OnLEDPanelChange.bind(this, 'led_panel_dac5578', this.props.prefix + '_illumination_distance')}/>
                        </div>
                        <div className="col-md-2">
                            {this.props.led_panel_dac5578[this.props.prefix + '_illumination_distance']}
                        </div>
                    </div>
                </CardFooter>
            </Card>
        )
    }

}
