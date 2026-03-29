import { use, useState ,useEffect} from "react"

export default function Loading(props){
    const [dots, setDots] = useState("")

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? "" : prev + ".")
        }, 800)

        return () => clearInterval(interval)
    }, [])
    
    return(
        <section className="Loading">
            <div className="wrapper">
                <h1>Loading <span className="dots">{dots}</span></h1>
                <p>{props.message}</p>
            </div>
        </section>
    )


}