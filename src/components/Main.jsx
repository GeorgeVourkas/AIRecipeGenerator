import React from "react";
import IngredientsList from "../components/IngredientsList";
import ClaudeRecipe from "../components/ClaudeRecipe";
import { getRecipeFromChefClaude } from "../ai";
import Loading from "./Loading";
import ReactMarkdown from "react-markdown";
import ConfirmDeletion from "./confirmDeletion";
export default function Main() {
  const [ingredients, setIngredients] = React.useState([
    "Oregano",
    "pizza dough",
    "tomato",
    "salad",
  ]);
  const [recipe, setRecipe] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [history, setHistory] = React.useState([]);
  const [showHistory, setShowHistory] = React.useState(false);
  const [deletionProccess, setDeletionProccess] = React.useState(false);
  const recipeSection = React.useRef(null);
  const [toast, setToast] = React.useState("");

  //Messages
  const recipeLoadingMessage = "Please wait.Chef is preparing your recipe!";
  const deletionTitleMessage = "Recipe Deletion";
  const deletionDetailsMessage = "Are you sure you want to delete this recipe?";
  React.useEffect(() => {
    fetch("http://localhost:8080/api/recipes/history")
      .then((res) => res.json())
      .then((data) => setHistory(data));
  }, []);

  async function deleteRecipe(id) {
    await fetch(`http://localhost:8080/api/recipes/${id}`, {
      method: "DELETE",
    });
    setHistory((prev) => prev.filter((r) => r.id !== id));
    setToast("Recipe deleted!");
    setTimeout(() => setToast(""), 3000); // hides after 3 seconds
  }
  async function getRecipe() {
    setLoading(true);
    const recipeMarkdown = await getRecipeFromChefClaude(ingredients);
    setRecipe(recipeMarkdown);
    fetch("http://localhost:8080/api/recipes/history")
      .then((res) => res.json())
      .then((data) => setHistory(data));
    setLoading(false);
  }

  function addIngredient(formData) {
    const newIngredient = formData.get("ingredient");
    if (newIngredient != "") {
      setIngredients((prevIngredients) => [...prevIngredients, newIngredient]);
    }
  }

  function resetForm() {
    setRecipe(false);
    setIngredients([]);
  }

  function changeDeletionStatus() {}
  if (showHistory) {
    return (
      <main className="recipes-history-main">
        {toast && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              background: "#534AB7",
              color: "#fff",
              padding: "12px 20px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              zIndex: 1000,
            }}
          >
            {toast}
          </div>
        )}
        <nav className="navigation">
          <button
            onClick={() => setShowHistory(false)}
            className="navigation-btn"
          >
            ← Back to recipes
          </button>
        </nav>

        <h2>Recipe History</h2>
        {history.length === 0 && <p>No recipes saved yet!</p>}
        <div className="recipes-container">
          {history.map((r) => (
            <div key={r.id} className="recipe-wrapper">
              {deletionProccess && (
                <ConfirmDeletion
                  title={deletionTitleMessage}
                  message={deletionDetailsMessage}
                  recipeId={r.id}
                  onDelete={deleteRecipe}
                  onCancel={() => setDeletionProccess(false)}
                />
              )}
              <p style={{ fontSize: "12px", color: "gray" }}>
                {new Date(r.createdAt).toLocaleString()}
              </p>
              <ReactMarkdown>{r.content}</ReactMarkdown>
              {console.log(r)}
              <div className="wrapper-footer">
                <button onClick={() => setDeletionProccess(true)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main>
      <nav className="navigation">
        <button onClick={() => setShowHistory(true)} className="navigation-btn">
          Recipe History
        </button>
      </nav>
      <form action={addIngredient} className="add-ingredient-form">
        <input
          type="text"
          placeholder="e.g. oregano"
          aria-label="Add ingredient"
          name="ingredient"
        />
        <button>Add ingredient</button>
      </form>

      {ingredients.length > 0 && (
        <IngredientsList
          ingredients={ingredients}
          getRecipe={getRecipe}
          ref={recipeSection}
        />
      )}
      <nav className="navigation">
        {recipe && (
          <button className="navigation-btn" onClick={resetForm}>
            Reset Recipe{" "}
          </button>
        )}
      </nav>
      {loading && <Loading message={recipeLoadingMessage} />}
      {recipe && <ClaudeRecipe recipe={recipe} />}
    </main>
  );
}
