import React from 'react';

/**
 * TimelapseImages
 *
 * props:
 * - images (array): array of image src.
 * - imageClass (string): className of the image.
 * - inputClass (string): className of the input.
 */
export class ImageTimelapse extends React.PureComponent {

    state = {
        index: 0
    }

    onSliderChange = (e) => {
        console.log(e.target.value);
        this.setState({index: e.target.value});
    }

    render() {
        return (
            <React.Fragment>
                <img
                    src={this.props.images[this.state.index]}
                    className={this.props.imageClass} />
                <input
                    className={this.props.inputClass}
                    type="range"
                    defaultValue="0"
                    min="0"
                    max={this.props.images.length - 1}
                    onChange={this.onSliderChange} />
            </React.Fragment>
        );
    }

}