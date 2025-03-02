export default function Home() {
  return (
    <div className="space-y-6">
      <section className="bg-gray-100 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Welcome to Top Chef Fantasy League</h2>
        <p>
          Join our fantasy league for Top Chef enthusiasts! Draft your favorite chefs,
          earn points based on their performance, and compete with friends.
        </p>
      </section>
      
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-100 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-2">Latest Episode Recap</h3>
          <p className="text-gray-700">
            Coming soon! Check back after the next episode airs.
          </p>
        </div>
        
        <div className="bg-gray-100 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-bold mb-2">Current Standings</h3>
          <p className="text-gray-700">
            Scoreboard will be available once the season begins.
          </p>
        </div>
      </section>
    </div>
  )
} 