import { Link } from "react-router-dom"

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">

        <div className="container mx-auto text-center text-gray-600 dark:text-gray-400">
            <p>
                &copy; {new Date().getFullYear()} campus-taxi-mini/ All rights reserved.
            </p>
            <div className={"flex justify-center space-x-4 mt-4"}>
                <Link to={"#"}>Privacy Policy</Link>
                <Link to={"#"}>Terms of Service</Link>
                <Link to={"#"}>Contact</Link>
            </div>
        </div>
        
    </footer>
  )
}

export default Footer