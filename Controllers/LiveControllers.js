const HttpError = require("../model/http-err");
const SSEManager = require("../LiveModel/ssemanager");
const Conv = require("../model/conv-model");

const sseManager = new SSEManager();
const DUMMY_USER = [
  {
    name: "LOMBARD",
    firstname: "Louis",
    username: "El_torero",
    bio:
      "Salut! Je m'appelle louis et je suis apprenti torrero en argenine. Je vous partage ma passion à travers ce blog",
    post: ["p1", "p2"],
    likes: ["Voitures", "Vie", "Pepsi"],
    password: "test1",
    conversation: ["conv1", "conv2"],
    demande: ["d1", "d2"],
    id: "u1",
    email: "test@test.com",
    role: "sudo",
    img:
      "https://www.leparisien.fr/resizer/8myHvElJVa1G1DpaHysQfhZZXzA=/932x582/cloudfront-eu-central-1.images.arcpublishing.com/leparisien/ZPHEFWAHZJXSPZPQNXN4OZJ76U.jpg",
  },
  {
    name: "martin",
    firstname: "Matin",
    username: "Ekip",
    bio:
      "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Cumque quis dolore cum placeat earum officiis molestiae praesentium consequatur aliquid suscipit tenetur, asperiores vitae pariatur aspernatur modi nemo ipsum culpa porro!",
    post: ["p3", "p4"],
    likes: ["Chat", "Chien", "Poisson"],
    password: "test2",
    conversation: ["conv1", "conv3"],
    demande: ["d9", "d4"],
    id: "u2",
    email: "test2@test.com",
    role: "u",
    img:
      "https://pbs.twimg.com/profile_images/966627563228553216/FVNkkIcj_400x400.jpg",
  },
  {
    name: "Bob",
    firstname: "L'éclair",
    username: "eee",
    bio:
      "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Cumque quis dolore cum placeat earum officiis molestiae praesentium consequatur aliquid suscipit tenetur, asperiores vitae pariatur aspernatur modi nemo ipsum culpa porro!",
    post: ["p8", "p98"],
    likes: ["Chat", "Chien", "Poisson"],
    password: "test3",
    conversation: ["conv2", "conv3"],
    demande: ["d9", "d4"],
    id: "u3",
    email: "test3@test.com",
    role: "u",
    img:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Festival_automobile_international_2016_-_Photocall_-_043_%28cropped%29.jpg/440px-Festival_automobile_international_2016_-_Photocall_-_043_%28cropped%29.jpg",
  },
  {
    name: "Bob",
    firstname: "L'éclair",
    username: "eee",
    bio:
      "Lorem ipsum dolor sit amet consectetur, adipisicing elit. Cumque quis dolore cum placeat earum officiis molestiae praesentium consequatur aliquid suscipit tenetur, asperiores vitae pariatur aspernatur modi nemo ipsum culpa porro!",
    post: ["p8", "p98"],
    likes: ["Chat", "Chien", "Poisson"],
    password: "test3",
    conversation: [],
    demande: ["d9", "d4"],
    id: "u4",
    email: "test3@test.com",
    role: "u",
    img:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Festival_automobile_international_2016_-_Photocall_-_043_%28cropped%29.jpg/440px-Festival_automobile_international_2016_-_Photocall_-_043_%28cropped%29.jpg",
  },
];
const DUMMY_CONV = [
  {
    id: "conv1",
    img: [
      "https://www.leparisien.fr/resizer/8myHvElJVa1G1DpaHysQfhZZXzA=/932x582/cloudfront-eu-central-1.images.arcpublishing.com/leparisien/ZPHEFWAHZJXSPZPQNXN4OZJ76U.jpg",
      "https://pbs.twimg.com/profile_images/966627563228553216/FVNkkIcj_400x400.jpg",
    ],
    participants: ["u1", "u2"],
    messages: [
      {
        from: "u1",
        date: "2012-04-23T18:25:43.511Z",
        body: "Hey u1, how are u?",
      },
      {
        from: "u2",
        date: "2012-04-23T18:25:44.511Z",
        body: "I am fine",
      },
      {
        from: "u1",
        date: "2012-04-23T18:25:46.511Z",
        body: "give me pizza",
      },
      {
        from: "u2",
        date: "2012-04-23T18:25:47.511Z",
        body:
          "wanna hangout tonight?Lorem ipsum dolor sit, amet consectetur adipisicing elit. Necessitatibus id laudantium, et in asperiores iste praesentium aspernatur voluptatum. Beatae pariatur assumenda repellat maxime odio corporis ad, delectus tempore deleniti fugiat?",
      },
    ],
  },
  {
    id: "conv2",
    participants: ["u1", "u3"],
    img: [
      "https://www.leparisien.fr/resizer/8myHvElJVa1G1DpaHysQfhZZXzA=/932x582/cloudfront-eu-central-1.images.arcpublishing.com/leparisien/ZPHEFWAHZJXSPZPQNXN4OZJ76U.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Festival_automobile_international_2016_-_Photocall_-_043_%28cropped%29.jpg/440px-Festival_automobile_international_2016_-_Photocall_-_043_%28cropped%29.jpg",
    ],
    messages: [
      {
        from: "u1",
        date: "2012-04-23T18:25:43.511Z",
        body: "Hey u1, how are u?",
      },
      {
        from: "u3",
        date: "2012-04-23T18:25:44.511Z",
        body: "I am fine",
      },
      {
        from: "u1",
        date: "2012-04-23T18:25:46.511Z",
        body: "give me pizza",
      },
      {
        from: "u3",
        date: "2012-04-23T18:25:47.511Z",
        body:
          "wanna hangout tonight?Lorem ipsum dolor sit, amet consectetur adipisicing elit. Necessitatibus id laudantium, et in asperiores iste praesentium aspernatur voluptatum. Beatae pariatur assumenda repellat maxime odio corporis ad, delectus tempore deleniti fugiat?",
      },
    ],
  },
  {
    id: "conv3",
    participants: ["u2", "u3"],
    img: [
      "https://pbs.twimg.com/profile_images/966627563228553216/FVNkkIcj_400x400.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Festival_automobile_international_2016_-_Photocall_-_043_%28cropped%29.jpg/440px-Festival_automobile_international_2016_-_Photocall_-_043_%28cropped%29.jpg",
    ],
    messages: [
      {
        from: "u1",
        date: "2012-04-23T18:25:43.511Z",
        body: "Hey u1, how are u?",
      },
      {
        from: "u3",
        date: "2012-04-23T18:25:44.511Z",
        body: "I am fine",
      },
      {
        from: "u1",
        date: "2012-04-23T18:25:46.511Z",
        body: "give me pizza",
      },
      {
        from: "u3",
        date: "2012-04-23T18:25:47.511Z",
        body:
          "wanna hangout tonight?Lorem ipsum dolor sit, amet consectetur adipisicing elit. Necessitatibus id laudantium, et in asperiores iste praesentium aspernatur voluptatum. Beatae pariatur assumenda repellat maxime odio corporis ad, delectus tempore deleniti fugiat?",
      },
    ],
  },
];

