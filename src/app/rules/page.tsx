'use client';

export default function RulesPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Fantasy League Rules</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">How to Play</h2>
        <ol className="list-decimal pl-5 space-y-2 text-gray-700">
          <li>Sign in with your Google account</li>
          <li>Draft up to 3 chefs for your fantasy team</li>
          <li>Earn points based on your chefs' performance in each episode</li>
          <li>The player with the most points at the end of the season wins!</li>
        </ol>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Scoring System</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="py-2 px-4 text-left">Achievement</th>
                <th className="py-2 px-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-t">
                <td className="py-2 px-4">Quickfire Win</td>
                <td className="py-2 px-4 text-right">10</td>
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4">Quickfire Top 3</td>
                <td className="py-2 px-4 text-right">5</td>
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4">Elimination Challenge Win</td>
                <td className="py-2 px-4 text-right">15</td>
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4">Elimination Challenge Top 3</td>
                <td className="py-2 px-4 text-right">7</td>
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4">Bottom 3 but Safe</td>
                <td className="py-2 px-4 text-right">-3</td>
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4">Eliminated</td>
                <td className="py-2 px-4 text-right">-10</td>
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4">Last Chance Kitchen Win</td>
                <td className="py-2 px-4 text-right">8</td>
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4">Return from Last Chance Kitchen</td>
                <td className="py-2 px-4 text-right">15</td>
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4">Make it to Finale</td>
                <td className="py-2 px-4 text-right">20</td>
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4">Runner-up</td>
                <td className="py-2 px-4 text-right">30</td>
              </tr>
              <tr className="border-t">
                <td className="py-2 px-4">Win Top Chef</td>
                <td className="py-2 px-4 text-right">50</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Season Timeline</h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900">Draft Period</h3>
            <p>The draft opens before the first episode and closes when the first episode airs.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Weekly Scoring</h3>
            <p>Points are updated after each episode airs, typically within 24 hours.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Season End</h3>
            <p>Final scores are tallied after the finale airs and winners are announced.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 