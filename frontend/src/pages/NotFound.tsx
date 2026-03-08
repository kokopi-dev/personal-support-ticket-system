import { Link } from "react-router-dom"
import { Layout } from "../components/ui/Layout"
import { Button } from "../components/ui/Button"

export function NotFound() {
  return (
    <Layout>
      <div className="mx-auto flex flex-col gap-5 w-full text-center py-8">
        <h2>page not found</h2>
        <Link to="/">
          <Button>
            Go Back
          </Button>
        </Link>
      </div>
    </Layout>
  )
}