const entry = async (req, res, next) => {
  console.log("in");
  const id = req.params.uid;
  if (sseManager.clients.has(id)) {
    const error = new HttpError("Already connected", 403);
    return next(error);
  }
  // On ouvre la connexion avec notre client //
  sseManager.open(id, res);

  // On envoie le nombre de clients connectés à l'ensemble des clients //
  sseManager.broadcast({
    id: Date.now(),
    type: "count",
    data: sseManager.count(),
  });

  // en cas de fermeture de la connexion, on supprime le client de notre manager //
  req.on("close", () => {
    // En cas de deconnexion on supprime le client de notre manager //
    sseManager.delete(id);
    // On envoie le nouveau nombre de clients connectés //
    sseManager.broadcast({
      id: Date.now(),
      type: "count",
      data: sseManager.count(),
    });
  });
};
const newmsg = async (req, res, next) => {
  console.log("i");

  const convId = req.params.convId;
  console.log(convId);

  let conv;
  try {
    conv = await Conv.findById(convId);
  } catch (err) {
    const error = new HttpError("Error withhhh our DB", 500);
    return next(error);
  }
  if (!conv || conv.length === 0) {
    const error = new HttpError("Error", 500);
    return next(error);
  }
  const participants = conv.participants.toString().split(",");
  console.log("ddsd");
  console.log(participants);
  //console.log(sseManager.clients);
  // On ouvre la connexion avec notre client //
  // On envoie le nombre de clients connectés à l'ensemble des clients //
  participants.forEach((part) => {
    if (sseManager.clients.has(part)) {
      console.log("envoie à ", part);
      sseManager.unicast(part, {
        id: Date.now(),
        type: "newmsg",
        data: convId,
      });
    }
  });
  res.status(201).json({
    msg: "envoie",
  });
};
exports.entry = entry;
exports.newmsg = newmsg;
