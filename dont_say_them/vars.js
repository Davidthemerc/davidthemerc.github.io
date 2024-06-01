// Default game status object
const defaultGameStatus = {
  started: 0,
  points: 0,
};

// Audio array
const audio = [
  { id: 0, dir: 'assets/audio/buzzer.mp3', name: 'buzzer' },
  { id: 1, dir: 'assets/audio/success.mp3', name: 'success' },
];

// Audiolist array conversion
const audioList = Array();

// Convert array to make audio accessible
audio.forEach((sound, index) => {
  audioList[index] = new Audio();
  audioList[index].src = sound.dir;
});

// Array of Target Words, and their associated Illegal Words
const wordArray = [
  {
    targetWord: 'Apple',
    illegalWords: ['fruit', 'red', 'pie', 'tree'],
  },
  { targetWord: 'Banana', illegalWords: ['fruit', 'yellow', 'peel', 'monkey'] },
  { targetWord: 'Car', illegalWords: ['vehicle', 'drive', 'engine', 'wheel'] },
  { targetWord: 'House', illegalWords: ['home', 'building', 'roof', 'door'] },
  { targetWord: 'Dog', illegalWords: ['pet', 'bark', 'canine', 'puppy'] },
  { targetWord: 'Cat', illegalWords: ['pet', 'meow', 'feline', 'whiskers'] },
  { targetWord: 'Bird', illegalWords: ['fly', 'wing', 'feather', 'tweet'] },
  { targetWord: 'Shoe', illegalWords: ['foot', 'wear', 'lace', 'sneaker'] },
  { targetWord: 'Tree', illegalWords: ['plant', 'leaf', 'branch', 'wood'] },
  { targetWord: 'Phone', illegalWords: ['call', 'ring', 'mobile', 'cell'] },
  { targetWord: 'Table', illegalWords: ['furniture', 'wood', 'dine', 'legs'] },
  {
    targetWord: 'Computer',
    illegalWords: ['technology', 'screen', 'keyboard', 'mouse'],
  },
  { targetWord: 'Chair', illegalWords: ['sit', 'furniture', 'seat', 'legs'] },
  { targetWord: 'Book', illegalWords: ['read', 'page', 'cover', 'library'] },
  { targetWord: 'Pen', illegalWords: ['write', 'ink', 'paper', 'stationery'] },
  { targetWord: 'Clock', illegalWords: ['time', 'watch', 'hour', 'minute'] },
  { targetWord: 'Water', illegalWords: ['drink', 'liquid', 'clear', 'bottle'] },
  { targetWord: 'Bread', illegalWords: ['bake', 'loaf', 'slice', 'toast'] },
  { targetWord: 'Milk', illegalWords: ['drink', 'white', 'cow', 'dairy'] },
  {
    targetWord: 'Cake',
    illegalWords: ['bake', 'dessert', 'sweet', 'birthday'],
  },
  { targetWord: 'window', illegalWords: ['glass', 'view', 'pane', 'frame'] },
  { targetWord: 'door', illegalWords: ['entrance', 'exit', 'knob', 'frame'] },
  { targetWord: 'shirt', illegalWords: ['wear', 'clothes', 'top', 'button'] },
  { targetWord: 'Pants', illegalWords: ['wear', 'clothes', 'legs', 'jeans'] },
  { targetWord: 'hat', illegalWords: ['wear', 'head', 'cap', 'brim'] },
  { targetWord: 'Glove', illegalWords: ['wear', 'hand', 'cold', 'fingers'] },
  { targetWord: 'Sock', illegalWords: ['wear', 'foot', 'pair', 'shoe'] },
  { targetWord: 'Rain', illegalWords: ['water', 'weather', 'wet', 'storm'] },
  { targetWord: 'Snow', illegalWords: ['cold', 'white', 'winter', 'flake'] },
  { targetWord: 'Sun', illegalWords: ['light', 'day', 'sky', 'star'] },
  { targetWord: 'Moon', illegalWords: ['night', 'sky', 'light', 'crescent'] },
  { targetWord: 'Star', illegalWords: ['night', 'sky', 'shine', 'space'] },
  { targetWord: 'Cloud', illegalWords: ['sky', 'white', 'rain', 'fluffy'] },
  { targetWord: 'Mountain', illegalWords: ['hill', 'high', 'climb', 'peak'] },
  { targetWord: 'River', illegalWords: ['water', 'flow', 'stream', 'bank'] },
  { targetWord: 'Ocean', illegalWords: ['water', 'sea', 'wave', 'blue'] },
  { targetWord: 'Lake', illegalWords: ['water', 'pond', 'fish', 'swim'] },
  { targetWord: 'Fish', illegalWords: ['water', 'swim', 'gills', 'scale'] },
  { targetWord: 'Boat', illegalWords: ['water', 'sail', 'ship', 'float'] },
  {
    targetWord: 'Train',
    illegalWords: ['rail', 'track', 'engine', 'transport'],
  },
  {
    targetWord: 'Bicycle',
    illegalWords: ['ride', 'wheel', 'pedal', 'handlebar'],
  },
  {
    targetWord: 'Bus',
    illegalWords: ['vehicle', 'public', 'transport', 'drive'],
  },
  { targetWord: 'Airplane', illegalWords: ['fly', 'sky', 'travel', 'wing'] },
  { targetWord: 'Helicopter', illegalWords: ['fly', 'sky', 'rotor', 'air'] },
  { targetWord: 'Ball', illegalWords: ['round', 'throw', 'catch', 'game'] },
  { targetWord: 'Game', illegalWords: ['play', 'fun', 'sport', 'win'] },
  { targetWord: 'Toy', illegalWords: ['play', 'child', 'fun', 'game'] },
  { targetWord: 'Doll', illegalWords: ['play', 'toy', 'child', 'girl'] },
  { targetWord: 'Puzzle', illegalWords: ['solve', 'piece', 'game', 'jigsaw'] },
  {
    targetWord: 'Music',
    illegalWords: ['sound', 'song', 'play', 'instrument'],
  },
  {
    targetWord: 'Guitar',
    illegalWords: ['music', 'string', 'play', 'instrument'],
  },
  {
    targetWord: 'Piano',
    illegalWords: ['music', 'keys', 'play', 'instrument'],
  },
  {
    targetWord: 'Drum',
    illegalWords: ['music', 'beat', 'stick', 'percussion'],
  },
  {
    targetWord: 'Flute',
    illegalWords: ['music', 'blow', 'instrument', 'wind'],
  },
  {
    targetWord: 'Trumpet',
    illegalWords: ['music', 'blow', 'instrument', 'brass'],
  },
  {
    targetWord: 'Violin',
    illegalWords: ['music', 'string', 'bow', 'instrument'],
  },
  { targetWord: 'Newspaper', illegalWords: ['read', 'news', 'paper', 'daily'] },
  {
    targetWord: 'Magazine',
    illegalWords: ['read', 'page', 'cover', 'monthly'],
  },
  { targetWord: 'Letter', illegalWords: ['write', 'mail', 'envelope', 'send'] },
  { targetWord: 'Envelope', illegalWords: ['mail', 'letter', 'send', 'seal'] },
  { targetWord: 'Stamp', illegalWords: ['mail', 'letter', 'post', 'send'] },
  {
    targetWord: 'Card',
    illegalWords: ['send', 'greeting', 'birthday', 'message'],
  },
  { targetWord: 'Bottle', illegalWords: ['drink', 'liquid', 'glass', 'cap'] },
  { targetWord: 'Cup', illegalWords: ['drink', 'mug', 'tea', 'coffee'] },
  { targetWord: 'Plate', illegalWords: ['eat', 'food', 'dish', 'meal'] },
  { targetWord: 'Bowl', illegalWords: ['eat', 'food', 'soup', 'round'] },
  { targetWord: 'Fork', illegalWords: ['eat', 'food', 'prong', 'utensil'] },
  { targetWord: 'Knife', illegalWords: ['cut', 'sharp', 'blade', 'utensil'] },
  { targetWord: 'Spoon', illegalWords: ['eat', 'food', 'soup', 'utensil'] },
  { targetWord: 'Pot', illegalWords: ['cook', 'stove', 'pan', 'boil'] },
  { targetWord: 'Pan', illegalWords: ['cook', 'stove', 'fry', 'pot'] },
  { targetWord: 'Stove', illegalWords: ['cook', 'heat', 'kitchen', 'oven'] },
  { targetWord: 'Oven', illegalWords: ['cook', 'bake', 'kitchen', 'heat'] },
  {
    targetWord: 'Refrigerator',
    illegalWords: ['cold', 'kitchen', 'food', 'fridge'],
  },
  {
    targetWord: 'Microwave',
    illegalWords: ['cook', 'heat', 'kitchen', 'oven'],
  },
  {
    targetWord: 'Toaster',
    illegalWords: ['toast', 'bread', 'kitchen', 'heat'],
  },
  { targetWord: 'sink', illegalWords: ['water', 'kitchen', 'wash', 'tap'] },
  {
    targetWord: 'shower',
    illegalWords: ['water', 'bathroom', 'wash', 'bathe'],
  },
  {
    targetWord: 'bathtub',
    illegalWords: ['water', 'bathroom', 'wash', 'bathe'],
  },
  {
    targetWord: 'toilet',
    illegalWords: ['bathroom', 'flush', 'seat', 'water'],
  },
  { targetWord: 'towel', illegalWords: ['dry', 'bathroom', 'wipe', 'cloth'] },
  { targetWord: 'soap', illegalWords: ['clean', 'wash', 'bathroom', 'bar'] },
  {
    targetWord: 'shampoo',
    illegalWords: ['clean', 'hair', 'wash', 'bathroom'],
  },
  {
    targetWord: 'toothbrush',
    illegalWords: ['clean', 'teeth', 'brush', 'mouth'],
  },
  {
    targetWord: 'toothpaste',
    illegalWords: ['clean', 'teeth', 'brush', 'mouth'],
  },
  { targetWord: 'comb', illegalWords: ['hair', 'brush', 'tangle', 'style'] },
  { targetWord: 'hairdryer', illegalWords: ['hair', 'dry', 'blow', 'heat'] },
  {
    targetWord: 'mirror',
    illegalWords: ['reflection', 'glass', 'bathroom', 'see'],
  },
  { targetWord: 'lamp', illegalWords: ['light', 'shade', 'bulb', 'room'] },
  { targetWord: 'bed', illegalWords: ['sleep', 'mattress', 'pillow', 'room'] },
  { targetWord: 'pillow', illegalWords: ['sleep', 'bed', 'head', 'soft'] },
  { targetWord: 'blanket', illegalWords: ['sleep', 'bed', 'warm', 'cover'] },
  {
    targetWord: 'curtain',
    illegalWords: ['window', 'cloth', 'shade', 'cover'],
  },
  { targetWord: 'rug', illegalWords: ['floor', 'carpet', 'room', 'soft'] },
  { targetWord: 'pencil', illegalWords: ['write', 'eraser', 'lead', 'wood'] },
  {
    targetWord: 'paper',
    illegalWords: ['write', 'sheet', 'white', 'notebook'],
  },
  {
    targetWord: 'notebook',
    illegalWords: ['write', 'paper', 'school', 'spiral'],
  },
  {
    targetWord: 'backpack',
    illegalWords: ['school', 'carry', 'bag', 'shoulder'],
  },
  { targetWord: 'lunch', illegalWords: ['food', 'meal', 'noon', 'break'] },
  { targetWord: 'sandwich', illegalWords: ['bread', 'meat', 'lunch', 'eat'] },
  { targetWord: 'cheese', illegalWords: ['dairy', 'yellow', 'milk', 'slice'] },
  {
    targetWord: 'butter',
    illegalWords: ['spread', 'toast', 'yellow', 'dairy'],
  },
  { targetWord: 'egg', illegalWords: ['breakfast', 'shell', 'white', 'yolk'] },
  {
    targetWord: 'bacon',
    illegalWords: ['breakfast', 'meat', 'pork', 'crispy'],
  },
  {
    targetWord: 'cereal',
    illegalWords: ['breakfast', 'milk', 'bowl', 'grain'],
  },
  {
    targetWord: 'pancake',
    illegalWords: ['breakfast', 'syrup', 'stack', 'fluffy'],
  },
  {
    targetWord: 'waffle',
    illegalWords: ['breakfast', 'syrup', 'square', 'iron'],
  },
  {
    targetWord: 'salad',
    illegalWords: ['vegetable', 'leaf', 'bowl', 'dressing'],
  },
  { targetWord: 'soup', illegalWords: ['liquid', 'bowl', 'hot', 'spoon'] },
  { targetWord: 'pizza', illegalWords: ['cheese', 'sauce', 'crust', 'slice'] },
  {
    targetWord: 'burger',
    illegalWords: ['meat', 'bun', 'cheese', 'fast food'],
  },
  {
    targetWord: 'fries',
    illegalWords: ['potato', 'fried', 'fast food', 'salt'],
  },
  {
    targetWord: 'spaghetti',
    illegalWords: ['pasta', 'sauce', 'noodle', 'Italian'],
  },
  {
    targetWord: 'noodle',
    illegalWords: ['pasta', 'spaghetti', 'long', 'boil'],
  },
  { targetWord: 'rice', illegalWords: ['grain', 'white', 'boil', 'Asian'] },
  { targetWord: 'chicken', illegalWords: ['meat', 'poultry', 'bird', 'wing'] },
  { targetWord: 'steak', illegalWords: ['meat', 'beef', 'grill', 'cut'] },
  { targetWord: 'shrimp', illegalWords: ['seafood', 'small', 'shell', 'pink'] },
  { targetWord: 'crab', illegalWords: ['seafood', 'claw', 'shell', 'beach'] },
  { targetWord: 'lobster', illegalWords: ['seafood', 'claw', 'shell', 'boil'] },
  {
    targetWord: 'broccoli',
    illegalWords: ['vegetable', 'green', 'tree', 'stem'],
  },
  {
    targetWord: 'carrot',
    illegalWords: ['vegetable', 'orange', 'rabbit', 'root'],
  },
  {
    targetWord: 'potato',
    illegalWords: ['vegetable', 'tuber', 'mashed', 'fries'],
  },
  {
    targetWord: 'tomato',
    illegalWords: ['vegetable', 'red', 'fruit', 'sauce'],
  },
  {
    targetWord: 'pepper',
    illegalWords: ['vegetable', 'spicy', 'red', 'green'],
  },
  {
    targetWord: 'onion',
    illegalWords: ['vegetable', 'tear', 'round', 'layer'],
  },
  {
    targetWord: 'garlic',
    illegalWords: ['vegetable', 'clove', 'pungent', 'white'],
  },
  {
    targetWord: 'lettuce',
    illegalWords: ['vegetable', 'leaf', 'salad', 'green'],
  },
  {
    targetWord: 'cucumber',
    illegalWords: ['vegetable', 'green', 'salad', 'pickle'],
  },
  {
    targetWord: 'zucchini',
    illegalWords: ['vegetable', 'green', 'squash', 'summer'],
  },
  {
    targetWord: 'corn',
    illegalWords: ['vegetable', 'yellow', 'cob', 'kernel'],
  },
  { targetWord: 'orange', illegalWords: ['fruit', 'citrus', 'juice', 'peel'] },
  { targetWord: 'grape', illegalWords: ['fruit', 'vine', 'purple', 'wine'] },
  {
    targetWord: 'strawberry',
    illegalWords: ['fruit', 'red', 'berry', 'sweet'],
  },
  {
    targetWord: 'blueberry',
    illegalWords: ['fruit', 'blue', 'berry', 'muffin'],
  },
  { targetWord: 'raspberry', illegalWords: ['fruit', 'red', 'berry', 'sweet'] },
  {
    targetWord: 'watermelon',
    illegalWords: ['fruit', 'summer', 'green', 'red'],
  },
  { targetWord: 'lemon', illegalWords: ['fruit', 'yellow', 'citrus', 'sour'] },
  { targetWord: 'lime', illegalWords: ['fruit', 'green', 'citrus', 'sour'] },
  {
    targetWord: 'pineapple',
    illegalWords: ['fruit', 'tropical', 'yellow', 'spiky'],
  },
  {
    targetWord: 'mango',
    illegalWords: ['fruit', 'tropical', 'orange', 'sweet'],
  },
  { targetWord: 'peach', illegalWords: ['fruit', 'fuzzy', 'orange', 'sweet'] },
  { targetWord: 'cherry', illegalWords: ['fruit', 'red', 'small', 'pit'] },
  { targetWord: 'pear', illegalWords: ['fruit', 'green', 'sweet', 'tree'] },
  { targetWord: 'plum', illegalWords: ['fruit', 'purple', 'pit', 'sweet'] },
  { targetWord: 'kiwi', illegalWords: ['fruit', 'green', 'fuzzy', 'tropical'] },
  {
    targetWord: 'grapefruit',
    illegalWords: ['fruit', 'citrus', 'pink', 'sour'],
  },
  {
    targetWord: 'pomegranate',
    illegalWords: ['fruit', 'seeds', 'red', 'juice'],
  },
  { targetWord: 'truck', illegalWords: ['vehicle', 'cargo', 'large', 'drive'] },
  {
    targetWord: 'motorcycle',
    illegalWords: ['ride', 'bike', 'engine', 'helmet'],
  },
  { targetWord: 'submarine', illegalWords: ['water', 'under', 'navy', 'deep'] },
  {
    targetWord: 'spaceship',
    illegalWords: ['space', 'fly', 'astronaut', 'rocket'],
  },
  { targetWord: 'rocket', illegalWords: ['space', 'fly', 'engine', 'launch'] },
  {
    targetWord: 'satellite',
    illegalWords: ['space', 'orbit', 'signal', 'communication'],
  },
  { targetWord: 'astronaut', illegalWords: ['space', 'suit', 'moon', 'NASA'] },
  { targetWord: 'planet', illegalWords: ['space', 'orbit', 'solar', 'system'] },
  { targetWord: 'galaxy', illegalWords: ['space', 'stars', 'milky', 'way'] },
  {
    targetWord: 'universe',
    illegalWords: ['space', 'everything', 'cosmos', 'galaxy'],
  },
  { targetWord: 'telescope', illegalWords: ['see', 'star', 'sky', 'observe'] },
  {
    targetWord: 'microscope',
    illegalWords: ['see', 'small', 'science', 'lens'],
  },
  {
    targetWord: 'lab',
    illegalWords: ['science', 'experiment', 'research', 'chemistry'],
  },
  {
    targetWord: 'scientist',
    illegalWords: ['experiment', 'research', 'lab', 'white coat'],
  },
  {
    targetWord: 'doctor',
    illegalWords: ['medical', 'patient', 'hospital', 'nurse'],
  },
  {
    targetWord: 'nurse',
    illegalWords: ['medical', 'hospital', 'patient', 'care'],
  },
  {
    targetWord: 'hospital',
    illegalWords: ['medical', 'care', 'doctor', 'nurse'],
  },
  {
    targetWord: 'medicine',
    illegalWords: ['drug', 'pill', 'prescription', 'doctor'],
  },
  {
    targetWord: 'surgery',
    illegalWords: ['operation', 'doctor', 'hospital', 'patient'],
  },
  {
    targetWord: 'ambulance',
    illegalWords: ['emergency', 'hospital', 'vehicle', 'siren'],
  },
  {
    targetWord: 'firefighter',
    illegalWords: ['fire', 'truck', 'rescue', 'emergency'],
  },
  {
    targetWord: 'police',
    illegalWords: ['law', 'enforcement', 'officer', 'arrest'],
  },
  {
    targetWord: 'teacher',
    illegalWords: ['school', 'class', 'student', 'educate'],
  },
  {
    targetWord: 'student',
    illegalWords: ['school', 'learn', 'class', 'teacher'],
  },
  {
    targetWord: 'school',
    illegalWords: ['education', 'student', 'class', 'teacher'],
  },
  {
    targetWord: 'university',
    illegalWords: ['college', 'student', 'degree', 'education'],
  },
  { targetWord: 'library', illegalWords: ['books', 'read', 'quiet', 'study'] },
  {
    targetWord: 'gym',
    illegalWords: ['exercise', 'workout', 'weights', 'fitness'],
  },
  {
    targetWord: 'park',
    illegalWords: ['trees', 'grass', 'playground', 'outdoor'],
  },
  { targetWord: 'beach', illegalWords: ['sand', 'water', 'ocean', 'waves'] },
  {
    targetWord: 'museum',
    illegalWords: ['art', 'history', 'exhibit', 'gallery'],
  },
  {
    targetWord: 'zoo',
    illegalWords: ['animals', 'cage', 'exhibit', 'wildlife'],
  },
  {
    targetWord: 'cinema',
    illegalWords: ['movie', 'screen', 'popcorn', 'theater'],
  },
  { targetWord: 'restaurant', illegalWords: ['food', 'eat', 'menu', 'dine'] },
  {
    targetWord: 'hotel',
    illegalWords: ['stay', 'room', 'travel', 'accommodation'],
  },
  {
    targetWord: 'airport',
    illegalWords: ['plane', 'flight', 'travel', 'terminal'],
  },
  { targetWord: 'stadium', illegalWords: ['sports', 'game', 'seats', 'crowd'] },
  { targetWord: 'market', illegalWords: ['buy', 'sell', 'food', 'shopping'] },
  { targetWord: 'store', illegalWords: ['buy', 'sell', 'shop', 'goods'] },
  {
    targetWord: 'mall',
    illegalWords: ['shopping', 'stores', 'clothes', 'buy'],
  },
  {
    targetWord: 'bank',
    illegalWords: ['money', 'account', 'finance', 'withdraw'],
  },
  {
    targetWord: 'post office',
    illegalWords: ['mail', 'letter', 'stamp', 'package'],
  },
  {
    targetWord: 'pharmacy',
    illegalWords: ['medicine', 'prescription', 'drugs', 'health'],
  },
  {
    targetWord: 'supermarket',
    illegalWords: ['groceries', 'food', 'buy', 'store'],
  },
  { targetWord: 'farm', illegalWords: ['animals', 'crops', 'barn', 'rural'] },
  {
    targetWord: 'factory',
    illegalWords: ['manufacture', 'workers', 'machines', 'production'],
  },
  { targetWord: 'office', illegalWords: ['work', 'desk', 'computer', 'job'] },
  {
    targetWord: 'studio',
    illegalWords: ['art', 'music', 'recording', 'space'],
  },
  { targetWord: 'garage', illegalWords: ['car', 'repair', 'tools', 'park'] },
  {
    targetWord: 'warehouse',
    illegalWords: ['storage', 'large', 'inventory', 'building'],
  },
  {
    targetWord: 'church',
    illegalWords: ['religion', 'pray', 'service', 'worship'],
  },
  {
    targetWord: 'temple',
    illegalWords: ['religion', 'pray', 'worship', 'building'],
  },
  {
    targetWord: 'mosque',
    illegalWords: ['religion', 'pray', 'Islam', 'worship'],
  },
  {
    targetWord: 'synagogue',
    illegalWords: ['religion', 'pray', 'Jewish', 'worship'],
  },
  {
    targetWord: 'castle',
    illegalWords: ['fortress', 'king', 'medieval', 'building'],
  },
  {
    targetWord: 'palace',
    illegalWords: ['royalty', 'king', 'queen', 'residence'],
  },
  {
    targetWord: 'skyscraper',
    illegalWords: ['tall', 'building', 'city', 'tower'],
  },
  {
    targetWord: 'bridge',
    illegalWords: ['cross', 'river', 'structure', 'connect'],
  },
  {
    targetWord: 'tunnel',
    illegalWords: ['underground', 'passage', 'road', 'subway'],
  },
  { targetWord: 'road', illegalWords: ['drive', 'car', 'pavement', 'highway'] },
  { targetWord: 'highway', illegalWords: ['road', 'drive', 'car', 'traffic'] },
  {
    targetWord: 'sidewalk',
    illegalWords: ['walk', 'pavement', 'pedestrian', 'path'],
  },
  {
    targetWord: 'crosswalk',
    illegalWords: ['pedestrian', 'street', 'walk', 'road'],
  },
  {
    targetWord: 'traffic light',
    illegalWords: ['signal', 'red', 'green', 'stop'],
  },
  { targetWord: 'stop sign', illegalWords: ['traffic', 'road', 'red', 'sign'] },
  { targetWord: 'bench', illegalWords: ['sit', 'park', 'seat', 'wood'] },
  {
    targetWord: 'fence',
    illegalWords: ['boundary', 'wood', 'yard', 'enclose'],
  },
  { targetWord: 'garden', illegalWords: ['plants', 'flowers', 'yard', 'grow'] },
  { targetWord: 'treehouse', illegalWords: ['tree', 'kids', 'play', 'wood'] },
  {
    targetWord: 'mailbox',
    illegalWords: ['mail', 'letter', 'post', 'receive'],
  },
  {
    targetWord: 'trash can',
    illegalWords: ['garbage', 'waste', 'bin', 'dispose'],
  },
  {
    targetWord: 'recycling bin',
    illegalWords: ['waste', 'recycle', 'trash', 'bin'],
  },
  {
    targetWord: 'fire hydrant',
    illegalWords: ['water', 'fire', 'emergency', 'red'],
  },
  {
    targetWord: 'streetlight',
    illegalWords: ['light', 'night', 'road', 'pole'],
  },
  {
    targetWord: 'manhole',
    illegalWords: ['cover', 'sewer', 'street', 'underground'],
  },
  {
    targetWord: 'electric pole',
    illegalWords: ['electricity', 'wires', 'street', 'power'],
  },
  {
    targetWord: 'windmill',
    illegalWords: ['wind', 'energy', 'farm', 'blades'],
  },
  {
    targetWord: 'lighthouse',
    illegalWords: ['light', 'coast', 'sea', 'navigation'],
  },
  { targetWord: 'harbor', illegalWords: ['boats', 'dock', 'water', 'port'] },
  { targetWord: 'pier', illegalWords: ['water', 'dock', 'boats', 'fishing'] },
  {
    targetWord: 'fountain',
    illegalWords: ['water', 'spray', 'park', 'decoration'],
  },
  {
    targetWord: 'statue',
    illegalWords: ['sculpture', 'stone', 'monument', 'figure'],
  },
  {
    targetWord: 'monument',
    illegalWords: ['statue', 'memorial', 'historic', 'tribute'],
  },
  {
    targetWord: 'cemetery',
    illegalWords: ['graves', 'tombstone', 'burial', 'dead'],
  },
  {
    targetWord: 'amusement park',
    illegalWords: ['rides', 'fun', 'roller coaster', 'entertainment'],
  },
  { targetWord: 'water park', illegalWords: ['slides', 'pool', 'swim', 'fun'] },
  {
    targetWord: 'playground',
    illegalWords: ['kids', 'play', 'swing', 'slide'],
  },
  {
    targetWord: 'carnival',
    illegalWords: ['rides', 'games', 'fun', 'festival'],
  },
  { targetWord: 'circus', illegalWords: ['clowns', 'tent', 'animals', 'show'] },
  {
    targetWord: 'festival',
    illegalWords: ['celebration', 'music', 'food', 'event'],
  },
  {
    targetWord: 'parade',
    illegalWords: ['celebration', 'floats', 'march', 'crowd'],
  },
  {
    targetWord: 'concert',
    illegalWords: ['music', 'live', 'band', 'performance'],
  },
  {
    targetWord: 'theater',
    illegalWords: ['stage', 'play', 'actors', 'performance'],
  },
  {
    targetWord: 'ballet',
    illegalWords: ['dance', 'performance', 'stage', 'graceful'],
  },
  {
    targetWord: 'opera',
    illegalWords: ['sing', 'performance', 'theater', 'music'],
  },
  {
    targetWord: 'orchestra',
    illegalWords: ['music', 'instruments', 'concert', 'conductor'],
  },
  { targetWord: 'choir', illegalWords: ['sing', 'group', 'music', 'voices'] },
  {
    targetWord: 'band',
    illegalWords: ['music', 'instruments', 'concert', 'group'],
  },
  {
    targetWord: 'dancer',
    illegalWords: ['move', 'music', 'perform', 'graceful'],
  },
  {
    targetWord: 'actor',
    illegalWords: ['perform', 'stage', 'theater', 'movie'],
  },
  { targetWord: 'singer', illegalWords: ['perform', 'voice', 'music', 'song'] },
  { targetWord: 'painter', illegalWords: ['art', 'canvas', 'brush', 'paint'] },
  {
    targetWord: 'sculptor',
    illegalWords: ['art', 'stone', 'chisel', 'statue'],
  },
  { targetWord: 'writer', illegalWords: ['book', 'author', 'story', 'write'] },
  { targetWord: 'poet', illegalWords: ['poem', 'verse', 'rhyme', 'write'] },
  {
    targetWord: 'photographer',
    illegalWords: ['camera', 'picture', 'photo', 'image'],
  },
  {
    targetWord: 'director',
    illegalWords: ['movie', 'film', 'camera', 'shoot'],
  },
  {
    targetWord: 'producer',
    illegalWords: ['movie', 'film', 'music', 'create'],
  },
  {
    targetWord: 'editor',
    illegalWords: ['edit', 'write', 'publish', 'correct'],
  },
  {
    targetWord: 'reporter',
    illegalWords: ['news', 'journalist', 'write', 'story'],
  },
  {
    targetWord: 'journalist',
    illegalWords: ['news', 'write', 'report', 'article'],
  },
  {
    targetWord: 'anchor',
    illegalWords: ['news', 'television', 'report', 'broadcast'],
  },
  {
    targetWord: 'chef',
    illegalWords: ['cook', 'kitchen', 'food', 'restaurant'],
  },
  {
    targetWord: 'waiter',
    illegalWords: ['restaurant', 'serve', 'food', 'order'],
  },
  {
    targetWord: 'bartender',
    illegalWords: ['bar', 'drink', 'serve', 'alcohol'],
  },
  { targetWord: 'barista', illegalWords: ['coffee', 'serve', 'cafe', 'drink'] },
  {
    targetWord: 'professor',
    illegalWords: ['university', 'teach', 'college', 'class'],
  },
  {
    targetWord: 'principal',
    illegalWords: ['school', 'head', 'administration', 'student'],
  },
  { targetWord: 'coach', illegalWords: ['sports', 'team', 'train', 'play'] },
  {
    targetWord: 'athlete',
    illegalWords: ['sports', 'player', 'competition', 'train'],
  },
  {
    targetWord: 'referee',
    illegalWords: ['sports', 'whistle', 'game', 'rules'],
  },
  { targetWord: 'judge', illegalWords: ['court', 'law', 'gavel', 'trial'] },
  { targetWord: 'lawyer', illegalWords: ['court', 'law', 'case', 'defend'] },
  {
    targetWord: 'police officer',
    illegalWords: ['law', 'enforcement', 'arrest', 'uniform'],
  },
  {
    targetWord: 'paramedic',
    illegalWords: ['emergency', 'medical', 'ambulance', 'care'],
  },
  { targetWord: 'dentist', illegalWords: ['teeth', 'medical', 'oral', 'care'] },
  {
    targetWord: 'pharmacist',
    illegalWords: ['medicine', 'prescription', 'drugs', 'pharmacy'],
  },
  {
    targetWord: 'engineer',
    illegalWords: ['build', 'design', 'technology', 'machine'],
  },
  {
    targetWord: 'architect',
    illegalWords: ['build', 'design', 'structure', 'blueprint'],
  },
  { targetWord: 'mechanic', illegalWords: ['repair', 'car', 'engine', 'fix'] },
  {
    targetWord: 'electrician',
    illegalWords: ['wires', 'electricity', 'repair', 'install'],
  },
  { targetWord: 'plumber', illegalWords: ['pipes', 'repair', 'water', 'fix'] },
  {
    targetWord: 'carpenter',
    illegalWords: ['wood', 'build', 'tools', 'furniture'],
  },
  {
    targetWord: 'construction worker',
    illegalWords: ['build', 'tools', 'site', 'hard hat'],
  },
  { targetWord: 'baker', illegalWords: ['bread', 'oven', 'cake', 'pastry'] },
  { targetWord: 'butcher', illegalWords: ['meat', 'cut', 'shop', 'knife'] },
  {
    targetWord: 'farmer',
    illegalWords: ['crops', 'animals', 'land', 'tractor'],
  },
  {
    targetWord: 'gardener',
    illegalWords: ['plants', 'flowers', 'soil', 'grow'],
  },
  {
    targetWord: 'florist',
    illegalWords: ['flowers', 'bouquet', 'shop', 'arrangement'],
  },
  {
    targetWord: 'veterinarian',
    illegalWords: ['animals', 'doctor', 'pet', 'care'],
  },
  {
    targetWord: 'zookeeper',
    illegalWords: ['animals', 'zoo', 'care', 'wildlife'],
  },
  { targetWord: 'pilot', illegalWords: ['plane', 'fly', 'sky', 'travel'] },
  {
    targetWord: 'flight attendant',
    illegalWords: ['plane', 'passenger', 'travel', 'service'],
  },
  { targetWord: 'sailor', illegalWords: ['boat', 'water', 'sea', 'ship'] },
  { targetWord: 'captain', illegalWords: ['ship', 'boat', 'sea', 'leader'] },
  { targetWord: 'author', illegalWords: ['book', 'write', 'story', 'novel'] },
  { targetWord: 'artist', illegalWords: ['paint', 'draw', 'create', 'canvas'] },
  {
    targetWord: 'musician',
    illegalWords: ['music', 'instrument', 'play', 'song'],
  },
  {
    targetWord: 'designer',
    illegalWords: ['create', 'fashion', 'graphic', 'style'],
  },
  {
    targetWord: 'fashion designer',
    illegalWords: ['clothes', 'style', 'create', 'runway'],
  },
  {
    targetWord: 'graphic designer',
    illegalWords: ['art', 'computer', 'create', 'visual'],
  },
  {
    targetWord: 'web designer',
    illegalWords: ['website', 'create', 'internet', 'code'],
  },
  {
    targetWord: 'programmer',
    illegalWords: ['code', 'computer', 'software', 'develop'],
  },
  {
    targetWord: 'animator',
    illegalWords: ['animation', 'create', 'cartoon', 'visual'],
  },
  {
    targetWord: 'radio host',
    illegalWords: ['broadcast', 'talk', 'show', 'radio'],
  },
  {
    targetWord: 'comedian',
    illegalWords: ['joke', 'funny', 'laugh', 'perform'],
  },
  {
    targetWord: 'magician',
    illegalWords: ['magic', 'trick', 'perform', 'illusion'],
  },
  {
    targetWord: 'bodybuilder',
    illegalWords: ['muscles', 'gym', 'train', 'exercise'],
  },
  {
    targetWord: 'gymnast',
    illegalWords: ['flip', 'balance', 'exercise', 'perform'],
  },
  {
    targetWord: 'swimmer',
    illegalWords: ['water', 'pool', 'swim', 'competition'],
  },
  { targetWord: 'runner', illegalWords: ['race', 'track', 'speed', 'run'] },
  {
    targetWord: 'cyclist',
    illegalWords: ['bike', 'ride', 'race', 'competition'],
  },
  { targetWord: 'skier', illegalWords: ['snow', 'ski', 'mountain', 'winter'] },
  {
    targetWord: 'snowboarder',
    illegalWords: ['snow', 'board', 'mountain', 'winter'],
  },
  { targetWord: 'surfer', illegalWords: ['wave', 'ocean', 'board', 'ride'] },
  {
    targetWord: 'tennis player',
    illegalWords: ['racket', 'court', 'ball', 'serve'],
  },
  {
    targetWord: 'golf player',
    illegalWords: ['club', 'course', 'ball', 'swing'],
  },
  {
    targetWord: 'basketball player',
    illegalWords: ['hoop', 'court', 'ball', 'dribble'],
  },
  {
    targetWord: 'soccer player',
    illegalWords: ['ball', 'goal', 'field', 'kick'],
  },
  {
    targetWord: 'baseball player',
    illegalWords: ['bat', 'ball', 'field', 'pitch'],
  },
  {
    targetWord: 'football player',
    illegalWords: ['ball', 'field', 'goal', 'team'],
  },
  {
    targetWord: 'hockey player',
    illegalWords: ['puck', 'ice', 'skate', 'stick'],
  },
  { targetWord: 'boxer', illegalWords: ['fight', 'ring', 'gloves', 'punch'] },
  {
    targetWord: 'wrestler',
    illegalWords: ['fight', 'ring', 'grapple', 'match'],
  },
  { targetWord: 'driver', illegalWords: ['car', 'vehicle', 'road', 'drive'] },
  {
    targetWord: 'librarian',
    illegalWords: ['books', 'read', 'library', 'catalog'],
  },
  {
    targetWord: 'police officer',
    illegalWords: ['law', 'enforcement', 'arrest', 'uniform'],
  },
  {
    targetWord: 'politician',
    illegalWords: ['government', 'election', 'policy', 'office'],
  },
  { targetWord: 'soldier', illegalWords: ['army', 'military', 'fight', 'war'] },
  { targetWord: 'tailor', illegalWords: ['clothes', 'sew', 'fit', 'measure'] },
  { targetWord: 'barber', illegalWords: ['hair', 'cut', 'shave', 'trim'] },
  {
    targetWord: 'chemist',
    illegalWords: ['science', 'experiment', 'lab', 'chemicals'],
  },
  {
    targetWord: 'clown',
    illegalWords: ['circus', 'funny', 'makeup', 'perform'],
  },
  {
    targetWord: 'detective',
    illegalWords: ['investigate', 'mystery', 'clues', 'solve'],
  },
  { targetWord: 'diver', illegalWords: ['water', 'scuba', 'deep', 'ocean'] },
  {
    targetWord: 'historian',
    illegalWords: ['past', 'events', 'research', 'study'],
  },
  { targetWord: 'nanny', illegalWords: ['child', 'care', 'home', 'babysit'] },
  {
    targetWord: 'optician',
    illegalWords: ['eyes', 'glasses', 'vision', 'lens'],
  },
  {
    targetWord: 'secretary',
    illegalWords: ['office', 'assist', 'type', 'work'],
  },
  {
    targetWord: 'shoemaker',
    illegalWords: ['shoes', 'repair', 'leather', 'cobble'],
  },
  { targetWord: 'taxi driver', illegalWords: ['car', 'drive', 'fare', 'cab'] },
  {
    targetWord: 'translator',
    illegalWords: ['language', 'translate', 'words', 'communication'],
  },
  {
    targetWord: 'violinist',
    illegalWords: ['music', 'instrument', 'strings', 'bow'],
  },
  {
    targetWord: 'watchmaker',
    illegalWords: ['clock', 'repair', 'time', 'watches'],
  },
  {
    targetWord: 'psychologist',
    illegalWords: ['mind', 'behavior', 'study', 'therapy'],
  },
  {
    targetWord: 'archaeologist',
    illegalWords: ['history', 'dig', 'artifacts', 'ancient'],
  },
  {
    targetWord: 'mathematician',
    illegalWords: ['numbers', 'math', 'study', 'theory'],
  },
  {
    targetWord: 'philosopher',
    illegalWords: ['think', 'study', 'knowledge', 'wisdom'],
  },
  {
    targetWord: 'psychiatrist',
    illegalWords: ['mental', 'health', 'doctor', 'therapy'],
  },
  {
    targetWord: 'pediatrician',
    illegalWords: ['children', 'doctor', 'medicine', 'care'],
  },
  {
    targetWord: 'podiatrist',
    illegalWords: ['feet', 'doctor', 'medicine', 'care'],
  },
  {
    targetWord: 'surgeon',
    illegalWords: ['operation', 'doctor', 'surgery', 'hospital'],
  },
  {
    targetWord: 'anesthesiologist',
    illegalWords: ['anesthesia', 'surgery', 'doctor', 'pain'],
  },
  {
    targetWord: 'therapist',
    illegalWords: ['counseling', 'mental', 'health', 'therapy'],
  },
  {
    targetWord: 'counselor',
    illegalWords: ['advice', 'guidance', 'therapy', 'support'],
  },
  {
    targetWord: 'social worker',
    illegalWords: ['support', 'community', 'care', 'welfare'],
  },
  {
    targetWord: 'volunteer',
    illegalWords: ['help', 'work', 'free', 'community'],
  },
  {
    targetWord: 'lifeguard',
    illegalWords: ['swim', 'pool', 'rescue', 'water'],
  },
  {
    targetWord: 'babysitter',
    illegalWords: ['child', 'care', 'watch', 'home'],
  },
  {
    targetWord: 'makeup artist',
    illegalWords: ['beauty', 'cosmetics', 'apply', 'face'],
  },
  {
    targetWord: 'interior designer',
    illegalWords: ['home', 'decorate', 'furniture', 'style'],
  },
  {
    targetWord: 'landscaper',
    illegalWords: ['yard', 'garden', 'plants', 'design'],
  },
  {
    targetWord: 'travel agent',
    illegalWords: ['trip', 'book', 'vacation', 'travel'],
  },
  {
    targetWord: 'tour guide',
    illegalWords: ['sightseeing', 'tourist', 'explain', 'guide'],
  },
  {
    targetWord: 'real estate agent',
    illegalWords: ['house', 'sell', 'buy', 'property'],
  },
  {
    targetWord: 'property manager',
    illegalWords: ['real estate', 'rent', 'property', 'tenant'],
  },
  {
    targetWord: 'auctioneer',
    illegalWords: ['bid', 'sell', 'auction', 'item'],
  },
  {
    targetWord: 'curator',
    illegalWords: ['museum', 'art', 'exhibit', 'collection'],
  },
  {
    targetWord: 'auditor',
    illegalWords: ['accounts', 'finance', 'check', 'verify'],
  },
  {
    targetWord: 'investment banker',
    illegalWords: ['finance', 'stocks', 'money', 'bank'],
  },
  {
    targetWord: 'insurance agent',
    illegalWords: ['policy', 'coverage', 'claim', 'risk'],
  },
  {
    targetWord: 'loan officer',
    illegalWords: ['bank', 'loan', 'money', 'approve'],
  },
  {
    targetWord: 'entrepreneur',
    illegalWords: ['business', 'start', 'company', 'venture'],
  },
  {
    targetWord: 'executive',
    illegalWords: ['corporate', 'business', 'leader', 'manager'],
  },
  {
    targetWord: 'manager',
    illegalWords: ['business', 'supervise', 'leader', 'office'],
  },
  {
    targetWord: 'supervisor',
    illegalWords: ['oversee', 'work', 'manage', 'staff'],
  },
  {
    targetWord: 'project manager',
    illegalWords: ['plan', 'execute', 'project', 'manage'],
  },
  {
    targetWord: 'assistant',
    illegalWords: ['help', 'schedule', 'tasks', 'manage'],
  },
  {
    targetWord: 'customer service',
    illegalWords: ['help', 'assist', 'support', 'client'],
  },
  {
    targetWord: 'salesperson',
    illegalWords: ['sell', 'product', 'client', 'store'],
  },
  {
    targetWord: 'cashier',
    illegalWords: ['money', 'register', 'store', 'checkout'],
  },
  {
    targetWord: 'hostess',
    illegalWords: ['restaurant', 'greet', 'seat', 'guest'],
  },
  {
    targetWord: 'dishwasher',
    illegalWords: ['clean', 'dishes', 'kitchen', 'restaurant'],
  },
  {
    targetWord: 'busboy',
    illegalWords: ['restaurant', 'clean', 'table', 'clear'],
  },
  {
    targetWord: 'concierge',
    illegalWords: ['hotel', 'assist', 'guest', 'service'],
  },
  {
    targetWord: 'housekeeper',
    illegalWords: ['clean', 'hotel', 'room', 'service'],
  },
  {
    targetWord: 'maintenance worker',
    illegalWords: ['repair', 'fix', 'building', 'upkeep'],
  },
  {
    targetWord: 'security guard',
    illegalWords: ['protect', 'watch', 'safety', 'guard'],
  },
  {
    targetWord: 'janitor',
    illegalWords: ['clean', 'building', 'maintain', 'service'],
  },
  {
    targetWord: 'garbage collector',
    illegalWords: ['trash', 'collect', 'waste', 'dispose'],
  },
  {
    targetWord: 'delivery driver',
    illegalWords: ['fedex', 'uber', 'ups', 'DoorDash'],
  },
  {
    targetWord: 'truck driver',
    illegalWords: ['transport', 'cargo', 'drive', 'vehicle'],
  },
  {
    targetWord: 'warehouse worker',
    illegalWords: ['store', 'inventory', 'move', 'goods'],
  },
  {
    targetWord: 'dock worker',
    illegalWords: ['load', 'unload', 'ship', 'cargo'],
  },
  {
    targetWord: 'factory worker',
    illegalWords: ['machine', 'production', 'manufacture', 'assembly'],
  },
  { targetWord: 'welder', illegalWords: ['metal', 'fuse', 'tools', 'join'] },
  { targetWord: 'roofer', illegalWords: ['roof', 'build', 'repair', 'house'] },
  {
    targetWord: 'plasterer',
    illegalWords: ['wall', 'smooth', 'plaster', 'surface'],
  },
  { targetWord: 'tiler', illegalWords: ['tile', 'floor', 'wall', 'install'] },
  { targetWord: 'dog walker', illegalWords: ['dog', 'walk', 'pet', 'leash'] },
  {
    targetWord: 'pet groomer',
    illegalWords: ['dog', 'care', 'hair', 'clean'],
  },
  {
    targetWord: 'park ranger',
    illegalWords: ['nature', 'protect', 'park', 'wildlife'],
  },
  {
    targetWord: 'forester',
    illegalWords: ['forest', 'trees', 'manage', 'nature'],
  },
  { targetWord: 'fisherman', illegalWords: ['fish', 'catch', 'water', 'boat'] },
  {
    targetWord: 'hunter',
    illegalWords: ['wildlife', 'track', 'catch', 'forest'],
  },
  {
    targetWord: 'rancher',
    illegalWords: ['cattle', 'land', 'animals', 'farm'],
  },
  { targetWord: 'beekeeper', illegalWords: ['bees', 'honey', 'hive', 'care'] },
  {
    targetWord: 'winemaker',
    illegalWords: ['wine', 'grapes', 'vineyard', 'ferment'],
  },
  { targetWord: 'valet', illegalWords: ['car', 'park', 'hotel', 'service'] },
  {
    targetWord: 'builder',
    illegalWords: ['construction', 'build', 'house', 'work'],
  },
  {
    targetWord: 'Paris',
    illegalWords: ['France', 'Eiffel', 'romance', 'fashion'],
  },
  {
    targetWord: 'Tokyo',
    illegalWords: ['Japan', 'sushi', 'anime', 'technology'],
  },
  {
    targetWord: 'New York',
    illegalWords: ['USA', 'Statue', 'Empire', 'Broadway'],
  },
  {
    targetWord: 'London',
    illegalWords: ['England', 'Big Ben', 'Thames', 'royal'],
  },
  {
    targetWord: 'Sydney',
    illegalWords: ['Australia', 'Opera', 'Harbour', 'kangaroo'],
  },
  {
    targetWord: 'Cairo',
    illegalWords: ['Egypt', 'pyramids', 'Nile', 'Sphinx'],
  },
  {
    targetWord: 'Rome',
    illegalWords: ['Italy', 'Colosseum', 'Vatican', 'ancient'],
  },
  {
    targetWord: 'Moscow',
    illegalWords: ['Russia', 'Kremlin', 'Red Square', 'Soviet'],
  },
  {
    targetWord: 'Beijing',
    illegalWords: ['China', 'Great Wall', 'Forbidden', 'capital'],
  },
  {
    targetWord: 'Berlin',
    illegalWords: ['Germany', 'Wall', 'Brandenburg', 'capital'],
  },
  {
    targetWord: 'Rio de Janeiro',
    illegalWords: ['Brazil', 'Carnival', 'Christ', 'beach'],
  },
  { targetWord: 'Dubai', illegalWords: ['UAE', 'Burj', 'luxury', 'desert'] },
  {
    targetWord: 'Barcelona',
    illegalWords: ['Spain', 'Gaudi', 'Catalonia', 'beach'],
  },
  {
    targetWord: 'Mumbai',
    illegalWords: ['India', 'Bollywood', 'financial', 'crowded'],
  },
  {
    targetWord: 'Bangkok',
    illegalWords: ['Thailand', 'temples', 'street food', 'traffic'],
  },
  {
    targetWord: 'Buenos Aires',
    illegalWords: ['Argentina', 'tango', 'plaza', 'steak'],
  },
  {
    targetWord: 'Istanbul',
    illegalWords: ['Turkey', 'Bosphorus', 'Hagia Sophia', 'bazaar'],
  },
  {
    targetWord: 'Toronto',
    illegalWords: ['Canada', 'CN Tower', 'Lake Ontario', 'diverse'],
  },
  {
    targetWord: 'Los Angeles',
    illegalWords: ['USA', 'Hollywood', 'beaches', 'celebrities'],
  },
  {
    targetWord: 'Seoul',
    illegalWords: ['South Korea', 'K-pop', 'technology', 'palace'],
  },
  {
    targetWord: 'Lisbon',
    illegalWords: ['Portugal', 'tram', 'Pasteis de Nata', 'Atlantic'],
  },
  {
    targetWord: 'Athens',
    illegalWords: ['Greece', 'Acropolis', 'ancient', 'Parthenon'],
  },
  {
    targetWord: 'Cape Town',
    illegalWords: ['South Africa', 'Table Mountain', 'Robben', 'beach'],
  },
  {
    targetWord: 'Mexico City',
    illegalWords: ['Mexico', 'Aztec', 'capital', 'pollution'],
  },
  {
    targetWord: 'Madrid',
    illegalWords: ['Spain', 'capital', 'museum', 'football'],
  },
  {
    targetWord: 'Scrabble',
    illegalWords: ['tiles', 'letters', 'board', 'points'],
  },
  {
    targetWord: 'Monopoly',
    illegalWords: ['money', 'properties', 'jail', 'rent'],
  },
  { targetWord: 'Chess', illegalWords: ['king', 'queen', 'check', 'board'] },
  {
    targetWord: 'Clue',
    illegalWords: ['murder', 'suspects', 'weapon', 'rooms'],
  },
  {
    targetWord: 'Candy Land',
    illegalWords: ['sweets', 'colors', 'kids', 'game'],
  },
  {
    targetWord: 'Risk',
    illegalWords: ['strategy', 'conquer', 'armies', 'territories'],
  },
  {
    targetWord: 'Battleship',
    illegalWords: ['ships', 'coordinates', 'hit', 'sink'],
  },
  { targetWord: 'Boggle', illegalWords: ['letters', 'grid', 'words', 'timer'] },
  {
    targetWord: 'Pictionary',
    illegalWords: ['draw', 'sketch', 'picture', 'team'],
  },
  {
    targetWord: 'Taboo',
    illegalWords: ['guess', 'words', 'describe', 'timer'],
  },
  { targetWord: 'Jenga', illegalWords: ['blocks', 'tower', 'fall', 'stack'] },
  { targetWord: 'Uno', illegalWords: ['cards', 'colors', 'numbers', 'draw'] },
  {
    targetWord: 'The Game of Life',
    illegalWords: ['career', 'salary', 'family', 'life'],
  },
  {
    targetWord: 'Apples to Apples',
    illegalWords: ['cards', 'compare', 'judge', 'words'],
  },
  {
    targetWord: 'Operation',
    illegalWords: ['patient', 'surgery', 'buzz', 'pieces'],
  },
  { targetWord: 'Sorry!', illegalWords: ['pieces', 'start', 'home', 'move'] },
  {
    targetWord: 'Mouse Trap',
    illegalWords: ['trap', 'build', 'cheese', 'pieces'],
  },
  { targetWord: 'Trouble', illegalWords: ['pop', 'move', 'board', 'start'] },
  {
    targetWord: 'Connect Four',
    illegalWords: ['discs', 'grid', 'line', 'game'],
  },
  {
    targetWord: 'Guess Who?',
    illegalWords: ['faces', 'questions', 'pictures', 'characters'],
  },
  { targetWord: 'Yahtzee', illegalWords: ['dice', 'roll', 'score', 'chance'] },
  {
    targetWord: 'Chutes and Ladders',
    illegalWords: ['board', 'numbers', 'climb', 'slide'],
  },
  {
    targetWord: 'Backgammon',
    illegalWords: ['dice', 'move', 'checkers', 'points'],
  },
  { targetWord: 'Checkers', illegalWords: ['board', 'move', 'jump', 'king'] },
  {
    targetWord: 'Dungeons & Dragons',
    illegalWords: ['roleplay', 'dice', 'character', 'campaign'],
  },
  {
    targetWord: "New Year's Day",
    illegalWords: ['January', 'year', 'celebrate', 'eve'],
  },
  {
    targetWord: "Valentine's Day",
    illegalWords: ['love', 'heart', 'February', 'romance'],
  },
  {
    targetWord: "St. Patrick's Day",
    illegalWords: ['green', 'Irish', 'March', 'clover'],
  },
  { targetWord: 'Easter', illegalWords: ['egg', 'bunny', 'spring', 'Sunday'] },
  {
    targetWord: "Mother's Day",
    illegalWords: ['mom', 'May', 'flowers', 'parent'],
  },
  {
    targetWord: 'Memorial Day',
    illegalWords: ['military', 'May', 'honor', 'holiday'],
  },
  {
    targetWord: "Father's Day",
    illegalWords: ['dad', 'June', 'tie', 'parent'],
  },
  {
    targetWord: 'Independence Day',
    illegalWords: ['fireworks', 'July', 'freedom', 'America'],
  },
  {
    targetWord: 'Labor Day',
    illegalWords: ['September', 'work', 'holiday', 'unions'],
  },
  {
    targetWord: 'Halloween',
    illegalWords: ['costume', 'October', 'candy', 'ghost'],
  },
  {
    targetWord: 'Thanksgiving',
    illegalWords: ['turkey', 'November', 'feast', 'family'],
  },
  {
    targetWord: 'Christmas',
    illegalWords: ['tree', 'December', 'Santa', 'gifts'],
  },
  {
    targetWord: 'Hanukkah',
    illegalWords: ['menorah', 'candles', 'Jewish', 'dreidel'],
  },
  {
    targetWord: 'Mardi Gras',
    illegalWords: ['parade', 'beads', 'New Orleans', 'February'],
  },
  {
    targetWord: 'Veterans Day',
    illegalWords: ['military', 'November', 'honor', 'service'],
  },
  {
    targetWord: 'Groundhog Day',
    illegalWords: ['shadow', 'February', 'winter', 'spring'],
  },
  {
    targetWord: 'Arbor Day',
    illegalWords: ['trees', 'plant', 'April', 'environment'],
  },
  {
    targetWord: 'Cinco de Mayo',
    illegalWords: ['Mexico', 'May', 'celebration', 'victory'],
  },
  {
    targetWord: 'Martin Luther King Jr. Day',
    illegalWords: ['civil rights', 'January', 'dream', 'leader'],
  },
  {
    targetWord: "Presidents' Day",
    illegalWords: ['Washington', 'February', 'Lincoln', 'holiday'],
  },
  {
    targetWord: 'Good Friday',
    illegalWords: ['Jesus', 'Easter', 'crucifixion', 'Christian'],
  },
  {
    targetWord: 'Earth Day',
    illegalWords: ['planet', 'April', 'environment', 'nature'],
  },
  {
    targetWord: 'Flag Day',
    illegalWords: ['June', 'stars', 'stripes', 'America'],
  },
  {
    targetWord: "April Fool's Day",
    illegalWords: ['prank', 'joke', 'April', 'trick'],
  },
  {
    targetWord: 'Day of the Dead',
    illegalWords: ['Mexico', 'November', 'ancestors', 'celebration'],
  },
  {
    targetWord: 'Ash Wednesday',
    illegalWords: ['Christian', 'Lent', 'ashes', 'forehead'],
  },
  {
    targetWord: 'Palm Sunday',
    illegalWords: ['Christian', 'Jesus', 'palm', 'donkey'],
  },
  {
    targetWord: 'Necklace',
    illegalWords: ['chain', 'pendant', 'jewel', 'wear'],
  },
  {
    targetWord: 'Earrings',
    illegalWords: ['lobes', 'pierce', 'studs', 'hoops'],
  },
  {
    targetWord: 'Bracelet',
    illegalWords: ['wrist', 'band', 'bangle', 'charm'],
  },
  {
    targetWord: 'Ring',
    illegalWords: ['finger', 'engagement', 'band', 'wedding'],
  },
  {
    targetWord: 'Brooch',
    illegalWords: ['pin', 'clasp', 'wear', 'decorative'],
  },
  { targetWord: 'Anklet', illegalWords: ['ankle', 'chain', 'wear', 'foot'] },
  {
    targetWord: 'Cufflinks',
    illegalWords: ['shirt', 'sleeve', 'button', 'formal'],
  },
  { targetWord: 'Tiara', illegalWords: ['crown', 'head', 'princess', 'wear'] },
  {
    targetWord: 'Choker',
    illegalWords: ['neck', 'tight', 'wear', 'accessory'],
  },
  {
    targetWord: 'Pendant',
    illegalWords: ['chain', 'necklace', 'hang', 'decorative'],
  },
  {
    targetWord: 'Medallion',
    illegalWords: ['large', 'pendant', 'neck', 'jewelry'],
  },
  {
    targetWord: 'Locket',
    illegalWords: ['pendant', 'open', 'photo', 'necklace'],
  },
  {
    targetWord: 'Circle',
    illegalWords: ['round', 'curve', 'no corners', 'sphere'],
  },
  {
    targetWord: 'Square',
    illegalWords: ['four', 'equal', 'fair', 'rectangle'],
  },
  {
    targetWord: 'Triangle',
    illegalWords: ['three', 'sides', 'angles', 'corner'],
  },
  {
    targetWord: 'Rectangle',
    illegalWords: ['four', 'sides', 'corners', 'square'],
  },
  { targetWord: 'Oval', illegalWords: ['egg', 'ellipse', 'round', 'shape'] },
  {
    targetWord: 'Pentagon',
    illegalWords: ['five', 'sides', 'corners', 'angles'],
  },
  {
    targetWord: 'Hexagon',
    illegalWords: ['six', 'sides', 'corners', 'angles'],
  },
  {
    targetWord: 'Octagon',
    illegalWords: ['eight', 'sides', 'corners', 'angles'],
  },
  { targetWord: 'Star', illegalWords: ['points', 'shape', 'five', 'sky'] },
  {
    targetWord: 'Heart',
    illegalWords: ['love', 'valentine', 'shape', 'symbol'],
  },
  {
    targetWord: 'Diamond',
    illegalWords: ['gem', 'four sides', 'shape', 'precious'],
  },
  { targetWord: 'Crescent', illegalWords: ['moon', 'curve', 'shape', 'night'] },

  {
    targetWord: 'Xbox',
    illegalWords: ['Microsoft', 'console', 'games', 'controller'],
  },
  {
    targetWord: 'PlayStation',
    illegalWords: ['Sony', 'console', 'games', 'controller'],
  },
  {
    targetWord: 'Nintendo',
    illegalWords: ['Switch', 'console', 'games', 'Mario'],
  },
  {
    targetWord: 'Sega',
    illegalWords: ['console', 'games', 'Genesis', 'Sonic'],
  },
  { targetWord: 'Oak', illegalWords: ['tree', 'wood', 'acorn', 'strong'] },
  { targetWord: 'Pine', illegalWords: ['tree', 'needles', 'conifer', 'wood'] },
  { targetWord: 'Maple', illegalWords: ['tree', 'leaves', 'syrup', 'wood'] },
  { targetWord: 'Apple', illegalWords: ['tree', 'fruit', 'orchard', 'wood'] },
  {
    targetWord: 'Palm',
    illegalWords: ['tree', 'tropical', 'fronds', 'coconut'],
  },
  {
    targetWord: 'Redwood',
    illegalWords: ['tree', 'tall', 'California', 'giant'],
  },
  {
    targetWord: 'English',
    illegalWords: ['language', 'speak', 'words', 'world'],
  },
  {
    targetWord: 'Spanish',
    illegalWords: ['language', 'speak', 'words', 'Spain'],
  },
  {
    targetWord: 'Mandarin',
    illegalWords: ['language', 'China', 'speak', 'words'],
  },
  {
    targetWord: 'French',
    illegalWords: ['language', 'France', 'Paris', 'words'],
  },
  {
    targetWord: 'German',
    illegalWords: ['language', 'Germany', 'speak', 'words'],
  },
  {
    targetWord: 'Japanese',
    illegalWords: ['language', 'Japan', 'east', 'sun'],
  },

  // Top five most well known dinosaurs
  {
    targetWord: 'Tyrannosaurus Rex',
    illegalWords: ['T-Rex', 'dinosaur', 'carnivore', 'rex'],
  },
  {
    targetWord: 'Triceratops',
    illegalWords: ['dinosaur', 'horns', 'herbivore', 'three'],
  },
  {
    targetWord: 'Velociraptor',
    illegalWords: ['dinosaur', 'raptor', 'fast', 'carnivore'],
  },
  {
    targetWord: 'Stegosaurus',
    illegalWords: ['dinosaur', 'plates', 'herbivore', 'spikes'],
  },
  {
    targetWord: 'Pterodactyl',
    illegalWords: ['dinosaur', 'wings', 'flying', 'reptile'],
  },

  // Top ten most well known TV shows
  {
    targetWord: 'Friends',
    illegalWords: ['sitcom', 'Rachel', 'Monica', 'Chandler'],
  },
  {
    targetWord: 'Game of Thrones',
    illegalWords: ['dragons', 'Thrones', 'Westeros', 'series'],
  },
  {
    targetWord: 'Breaking Bad',
    illegalWords: ['meth', 'Walter', 'Jesse', 'series'],
  },
  {
    targetWord: 'The Simpsons',
    illegalWords: ['cartoon', 'Homer', 'Bart', 'series'],
  },
  {
    targetWord: 'The Office',
    illegalWords: ['sitcom', 'Michael', 'Dwight', 'series'],
  },
  {
    targetWord: 'Stranger Things',
    illegalWords: ['Netflix', 'Hawkins', 'Upside Down', 'series'],
  },
  {
    targetWord: 'Seinfeld',
    illegalWords: ['sitcom', 'Jerry', 'Elaine', 'series'],
  },
  {
    targetWord: 'The Big Bang Theory',
    illegalWords: ['sitcom', 'Sheldon', 'Penny', 'series'],
  },

  // Top ten most well known historical figures
  {
    targetWord: 'Albert Einstein',
    illegalWords: ['physics', 'relativity', 'scientist', 'genius'],
  },
  {
    targetWord: 'Martin Luther King Jr.',
    illegalWords: ['civil rights', 'speech', 'dream', 'leader'],
  },
  {
    targetWord: 'Nelson Mandela',
    illegalWords: ['apartheid', 'South Africa', 'president', 'freedom'],
  },
  {
    targetWord: 'George Washington',
    illegalWords: ['president', 'USA', 'revolution', 'founder'],
  },
  {
    targetWord: 'Abraham Lincoln',
    illegalWords: ['president', 'civil war', 'emancipation', 'honest'],
  },
  {
    targetWord: 'Julius Caesar',
    illegalWords: ['Rome', 'emperor', 'assassination', 'leader'],
  },
  {
    targetWord: 'Cleopatra',
    illegalWords: ['Egypt', 'queen', 'pharaoh', 'Ptolemy'],
  },
  {
    targetWord: 'Leonardo da Vinci',
    illegalWords: ['artist', 'Mona Lisa', 'inventor', 'Renaissance'],
  },

  // Top twenty most well known movies
  {
    targetWord: 'The Godfather',
    illegalWords: ['mafia', 'Corleone', 'crime', 'family'],
  },
  {
    targetWord: 'Star Wars',
    illegalWords: ['Jedi', 'force', 'galaxy', 'Luke'],
  },
  { targetWord: 'Titanic', illegalWords: ['ship', 'iceberg', 'Jack', 'Rose'] },
  {
    targetWord: 'The Wizard of Oz',
    illegalWords: ['Dorothy', 'Kansas', 'witch', 'yellow'],
  },
  {
    targetWord: 'The Lord of the Rings',
    illegalWords: ['ring', 'Frodo', 'Middle-earth', 'Hobbit'],
  },
  {
    targetWord: 'Jurassic Park',
    illegalWords: ['dinosaurs', 'island', 'park', 'chaos'],
  },
  {
    targetWord: 'Batman',
    illegalWords: ['Robin', 'Joker', 'Gotham', 'crime'],
  },
  {
    targetWord: 'Forrest Gump',
    illegalWords: ['box', 'chocolates', 'run', 'Jenny'],
  },
  {
    targetWord: 'The Matrix',
    illegalWords: ['Neo', 'reality', 'red pill', 'computer'],
  },
  {
    targetWord: 'Back to the Future',
    illegalWords: ['time travel', 'DeLorean', 'Marty', 'Doc'],
  },
  {
    targetWord: 'Harry Potter',
    illegalWords: ['wizard', 'Hogwarts', 'magic', 'Potter'],
  },
  {
    targetWord: 'E.T. the Extra-Terrestrial',
    illegalWords: ['alien', 'home', 'bicycle', 'friend'],
  },
  {
    targetWord: 'Gladiator',
    illegalWords: ['Rome', 'arena', 'Russell Crowe', 'fight'],
  },
  {
    targetWord: 'Rocky',
    illegalWords: ['boxer', 'Philadelphia', 'fight', 'Balboa'],
  },
  {
    targetWord: `Schindler's List`,
    illegalWords: ['Holocaust', 'Nazi', 'Jews', 'Schindler'],
  },
  {
    targetWord: 'Casablanca',
    illegalWords: ['Bogart', 'Paris', 'love', 'war'],
  },

  // Top five most well known books
  {
    targetWord: 'To Kill a Mockingbird',
    illegalWords: ['Harper Lee', 'Scout', 'Atticus', 'trial'],
  },
  {
    targetWord: '1984',
    illegalWords: ['Orwell', 'Big Brother', 'dystopia', 'totalitarian'],
  },
  {
    targetWord: 'Moby-Dick',
    illegalWords: ['whale', 'Ishmael', 'Ahab', 'sea'],
  },
  {
    targetWord: 'Pride and Prejudice',
    illegalWords: ['Austen', 'Elizabeth', 'Darcy', 'love'],
  },
  {
    targetWord: 'The Great Gatsby',
    illegalWords: ['Fitzgerald', 'Nick', 'Daisy', 'wealth'],
  },

  {
    targetWord: "McDonald's",
    illegalWords: ['burgers', 'fries', 'golden arches', 'happy meal'],
  },
  {
    targetWord: 'Burger King',
    illegalWords: ['whopper', 'fries', 'flame-grilled', 'king'],
  },
  {
    targetWord: "Wendy's",
    illegalWords: ['frosty', 'square burgers', 'Dave Thomas', 'baconator'],
  },
  {
    targetWord: 'Taco Bell',
    illegalWords: ['Mexican', 'tacos', 'burritos', 'bell'],
  },
  {
    targetWord: 'KFC',
    illegalWords: ['chicken', 'fried', 'colonel', 'buckets'],
  },
  {
    targetWord: 'Subway',
    illegalWords: ['sandwich', 'subs', 'footlong', 'Jared'],
  },
  {
    targetWord: 'Chick-fil-A',
    illegalWords: ['chicken', 'waffle fries', 'closed Sunday', 'sandwich'],
  },
  {
    targetWord: 'Pizza Hut',
    illegalWords: ['pizza', 'stuffed crust', 'pepperoni', 'delivery'],
  },
  {
    targetWord: "Domino's",
    illegalWords: ['pizza', 'delivery', 'crust', 'pepperoni'],
  },
  {
    targetWord: 'In-N-Out',
    illegalWords: ['drive-thru', 'animal', 'burger', 'all about'],
  },
  { targetWord: 'Rock', illegalWords: ['guitar', 'band', 'drums', 'classic'] },
  {
    targetWord: 'Pop',
    illegalWords: ['charts', 'mainstream', 'hits', 'dance'],
  },
  { targetWord: 'Hip Hop', illegalWords: ['rap', 'MC', 'beats', 'urban'] },
  {
    targetWord: 'Jazz',
    illegalWords: ['saxophone', 'improv', 'blues', 'swing'],
  },
  {
    targetWord: 'Classical',
    illegalWords: ['orchestra', 'symphony', 'Beethoven', 'Mozart'],
  },
  {
    targetWord: 'Country',
    illegalWords: ['guitar', 'cowboy', 'Nashville', 'twang'],
  },
  {
    targetWord: 'Electronic',
    illegalWords: ['synthesizer', 'EDM', 'DJ', 'beats'],
  },
  {
    targetWord: 'Reggae',
    illegalWords: ['Jamaica', 'Bob Marley', 'island', 'rhythm'],
  },
  {
    targetWord: 'Blues',
    illegalWords: ['guitar', 'soul', 'Mississippi', 'emotion'],
  },
  { targetWord: 'Metal', illegalWords: ['heavy', 'guitar', 'drums', 'loud'] },

  { targetWord: 'LEGO', illegalWords: ['bricks', 'build', 'blocks', 'sets'] },
  { targetWord: 'Barbie', illegalWords: ['doll', 'Mattel', 'fashion', 'Ken'] },
  {
    targetWord: 'Hot Wheels',
    illegalWords: ['cars', 'racing', 'Mattel', 'tracks'],
  },
  { targetWord: 'Nerf', illegalWords: ['blaster', 'foam', 'guns', 'Hasbro'] },
  {
    targetWord: 'Fisher-Price',
    illegalWords: ['toys', 'infants', 'play', 'learning'],
  },
  { targetWord: 'Play-Doh', illegalWords: ['clay', 'model', 'Hasbro', 'mold'] },
  {
    targetWord: 'Transformers',
    illegalWords: ['robots', 'Hasbro', 'vehicles', 'Autobots'],
  },
  {
    targetWord: 'My Little Pony',
    illegalWords: ['Hasbro', 'horses', 'friendship', 'dolls'],
  },
  {
    targetWord: 'Star Wars',
    illegalWords: ['Hasbro', 'action figures', 'sci-fi', 'movie'],
  },
  { targetWord: 'Zeus', illegalWords: ['Greek', 'god', 'thunder', 'Olympus'] },
  {
    targetWord: 'Hercules',
    illegalWords: ['strength', 'Greek', 'hero', 'labors'],
  },
  { targetWord: 'Thor', illegalWords: ['Norse', 'god', 'hammer', 'thunder'] },
  { targetWord: 'Achilles', illegalWords: ['Greek', 'hero', 'heel', 'Trojan'] },
  { targetWord: 'Poseidon', illegalWords: ['Greek', 'god', 'sea', 'trident'] },

  {
    targetWord: 'Butterfly',
    illegalWords: ['wings', 'caterpillar', 'colorful', 'metamorphosis'],
  },
  { targetWord: 'Bee', illegalWords: ['honey', 'hive', 'sting', 'pollinate'] },
  { targetWord: 'Ant', illegalWords: ['colony', 'hill', 'insect', 'worker'] },
  { targetWord: 'Mosquito', illegalWords: ['bite', 'blood', 'insect', 'pest'] },
  { targetWord: 'Ladybug', illegalWords: ['spots', 'red', 'insect', 'garden'] },
  {
    targetWord: 'Dragonfly',
    illegalWords: ['wings', 'insect', 'fly', 'predator'],
  },
  {
    targetWord: 'Grasshopper',
    illegalWords: ['jump', 'insect', 'legs', 'chirp'],
  },
  { targetWord: 'Spider', illegalWords: ['web', 'arachnid', 'legs', 'insect'] },
  {
    targetWord: 'Cockroach',
    illegalWords: ['pest', 'insect', 'scavenger', 'survive'],
  },
  {
    targetWord: 'Firefly',
    illegalWords: ['light', 'glow', 'insect', 'summer'],
  },

  {
    targetWord: 'Reading',
    illegalWords: ['books', 'literature', 'novel', 'pages'],
  },
  {
    targetWord: 'Gardening',
    illegalWords: ['plants', 'flowers', 'soil', 'grow'],
  },
  {
    targetWord: 'Cooking',
    illegalWords: ['food', 'kitchen', 'recipe', 'chef'],
  },
  {
    targetWord: 'Painting',
    illegalWords: ['canvas', 'brush', 'colors', 'art'],
  },
  {
    targetWord: 'Photography',
    illegalWords: ['camera', 'pictures', 'photos', 'images'],
  },
  { targetWord: 'Fishing', illegalWords: ['fish', 'rod', 'water', 'catch'] },
  {
    targetWord: 'Cycling',
    illegalWords: ['bike', 'ride', 'wheels', 'exercise'],
  },
  {
    targetWord: 'Hiking',
    illegalWords: ['trail', 'walk', 'nature', 'mountain'],
  },
  {
    targetWord: 'Knitting',
    illegalWords: ['yarn', 'needles', 'sweater', 'craft'],
  },
  {
    targetWord: 'Traveling',
    illegalWords: ['trip', 'journey', 'vacation', 'explore'],
  },
  {
    targetWord: 'Las Vegas',
    illegalWords: ['casino', 'gambling', 'strip', 'desert'],
  },
  { targetWord: 'Sunny', illegalWords: ['sun', 'bright', 'clear', 'day'] },
  { targetWord: 'Rainy', illegalWords: ['wet', 'drops', 'storm', 'umbrella'] },
  { targetWord: 'Snowy', illegalWords: ['snow', 'white', 'cold', 'winter'] },
  { targetWord: 'Cloudy', illegalWords: ['clouds', 'overcast', 'gray', 'sky'] },
  { targetWord: 'Windy', illegalWords: ['blow', 'air', 'breeze', 'gust'] },
  {
    targetWord: 'Foggy',
    illegalWords: ['mist', 'visibility', 'dense', 'hazy'],
  },
  { targetWord: 'Humid', illegalWords: ['moisture', 'air', 'sticky', 'muggy'] },
  { targetWord: 'Hail', illegalWords: ['ice', 'stones', 'storm', 'cold'] },
  {
    targetWord: 'Television',
    illegalWords: ['screen', 'TV', 'remote', 'watch'],
  },
  {
    targetWord: 'Refrigerator',
    illegalWords: ['cold', 'food', 'appliance', 'kitchen'],
  },
  {
    targetWord: 'Microwave',
    illegalWords: ['heat', 'appliance', 'kitchen', 'food'],
  },
  {
    targetWord: 'Sofa',
    illegalWords: ['couch', 'seating', 'living room', 'furniture'],
  },
  {
    targetWord: 'Bed',
    illegalWords: ['sleep', 'mattress', 'pillows', 'bedroom'],
  },
  {
    targetWord: 'Table',
    illegalWords: ['furniture', 'dining', 'surface', 'legs'],
  },
  { targetWord: 'Chair', illegalWords: ['sit', 'seat', 'legs', 'furniture'] },
  {
    targetWord: 'Lamp',
    illegalWords: ['light', 'bulb', 'shade', 'electricity'],
  },
  { targetWord: 'Oven', illegalWords: ['bake', 'cook', 'kitchen', 'heat'] },
  {
    targetWord: 'Washing Machine',
    illegalWords: ['laundry', 'clothes', 'appliance', 'clean'],
  },
  { targetWord: 'Car', illegalWords: ['drive', 'wheels', 'vehicle', 'engine'] },
  { targetWord: 'Bicycle', illegalWords: ['bike', 'pedal', 'wheels', 'ride'] },
  {
    targetWord: 'Train',
    illegalWords: ['tracks', 'rail', 'locomotive', 'ride'],
  },
  { targetWord: 'Airplane', illegalWords: ['fly', 'sky', 'jet', 'wings'] },
  { targetWord: 'Bus', illegalWords: ['public', 'transport', 'ride', 'stop'] },
  { targetWord: 'Boat', illegalWords: ['water', 'sail', 'ship', 'float'] },
  {
    targetWord: 'Subway',
    illegalWords: ['underground', 'metro', 'train', 'city'],
  },
  {
    targetWord: 'Motorcycle',
    illegalWords: ['bike', 'ride', 'helmet', 'engine'],
  },
  { targetWord: 'Truck', illegalWords: ['bed', 'tow', 'pickup', 'semi'] },
  { targetWord: 'Scooter', illegalWords: ['ride', 'wheels', 'motor', 'stand'] },
  { targetWord: 'Balloon', illegalWords: ['float', 'air', 'inflate', 'party'] },
  {
    targetWord: 'Dinosaur',
    illegalWords: ['extinct', 'fossil', 'reptile', 'prehistoric'],
  },
  { targetWord: 'Rainbow', illegalWords: ['colors', 'sky', 'arc', 'rain'] },
  { targetWord: 'Kitten', illegalWords: ['cat', 'pet', 'small', 'fur'] },
  { targetWord: 'Puppy', illegalWords: ['dog', 'pet', 'small', 'bark'] },
  {
    targetWord: 'Cupcake',
    illegalWords: ['bake', 'frosting', 'sweet', 'cake'],
  },
  {
    targetWord: 'Unicorn',
    illegalWords: ['mythical', 'horn', 'horse', 'magic'],
  },
  { targetWord: 'Pirate', illegalWords: ['ship', 'treasure', 'sea', 'sailor'] },
  {
    targetWord: 'Princess',
    illegalWords: ['royalty', 'castle', 'queen', 'tiara'],
  },
  {
    targetWord: 'Rocket',
    illegalWords: ['space', 'launch', 'NASA', 'astronaut'],
  },
  { targetWord: 'Fairy', illegalWords: ['wings', 'magic', 'small', 'myth'] },
  { targetWord: 'Castle', illegalWords: ['fortress', 'king', 'queen', 'moat'] },
  { targetWord: 'Dragon', illegalWords: ['fire', 'myth', 'wings', 'scales'] },
  { targetWord: 'Mermaid', illegalWords: ['sea', 'fish', 'tail', 'myth'] },
  { targetWord: 'Elephant', illegalWords: ['trunk', 'animal', 'large', 'zoo'] },
  { targetWord: 'Giraffe', illegalWords: ['neck', 'animal', 'spots', 'zoo'] },
  {
    targetWord: 'Ice Cream',
    illegalWords: ['dessert', 'cold', 'scoop', 'cone'],
  },
  { targetWord: 'Airplane', illegalWords: ['fly', 'sky', 'jet', 'wings'] },
  {
    targetWord: 'Train',
    illegalWords: ['tracks', 'rail', 'locomotive', 'ride'],
  },
  { targetWord: 'Bicycle', illegalWords: ['bike', 'pedal', 'wheels', 'ride'] },
  { targetWord: 'Kite', illegalWords: ['fly', 'wind', 'string', 'sky'] },
  {
    targetWord: 'Robot',
    illegalWords: ['machine', 'program', 'metal', 'android'],
  },
  { targetWord: 'Lollipop', illegalWords: ['candy', 'sweet', 'stick', 'suck'] },
  { targetWord: 'Moon', illegalWords: ['night', 'sky', 'crater', 'orbit'] },
  { targetWord: 'Star', illegalWords: ['night', 'sky', 'shine', 'twinkle'] },
  {
    targetWord: 'Teddy Bear',
    illegalWords: ['stuffed', 'toy', 'hug', 'fuzzy'],
  },
  { targetWord: 'Flower', illegalWords: ['petal', 'garden', 'bloom', 'plant'] },
  { targetWord: 'Bubble', illegalWords: ['soap', 'pop', 'blow', 'float'] },
  { targetWord: 'Crayon', illegalWords: ['color', 'draw', 'wax', 'art'] },
  { targetWord: 'Tree', illegalWords: ['leaves', 'wood', 'branches', 'grow'] },
  {
    targetWord: 'Butterfly',
    illegalWords: ['wings', 'caterpillar', 'colorful', 'metamorphosis'],
  },
  {
    targetWord: 'Snowman',
    illegalWords: ['winter', 'cold', 'frosty', 'build'],
  },
  {
    targetWord: 'Cupcake',
    illegalWords: ['bake', 'frosting', 'sweet', 'dessert'],
  },
  { targetWord: 'Whale', illegalWords: ['ocean', 'large', 'mammal', 'water'] },
  {
    targetWord: 'Dolphin',
    illegalWords: ['ocean', 'intelligent', 'mammal', 'swim'],
  },
  {
    targetWord: 'Penguin',
    illegalWords: ['cold', 'bird', 'Antarctica', 'tuxedo'],
  },
  {
    targetWord: 'Octopus',
    illegalWords: ['tentacles', 'ocean', 'eight', 'ink'],
  },
  { targetWord: 'Shark', illegalWords: ['ocean', 'teeth', 'fish', 'predator'] },
  {
    targetWord: 'Firetruck',
    illegalWords: ['red', 'fire', 'emergency', 'ladder'],
  },
  {
    targetWord: 'Police Car',
    illegalWords: ['sirens', 'emergency', 'vehicle', 'officer'],
  },
  {
    targetWord: 'Ambulance',
    illegalWords: ['emergency', 'vehicle', 'paramedic', 'hospital'],
  },
  { targetWord: 'Helicopter', illegalWords: ['rotor', 'fly', 'air', 'rescue'] },
  { targetWord: 'Bus', illegalWords: ['public', 'transport', 'ride', 'stop'] },
  {
    targetWord: 'Dolphin',
    illegalWords: ['ocean', 'intelligent', 'mammal', 'swim'],
  },
  { targetWord: 'Whale', illegalWords: ['ocean', 'large', 'mammal', 'water'] },
  {
    targetWord: 'Octopus',
    illegalWords: ['tentacles', 'ocean', 'eight', 'ink'],
  },
  {
    targetWord: 'Jellyfish',
    illegalWords: ['sting', 'ocean', 'tentacles', 'transparent'],
  },
  {
    targetWord: 'Sea Turtle',
    illegalWords: ['shell', 'ocean', 'swim', 'reptile'],
  },
  { targetWord: 'Starfish', illegalWords: ['arms', 'ocean', 'five', 'marine'] },
  { targetWord: 'Seahorse', illegalWords: ['ocean', 'tiny', 'tail', 'swim'] },
  { targetWord: 'Crab', illegalWords: ['claws', 'ocean', 'shell', 'beach'] },
  { targetWord: 'Lobster', illegalWords: ['claws', 'ocean', 'shell', 'red'] },
  {
    targetWord: 'Clownfish',
    illegalWords: ['Nemo', 'reef', 'anemone', 'orange'],
  },
  {
    targetWord: 'Eel',
    illegalWords: ['long', 'slippery', 'electric', 'ocean'],
  },
  {
    targetWord: 'Sea Urchin',
    illegalWords: ['spines', 'ocean', 'prickly', 'marine'],
  },
  {
    targetWord: 'Squid',
    illegalWords: ['tentacles', 'ink', 'ocean', 'calamari'],
  },
  {
    targetWord: 'Coral',
    illegalWords: ['reef', 'colorful', 'ocean', 'marine'],
  },
  {
    targetWord: 'Penguin',
    illegalWords: ['cold', 'bird', 'Antarctica', 'tuxedo'],
  },
  { targetWord: 'Seal', illegalWords: ['ocean', 'flippers', 'mammal', 'bark'] },
  {
    targetWord: 'Walrus',
    illegalWords: ['tusks', 'ocean', 'mammal', 'arctic'],
  },
  {
    targetWord: 'Shrimp',
    illegalWords: ['small', 'ocean', 'pink', 'crustacean'],
  },
  {
    targetWord: 'Oyster',
    illegalWords: ['shell', 'pearl', 'ocean', 'mollusk'],
  },
  { targetWord: 'Swordfish', illegalWords: ['bill', 'ocean', 'fish', 'sharp'] },
  {
    targetWord: 'Humpback Whale',
    illegalWords: ['ocean', 'large', 'mammal', 'sing'],
  },
];
