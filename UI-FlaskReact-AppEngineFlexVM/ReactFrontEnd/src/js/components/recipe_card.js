import React from 'react';
import {Button} from 'reactstrap';

/**
 * RecipeCard
 *
 * props:
 * - recipe (recipe object): recipe object that represents the recipe.
 * - onSelectRecipe (function): callback for when a recipe gets selected.
 */
export class RecipeCard extends React.PureComponent {

    onSelectRecipe = (e) => {
        this.props.onSelectRecipe(e.target.value);
    }

    render() {
        return (
            <div className="card recipe-card">
                <div className="card-body">
                    <h5 className="card-title">
                        {this.props.recipe.name}
                    </h5>
                    <img src={this.props.recipe.image_url} />
                    <h6 className="text-muted">
                        {this.props.recipe.description}
                    </h6>
                </div>
                <div className="card-footer">
                    <Button
                        value={this.props.recipe.recipe_uuid}
                        onClick={this.onSelectRecipe}
                    >
                        View Recipe
                    </Button>
                </div>
            </div>
        )
    }

}
