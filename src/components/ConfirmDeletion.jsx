import { useEffect } from "react";

export default function ConfirmDeletion(props) {

    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === "Escape") props.onCancel();
        }
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    function handleDelete() {
        props.onDelete(props.recipeId); // run deletion
        props.onCancel();               // close the modal
    }

    return (
        <section className="Loading">
            <div className="wrapper">
                <h1>{props.title}</h1>
                <p>{props.message}</p>
                <div className="button-wrapper">
                    <button className="cancel-btn" onClick={props.onCancel}>Cancel</button>
                    <button className="delete-btn" onClick={handleDelete}>Delete</button>
                </div>
            </div>
        </section>
    );
} 
