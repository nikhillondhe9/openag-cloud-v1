import React from 'react';
import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';

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
 * LEDPanelCard
 *
 * props:
 * - title (string): Title on the card
 * - prefix (string): on or off
 * - OnLEDPanelChange (function): callback for when a value changes
 */
export class LEDPanelCard extends React.Component {


    OnLEDPanelChange = (led_data_type, color_channel,value) => {
        this.props.onLEDPanelChange(led_data_type,color_channel,value);
    }

    render() {
        return (
            <div className="card led-stats-card">
                <div className="card-block">
                    <h4 className="card-title "> {this.props.title} </h4>
                    <div className="card-text">
                        <div className="graph">
                            <div className="">
                                <div className="row colors-row">
                                    <div className="col-md-4">
                                        <span>Cool White</span>
                                    </div>
                                    <div className="col-md-6">
                                        <Slider
                                            onChange={this.OnLEDPanelChange.bind(this, 'led_panel_dac5578', this.props.prefix+'_cool_white')}
                                            min={0} max={100}
                                            value=   {this.props.led_panel_dac5578[this.props.prefix+'_cool_white']}
                                            handle={handle}/>
                                    </div>
                                    <div className="col-md-2">
                                       {this.props.led_panel_dac5578[this.props.prefix+'_cool_white']}
                                    </div>
                                </div>
                                <div className="row colors-row">
                                    <div className="col-md-4">
                                        <span>Warm White</span>
                                    </div>
                                    <div className="col-md-6">
                                        <Slider
                                            onChange={this.OnLEDPanelChange.bind(this, 'led_panel_dac5578', this.props.prefix+'_warm_white')}
                                            min={0} max={100}
                                            value={this.props.led_panel_dac5578[this.props.prefix+'_warm_white']}
                                            handle={handle}/>
                                    </div>
                                    <div className="col-md-2">
                                     {this.props.led_panel_dac5578[this.props.prefix+'_warm_white']}
                                    </div>
                                </div>
                                <div className="row colors-row">
                                    <div className="col-md-4">
                                        <span>Blue</span>
                                    </div>
                                    <div className="col-md-6">
                                        <Slider
                                            onChange={this.OnLEDPanelChange.bind(this, 'led_panel_dac5578', this.props.prefix+'_blue')}
                                            min={0} max={100}
                                            value={this.props.led_panel_dac5578[this.props.prefix+'_blue']}
                                            handle={handle}/>
                                    </div>
                                    <div className="col-md-2">
                                       {this.props.led_panel_dac5578[this.props.prefix+'_blue']}
                                    </div>
                                </div>
                                <div className="row colors-row">
                                    <div className="col-md-4">
                                        <span>Green</span>
                                    </div>
                                    <div className="col-md-6">
                                        <Slider
                                            onChange={this.OnLEDPanelChange.bind(this, 'led_panel_dac5578', this.props.prefix+'_green')}
                                            min={0} max={100}
                                           value={this.props.led_panel_dac5578[this.props.prefix+'_green']}
                                            handle={handle}/>
                                    </div>
                                    <div className="col-md-2">
                                       {this.props.led_panel_dac5578[this.props.prefix+'_green']}
                                    </div>
                                </div>
                                <div className="row colors-row">
                                    <div className="col-md-4">
                                        <span>Red</span>
                                    </div>
                                    <div className="col-md-6">
                                        <Slider
                                            onChange={this.OnLEDPanelChange.bind(this, 'led_panel_dac5578', this.props.prefix+'_red')}
                                            min={0} max={100}
                                             value={this.props.led_panel_dac5578[this.props.prefix+'_red']}
                                            handle={handle}/>
                                    </div>
                                    <div className="col-md-2">
                                        {this.props.led_panel_dac5578[this.props.prefix+'_red']}
                                    </div>
                                </div>
                                <div className="row colors-row">
                                    <div className="col-md-4">
                                        <span>Far Red</span>
                                    </div>
                                    <div className="col-md-6">
                                        <Slider
                                            onChange={this.OnLEDPanelChange.bind(this, 'led_panel_dac5578', this.props.prefix+'_far_red')}
                                            min={0} max={100}
                                           value={this.props.led_panel_dac5578[this.props.prefix+'_far_red']}
                                            handle={handle}/>
                                    </div>
                                    <div className="col-md-2">
                                     {this.props.led_panel_dac5578[this.props.prefix+'_far_red']}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card-footer">
                    <div className="row">
                        <div className="col-md-4">
                            <span>Illumination Distance  <br/>   (in <i>cm</i>)</span>
                        </div>
                        <div className="col-md-6">
                            <Slider min={5} max={20}
                                    value={this.props.led_panel_dac5578[this.props.prefix+'_illumination_distance']}
                                    handle={handle}
                                    onChange={this.OnLEDPanelChange.bind(this, 'led_panel_dac5578', this.props.prefix+'_illumination_distance')}/>
                        </div>
                        <div className="col-md-2">
                           {this.props.led_panel_dac5578[this.props.prefix+'_illumination_distance']}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

}
