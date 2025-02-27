const axios = require("axios");

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

const CATEGORIES = {
  buildings: [
    "house",
    "apartment building",
    "school",
    "hospital",
    "barn",
    "library",
    "store",
    "hotel",
    "church",
    "factory",
    "office building",
    "gas station",
    "fire station",
    "train station",
    "museum",
    "cinema",
    "restaurant",
    "warehouse",
    "castle",
    "skyscraper",
  ],
  flags: ["country flag", "pirate flag"],
  objects: [
    "chair",
    "clock",
    "guitar",
    "spoon",
    "lamp",
    "mirror",
    "book",
    "keys",
    "table",
    "bed",
    "scissors",
    "umbrella",
    "pen",
    "phone",
    "shoes",
    "glasses",
    "door",
    "window",
    "plate",
    "bowl",
  ],
  nature: [
    "mountain",
    "beach",
    "forest",
    "lake",
    "river",
    "hill",
    "cave",
    "volcano",
    "island",
    "cliff",
    "valley",
    "waterfall",
    "desert",
    "canyon",
    "field",
    "park",
    "garden",
    "ocean",
    "sky",
  ],
  vehicles: [
    "car",
    "bicycle",
    "bus",
    "train",
    "truck",
    "motorcycle",
    "scooter",
    "airplane",
    "helicopter",
    "boat",
    "ship",
    "taxi",
    "ambulance",
    "fire truck",
    "police car",
    "tractor",
    "subway",
    "skateboard",
  ],
  food: [
    "pizza",
    "burger",
    "salad",
    "ice cream",
    "sandwich",
    "pasta",
    "soup",
    "fries",
    "chicken",
    "steak",
    "taco",
    "sushi",
    "cake",
    "cookie",
    "bread",
    "rice",
    "eggs",
    "pancakes",
    "donut",
    "coffee",
  ],
  animals: [
    "dog",
    "cat",
    "lion",
    "dolphin",
    "bear",
    "rabbit",
    "deer",
    "horse",
    "bird",
    "fish",
    "elephant",
    "tiger",
    "monkey",
    "snake",
    "turtle",
    "frog",
    "penguin",
    "whale",
    "giraffe",
    "kangaroo",
  ],
};

// // Replace local image paths with valid URLs
// const imagePool = [
//   {
//     src: {
//       large:
//         "https://cdn.pixabay.com/photo/2014/06/03/19/38/board-361516_1280.jpg", // Actual hosted URL
//     },
//     alt: "Wooden dining chair",
//   },
//   {
//     src: {
//       large:
//         "https://cdn.pixabay.com/photo/2014/06/03/19/38/board-361516_1280.jpg", // Actual hosted URL
//     },
//     alt: "Snowy peak mountain",
//   },
// ];

// async function getRandomImagePair() {
//   try {
//     // Flatten all possible queries
//     const allQueries = Object.values(CATEGORIES).flat();

//     // Get two distinct queries
//     const [query1, query2] = (() => {
//       const shuffled = [...allQueries].sort(() => 0.5 - Math.random());
//       return [
//         shuffled[0],
//         shuffled.find((q) => q !== shuffled[0]) || shuffled[1],
//       ];
//     })();

//     // Fetch for both queries in parallel
//     const fetchQuery = async (query) => {
//       const res = await axios.get("https://api.pexels.com/v1/search", {
//         params: {
//           query: query,
//           per_page: 30,
//           page: Math.floor(Math.random() * 5) + 1,
//           orientation: "square",
//         },
//         headers: { Authorization: PEXELS_API_KEY },
//       });

//       return res.data.photos.filter(
//         (photo) =>
//           photo.width > 2000 &&
//           !photo.alt?.toLowerCase().includes("people") &&
//           photo.src?.large &&
//           isValidHttpUrl(photo.src.large)
//       );
//     };

//     const [photos1, photos2] = await Promise.all([
//       fetchQuery(query1),
//       fetchQuery(query2),
//     ]);

//     const getRandomImage = (photos, query) => {
//       const fallbackUrl = "https://cdn.pixabay.com/photo/2014/06/03/19/38/board-361516_1280.jpg";

//       if (!photos || photos.length === 0) {
//         return {
//           url: fallbackUrl,
//           title: query,
//           hint: query
//         };
//       }

//       const selected = photos[Math.floor(Math.random() * photos.length)];

//       return {
//         url: selected?.src.large || fallbackUrl,
//         title: query,
//         hint: selected?.alt?.split(" ").slice(0, 5).join(" ") || query
//       };
//     };

//     return [getRandomImage(photos1, query1), getRandomImage(photos2, query2)];
//   } catch (err) {
//     console.error("Image Error:", err.message);
//     const shuffledLocal = [...imagePool].sort(() => 0.5 - Math.random());
//     return shuffledLocal.slice(0, 2).map((img) => ({
//       ...img,
//       hint: img.hint || "Guess this item!",
//     }));
//   }
// }

// function isValidHttpUrl(string) {
//   try {
//     const newUrl = new URL(string);
//     return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
//   } catch (err) {
//     return false;
//   }
// }

const imagePool = [
  {
    url: "https://i.pinimg.com/736x/09/3c/48/093c4838360d6d06501e98fdc32f4648.jpg",
    title: "Luufy",
    category: "anime",
  },
  {
    url: "https://i.pinimg.com/736x/89/60/56/896056ec3e9dbe88f0a1fdf9f0fdfc17.jpg",
    title: "Zoro",
    category: "anime",
  },
  {
    url: "https://i.pinimg.com/736x/75/aa/c7/75aac75973bfaefd1bdece6f1c10f410.jpg",
    title: "Sanji",
    category: "anime",
  },
  {
    url: "https://i.pinimg.com/736x/e7/34/9f/e7349f5131d029f42cc32ae10f5b5bca.jpg",
    title: "nic robin one piece",
    category: "anime",
  },
  {
    url: "https://i.pinimg.com/736x/a3/e1/89/a3e189a10f438de729cfd0097387d282.jpg",
    title: "Trafalgar.D.Water — Law",
    category: "anime",
  },
];

function getRandomImagePair() {
  if (imagePool.length < 2) {
    throw new Error("Not enough images in the pool.");
  }

  // Generate two distinct random indexes
  const firstIndex = Math.floor(Math.random() * imagePool.length);
  let secondIndex = Math.floor(Math.random() * (imagePool.length - 1));
  
  // Adjust second index to avoid duplicates
  if (secondIndex >= firstIndex) {
    secondIndex += 1;
  }

  return [imagePool[firstIndex], imagePool[secondIndex]];
}

module.exports = { getRandomImagePair };
