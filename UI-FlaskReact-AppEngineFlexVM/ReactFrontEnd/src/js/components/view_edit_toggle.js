import React from 'react';
import "../../scss/components/view_edit_toggle.scss";
import classNames from 'classnames';

export class ViewEditToggle extends React.PureComponent {

    state = {
        isEdit: false
    }

    toggle = () => {
        this.setState(prevState => {
            return {isEdit: !prevState.isEdit};
        });
    }

    render() {

        return (
            <div className="view-edit-container pull-right">
                <div className="btn-group btn-toggle">
                    <button className={classNames({'btn': true, 'active-button': !this.state.isEdit})} onClick={(e) => {
                        this.props.onSelectMode();
                        this.toggle();
                    }}>View Mode
                    </button>
                    <button className={classNames({'btn': true, 'active-button': this.state.isEdit})} onClick={(e) => {
                        this.props.onSelectMode();
                        this.toggle();
                    }}>Edit Mode
                    </button>
                </div>
            </div>
        );


    }
}


