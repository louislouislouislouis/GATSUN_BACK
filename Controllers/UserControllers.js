const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const HttpError = require("../model/http-err");

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
    conversation: [],
    /* conversation: ["conv3", "conv2"], */
    demande: ["d9", "d4"],
    id: "u3",
    email: "test3@test.com",
    role: "u",
    img:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Festival_automobile_international_2016_-_Photocall_-_043_%28cropped%29.jpg/440px-Festival_automobile_international_2016_-_Photocall_-_043_%28cropped%29.jpg",
  },
];
const DUMMY_CONV = [
  {
    id: "conv1",
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

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Error input", 422));
  }

  const { name, firstName, Username, email, password, image } = req.body;
  const existinguser = DUMMY_USER.find((usr) => usr.email == email);

  if (existinguser) {
    const error = new HttpError(
      "Il existe un utilisateur avec cette email",
      401
    );
    return next(error);
  }

  let hashedpassword;

  try {
    hashedpassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Could not create user please try again", 500);
    return next(error);
  }

  //creation du nouvel user

  const newUser = {
    name: name,
    firstname: firstName,
    username: Username,
    bio: "",
    post: [],
    likes: [],
    password: hashedpassword,
    conversation: [],
    demande: ["d1", "d2"],
    id: uuidv4(),
    email: email,
    role: "usr",
    img: image,
  };

  DUMMY_USER.push(newUser);

  let token;

  try {
    token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_KEY,
      {
        expiresIn: "1h",
      }
    );
  } catch (err) {
    const error = new HttpError("login up failed, please try again later", 500);
    return next(error);
  }

  res.status(201).json({
    userId: newUser.id,
    email: newUser.email,
    token: token,
  });
};

const getAllUsers = async (req, res, next) => {
  let resu = [];
  DUMMY_USER.forEach((usr) => resu.push({ id: usr.id, img: usr.img }));
  console.log(resu);
  if (resu.length !== 0) {
    res.json(resu);
  } else {
    const error = new HttpError("Error Not any user", 404);
    return next(error);
  }
};

const getUserbyId = async (req, res, next) => {
  console.log("Début de getUserbyId");
  const userId = req.params.pid;
  const myuser = DUMMY_USER.find((user) => user.id == userId);

  if (myuser) {
    res.json(myuser);
  } else {
    const error = new HttpError("UserId doesn not exist", 404);
    return next(error);
  }
  console.log("Fin de getUserbyId");
};
const login = async (req, res, next) => {
  const { email, password } = req.body;

  const existinguser = DUMMY_USER.find((usr) => usr.email == email);

  if (!existinguser) {
    const error = new HttpError(
      "Invalid User email credential, could not find user",
      401
    );
    return next(error);
  }
  let isValidPassword = password === existinguser.password;
  if (!isValidPassword) {
    try {
      isValidPassword = await bcrypt.compare(password, existinguser.password);
    } catch {
      const error = new HttpError(
        "Logging dfailed, plaease try again later",
        500
      );
      return next(error);
    }
  }
  if (!isValidPassword) {
    const error = new HttpError("Invalid pssword credential", 403);
    return next(error);
  }

  let token;
  try {
    console.log(process.env.JWT_KEY);
    console.log(existinguser.id);
    console.log(existinguser.email);
    token = jwt.sign(
      { userId: existinguser.id, email: existinguser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    console.log(err);
    const error = new HttpError("log up failed, please try again later", 500);
    return next(error);
  }

  res.status(201).json({
    userId: existinguser.id,
    email: existinguser.email,
    token: token,
  });
};
exports.getAllUsers = getAllUsers;
exports.getUserbyId = getUserbyId;
exports.login = login;
exports.signup = signup;
