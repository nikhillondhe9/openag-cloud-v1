import React from 'react';
import {Button} from 'reactstrap';

/**
 * RecipeCard
 *
 * props:
 * - recipe (recipe object): recipe object that represents the recipe.
 * - onSelectRecipe (function): callback for when a recipe gets selected.
 * - onSaveRecipe (function): callback for when a recipe gets saved.
 * - onUnsaveRecipe (function): callback for when a recipe gets unsaved.
 */
export class RecipeCard extends React.Component {

    onSelectRecipe = (e) => {
        this.props.onSelectRecipe(e.target.value);
    }

    onSaveRecipe = (e) => {
        this.props.onSaveRecipe(e.target.value);
    }

    onUnsaveRecipe = (e) => {
        this.props.onUnsaveRecipe(e.target.value);
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
                    {this.props.recipe.saved ? (
                        <Button
                            value={this.props.recipe.recipe_uuid}
                            onClick={this.onUnsaveRecipe}
                        >
                            Unsave
                        </Button>
                    ) : (
                        <Button
                            value={this.props.recipe.recipe_uuid}
                            onClick={this.onSaveRecipe}
                        >
                            Save
                        </Button>
                    )}
                </div>
            </div>
        )
    }

}
