import { addChef } from '@/firebase/firestore';

const seedChefs = async () => {
  const chefs = [
    {
      name: "Chef Alex",
      photoURL: "https://via.placeholder.com/150",
      status: "active" as const,
      stats: {
        quickfireWins: 0,
        eliminationWins: 0,
        timesInBottom: 0,
        lastChanceKitchenWins: 0
      },
      bio: "Chef Alex is known for innovative fusion cuisine combining French and Asian influences.",
      season: "Season 20"
    },
    {
      name: "Chef Bianca",
      photoURL: "https://via.placeholder.com/150",
      status: "active" as const,
      stats: {
        quickfireWins: 0,
        eliminationWins: 0,
        timesInBottom: 0,
        lastChanceKitchenWins: 0
      },
      bio: "Chef Bianca specializes in farm-to-table Italian cuisine with a modern twist.",
      season: "Season 20"
    },
    {
      name: "Chef Carlos",
      photoURL: "https://via.placeholder.com/150",
      status: "active" as const,
      stats: {
        quickfireWins: 0,
        eliminationWins: 0,
        timesInBottom: 0,
        lastChanceKitchenWins: 0
      },
      bio: "Chef Carlos brings his Mexican heritage to every dish, focusing on authentic flavors with contemporary presentation.",
      season: "Season 20"
    },
    {
      name: "Chef Dani",
      photoURL: "https://via.placeholder.com/150",
      status: "active" as const,
      stats: {
        quickfireWins: 0,
        eliminationWins: 0,
        timesInBottom: 0,
        lastChanceKitchenWins: 0
      },
      bio: "Chef Dani is a pastry specialist who brings sweet techniques to savory dishes.",
      season: "Season 20"
    },
    {
      name: "Chef Elijah",
      photoURL: "https://via.placeholder.com/150",
      status: "active" as const,
      stats: {
        quickfireWins: 0,
        eliminationWins: 0,
        timesInBottom: 0,
        lastChanceKitchenWins: 0
      },
      bio: "Chef Elijah focuses on Southern comfort food with global influences.",
      season: "Season 20"
    },
    {
      name: "Chef Fatima",
      photoURL: "https://via.placeholder.com/150",
      status: "active" as const,
      stats: {
        quickfireWins: 0,
        eliminationWins: 0,
        timesInBottom: 0,
        lastChanceKitchenWins: 0
      },
      bio: "Chef Fatima brings Middle Eastern flavors to the competition with her innovative approach to traditional dishes.",
      season: "Season 20"
    }
  ];

  for (const chef of chefs) {
    try {
      const chefId = await addChef(chef);
      console.log(`Added chef ${chef.name} with ID: ${chefId}`);
    } catch (error) {
      console.error(`Error adding chef ${chef.name}:`, error);
    }
  }
};

export default seedChefs; 