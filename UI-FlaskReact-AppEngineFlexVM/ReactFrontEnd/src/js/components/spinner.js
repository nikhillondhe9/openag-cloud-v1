import React from 'react';

import spinner from '../../images/spinner.svg';

export class Spinner extends React.PureComponent {
    render() {
        return (
            <img
                src={spinner}
                {...this.props}/>
        )
    }
}
