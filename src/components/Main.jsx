import React from "react"
import IngredientsList from "../components/IngredientsList"
import ClaudeRecipe from "../components/ClaudeRecipe"
import { getRecipeFromChefClaude, getRecipeFromMistral } from "../ai"
import Loading from "./Loading"

export default function Main() {
    const [ingredients, setIngredients] = React.useState([])
    const [recipe, setRecipe] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const recipeSection = React.useRef(null)

    React.useEffect(()=>{
        if(recipe!=="" && recipeSection.current!==null){
            recipeSection.current.scrollIntoView({behavior:"smooth"})
        }
    },[recipe])
    async function getRecipe() {
        setLoading(true)
        const recipeMarkdown = await getRecipeFromChefClaude(ingredients)
        setRecipe(recipeMarkdown)
        setLoading(false)
    }

    function addIngredient(formData) {
        const newIngredient = formData.get("ingredient")
        if(newIngredient !=""){
            setIngredients(prevIngredients => [...prevIngredients, newIngredient])
        }
    }

    

    return (
        <main>
            <form action={addIngredient} className="add-ingredient-form">
                <input
                    type="text"
                    placeholder="e.g. oregano"
                    aria-label="Add ingredient"
                    name="ingredient"
                />
                <button>Add ingredient</button>
            </form>

            {ingredients.length > 0 &&
                <IngredientsList
                    ingredients={ingredients}
                    getRecipe={getRecipe}
                    ref = {recipeSection}
                />
            }
            {loading && <Loading />}
            {recipe && <ClaudeRecipe recipe={recipe} />}
        </main>
    )
}