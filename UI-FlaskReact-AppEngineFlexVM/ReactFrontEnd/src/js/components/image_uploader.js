import React from 'react';
import { Input } from 'reactstrap';

/**
 * ImageUploader
 *
 * props:
 * - url (string): The url endpoint to POST to.
 * - onDone (function): Callback for a successful upload, will
 * be called with a file object representing the image.
 */
export class ImageUploader extends React.PureComponent {

    uploadImage = (e) => {
        console.log("Upoading image...");

        let image = e.target.files[0];
        let imageForm = new FormData();
        imageForm.append('file', image);

        fetch(this.props.url, {
            method: 'POST',
            body: imageForm
        })
        .then(response => {
            if (response.ok) {
                this.props.onDone(image);
            }
            return response.json();
        })
        .then(responseJson => {
            console.log(responseJson);
        })
        .catch((error) => {
            console.error(error);
        })
    }

    render() {
        return (
            <Input type="file" name="file" onChange={this.uploadImage} />
        );
    }

}
