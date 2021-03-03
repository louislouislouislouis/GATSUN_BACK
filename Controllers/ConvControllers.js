const HttpError = require("../model/http-err");
const { v4: uuidv4 } = require("uuid");
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
const createConv = async (req, res, next) => {
  console.log("creating conv");
  const idconv = uuidv4();
  const { part1, part2 } = req.body;
  console.log(part1);
  console.log(req.userData.userId, part1, part2);

  if (part1 !== req.userData.userId && part2 !== req.userData.userId) {
    const error = new HttpError("Your not allowed to create this conv", 401);
    return next(error);
  }

  const newconv = {
    id: idconv,
    participants: [part1, part2],
    messages: [],
    img: [
      DUMMY_USER.find((usr) => usr.id == part1).img,
      DUMMY_USER.find((usr) => usr.id == part2).img,
    ],
  };

  DUMMY_CONV.push(newconv);

  //adding conv to first userConvPart

  const usr1index = DUMMY_USER.findIndex((usr) => usr.id == part1);
  DUMMY_USER[usr1index].conversation = DUMMY_USER[
    usr1index
  ].conversation.concat(idconv);

  //adding conv to second userConvPart

  const usr2index = DUMMY_USER.findIndex((usr) => usr.id == part2);
  DUMMY_USER[usr2index].conversation = DUMMY_USER[
    usr2index
  ].conversation.concat(idconv);

  console.log(DUMMY_USER);
  console.log(DUMMY_CONV);

  res.json(idconv);

  console.log("conv" + idconv + "created");
};

const postmsg = async (req, res, next) => {
  console.log("Un message vient d'être posté");

  const convId = req.params.convId;
  const userId = req.userData.userId;

  const myconv = DUMMY_CONV.find((conv) => conv.id == convId);

  const parts = myconv.participants.filter((part) => part != userId);

  if (userId !== req.userData.userId) {
    const error = new HttpError("Your not allowed to send this message", 401);
    return next(error);
  }

  if (myconv) {
    myconv.messages.push({
      from: userId,
      date: new Date(),
      body: req.body.value,
    });
    res.json({ message: "Your message has been sent" });
  } else {
    const error = new HttpError("Please, do not play that game with me", 401);
    return next(error);
  }
};
const getConvsByUserId = async (req, res, next) => {
  console.log("Demande de get convby userId");
  const userId = req.params.uid;

  if (userId !== req.userData.userId) {
    const error = new HttpError("Your not allowed to see this conv", 401);
    return next(error);
  }
  const userConvs = DUMMY_USER.find((user) => user.id == userId).conversation;

  let response = [];
  for (const conv of userConvs) {
    response.push(DUMMY_CONV.find((conve) => conve.id == conv));
  }
  res.json(response);
};

const getConvById = async (req, res, next) => {
  console.log("Demande de getConvbyId...");

  const userId = req.userData.userId;
  const convId = req.params.convId;

  const myconv = DUMMY_CONV.find((conv) => conv.id == convId);

  if (!myconv.participants.includes(userId)) {
    const error = new HttpError("Your not allowed to see this conv", 401);
    return next(error);
  }
  if (myconv) {
    res.json(myconv);
  } else {
    const error = new HttpError("Conv doesn not exist", 404);
    return next(error);
  }
  console.log("Fin de getConvbyId...");
};

const isExistingConv = async (req, res, next) => {
  console.log("Demande de isExistingConv...");
  const { userId1, userId2 } = req.body;
  if (userId1 === userId2) {
    const error = new HttpError("Why created a couv with you?", 401);
    return next(error);
  }

  if (userId1 !== req.userData.userId) {
    const error = new HttpError("Your not allowed to see this conv", 401);
    return next(error);
  }

  const existingconv = DUMMY_CONV.find(
    (conv) =>
      conv.participants.includes(userId1) && conv.participants.includes(userId2)
  );
  console.log(existingconv);
  if (!existingconv) {
    const idconv = uuidv4();
    const newconv = {
      id: idconv,
      participants: [userId1, userId2],
      messages: [],
      img: [
        DUMMY_USER.find((usr) => usr.id == userId1).img,
        DUMMY_USER.find((usr) => usr.id == userId2).img,
      ],
    };

    DUMMY_CONV.push(newconv);

    //adding conv to first userConvPart

    const usr1index = DUMMY_USER.findIndex((usr) => usr.id == userId1);
    DUMMY_USER[usr1index].conversation = DUMMY_USER[
      usr1index
    ].conversation.concat(idconv);

    //adding conv to second userConvPart

    const usr2index = DUMMY_USER.findIndex((usr) => usr.id == userId2);
    DUMMY_USER[usr2index].conversation = DUMMY_USER[
      usr2index
    ].conversation.concat(idconv);

    console.log(DUMMY_USER);
    console.log(DUMMY_CONV);
    res.json({ idconv: idconv, new: true });
    console.log("conv" + idconv + "created");
  } else {
    console.log(DUMMY_USER);
    console.log(DUMMY_CONV);
    res.json({ idconv: existingconv.id, new: false });
  }
};

exports.getConvById = getConvById;
exports.getConvsByUserId = getConvsByUserId;
exports.createConv = createConv;
exports.postmsg = postmsg;
exports.isExistingConv = isExistingConv;
