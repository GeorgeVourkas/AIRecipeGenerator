import React from "react"
import IngredientsList from "../components/IngredientsList"
import ClaudeRecipe from "../components/ClaudeRecipe"
import { getRecipeFromChefClaude } from "../ai"
import Loading from "./Loading"

export default function Main() {
    const [ingredients, setIngredients] = React.useState([])
    const [recipe, setRecipe] = React.useState("")
    const [loading, setLoading] = React.useState(false)
    const [history, setHistory] = React.useState([])
    const [showHistory, setShowHistory] = React.useState(false)  // new
    const recipeSection = React.useRef(null)

    React.useEffect(() => {
        fetch("http://localhost:8080/api/recipes/history")
            .then(res => res.json())
            .then(data => setHistory(data))
    }, [])

    async function deleteRecipe(id) {
        await fetch(`http://localhost:8080/api/recipes/${id}`, { method: "DELETE" })
        setHistory(prev => prev.filter(r => r.id !== id))
    }

    async function getRecipe() {
        setLoading(true)
        const recipeMarkdown = await getRecipeFromChefClaude(ingredients)
        setRecipe(recipeMarkdown)
        fetch("http://localhost:8080/api/recipes/history")
            .then(res => res.json())
            .then(data => setHistory(data))
        setLoading(false)
    }

    function addIngredient(formData) {
        const newIngredient = formData.get("ingredient")
        if (newIngredient != "") {
            setIngredients(prevIngredients => [...prevIngredients, newIngredient])
        }
    }

    if (showHistory) {
        return (
            <main>
                <button onClick={() => setShowHistory(false)}>← Back to recipes</button>
                <h2>Recipe History</h2>
                {history.length === 0 && <p>No recipes saved yet!</p>}
                {history.map(r => (
                    <div key={r.id} style={{border: "1px solid #ccc", borderRadius: "8px", padding: "16px", marginBottom: "16px"}}>
                        <p style={{fontSize: "12px", color: "gray"}}>{new Date(r.createdAt).toLocaleString()}</p>
                        <p>{r.content.substring(0, 200)}...</p>
                        <button onClick={() => deleteRecipe(r.id)} style={{color: "red"}}>Delete</button>
                    </div>
                ))}
            </main>
        )
    }

    return (
        <main>
            <button onClick={() => setShowHistory(true)}>View History</button>
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
                    ref={recipeSection}
                />
            }
            {loading && <Loading />}
            {recipe && <ClaudeRecipe recipe={recipe} />}
        </main>
    )
}