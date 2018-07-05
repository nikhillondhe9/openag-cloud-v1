import React from 'react';
import { Button, Input } from 'reactstrap';
import "../../scss/components/image_uploader.scss";

/**
 * ImageUploader
 *
 * props:
 * - url (string): The url endpoint to POST to.
 * - data (object): Object whose contents get sent as form
 * data.
 * - onDone (function): Callback for a successful upload, will
 * be called with the decoded json response.
 */
export class ImageUploader extends React.PureComponent {

    uploadImage = (e) => {
        console.log("Upoading image...");

        let image = e.target.files[0];
        let imageForm = new FormData();
        imageForm.append('file', image);

        for (let key in this.props.data) {
            imageForm.append(key, this.props.data[key]);
        }

        fetch(this.props.url, {
            method: 'POST',
            body: imageForm
        })
        .then(response => response.json())
        .then(responseJson => {
            this.props.onDone(responseJson);
            console.log(responseJson);
        })
        .catch((error) => {
            console.error(error);
        })
    }

    render() {
        return (
            <Button className="image-uploader">
                Change Picture
                <Input
                    type="file"
                    name="file"
                    onChange={this.uploadImage}
                    accept="image/*"
                    {...this.props} />
            </Button>
        );
    }

}
