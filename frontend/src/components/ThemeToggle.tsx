import { useEffect } from "react"

export function ThemeToggle() {
    // Force dark mode
    useEffect(() => {
        const root = window.document.documentElement
        root.classList.remove("light")
        root.classList.add("dark")
        localStorage.setItem("theme", "dark")
    }, [])

    // Return null to not render the toggle button
    return null
}
