const express = require("express");
const bodyParser = require("body-parser");
const SSE = require("express-sse");
const cors = require("cors");
const SSEClient = require("./SSEClient");
const SSEManager = require("./ssemanager");
const app = express();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const HttpError = require("./http-err");
const { validationResult, check } = require("express-validator");
const { v4: uuidv4 } = require("uuid");

const bcrypt = require("bcryptjs");
//app.use(cors());

const sseManager = new SSEManager();
/* On enregistre notre instance dans notre application Express, il sera lors possible
   de récupérer celle-ci via la méthode "get"
*/
app.set("sseManager", sseManager);
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
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

const getAllUsers = async (req, res, next) => {
  let resu = [];
  DUMMY_USER.forEach((usr) => resu.push({ id: usr.id, img: usr.img }));
  console.log(resu);
  if (resu) {
    res.json(resu);
  } else {
    res.status(404);
    res.json({ message: "UserId doesn not exist" });
  }
};
const getUserbyId = async (req, res, next) => {
  console.log("debutgetuserbyid");
  const userId = req.params.pid;
  const myuser = DUMMY_USER.find((user) => user.id == userId);

  if (myuser) {
    res.json(myuser);
  } else {
    res.status(404);
    res.json({ message: "UserId doesn not exist" });
  }
  console.log("fingetuserbyid");
};

const getConvbyId = async (req, res, next) => {
  console.log("debutgetconvbyid");
  const userId = req.params.convid;
  //console.log("zz");
  const myconv = DUMMY_CONV.find((conv) => conv.id == userId);
  if (myconv) {
    res.json(myconv);
  } else {
    res.status(404);
    res.json({ message: "Conv doesn not exist" });
  }
  console.log("fingetconvbyid");
};
const getConvsbyUserId = async (req, res, next) => {
  const userId = req.params.uid;
  const userConvs = DUMMY_USER.find((user) => user.id == userId).conversation;
  let response = [];
  for (const conv of userConvs) {
    response.push(DUMMY_CONV.find((conve) => conve.id == conv));
  }
  console.log(response);
  //const myconv = DUMMY_CONV.find((conv) => DUMMY_USER. conv.id == userId);
  if (response) {
    res.json(response);
  } else {
    res.status(404);
    res.json({ message: "This user has not conv " });
  }
};
const getPartsbyConvId = async (req, res, next) => {
  const convId = req.params.convId;
  const userParts = DUMMY_CONV.find((conv) => conv.id == convId).participants;
  //console.log("zz");
  //const myconv = DUMMY_CONV.find((conv) => DUMMY_USER. conv.id == userId);
  if (userParts) {
    res.json(userParts);
  } else {
    res.status(404);
    res.json({ message: "This conv has not conv " });
  }
};
const testlive = async (req, res, next) => {
  const client = new SSEClient(res);

  /* On initialise la connexion */
  client.initialize();

  /* On attends 5 secondes ... */
  setTimeout(() => {
    /* ... et on envoie un message au client */
    client.send({ id: Date.now(), type: "message", data: "hello" });
  }, 5000);
};
const login = async (req, res, next) => {
  const { email, password } = req.body;
  console.log(email);
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
    token = jwt.sign(
      { userId: existinguser.id, email: existinguser.email },
      "KEEEY",
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("login up failed, please try again later", 500);
    return next(error);
  }

  res.status(201).json({
    userId: existinguser.id,
    email: existinguser.email,
    token: token,
  });
};
const quitlive = async (req, res, next) => {
  console.log("in");
  const { id, conv } = req.body;
  console.log(id, conv);
  sseManager.delete2(id + conv);
  //console.log(sseManager.clients);
  /* On envoie le nouveau nombre de clients connectés */
  sseManager.broadcast({
    id: Date.now(),
    type: "count",
    data: sseManager.count(),
  });
  console.log("in2");
  next();
};
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
  console.log(newUser);
  DUMMY_USER.push(newUser);

  let token;
  try {
    token = jwt.sign({ userId: newUser.id, email: newUser.email }, "KEEEY", {
      expiresIn: "1h",
    });
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
const testlive2 = async (req, res, next) => {
  const id = req.params.uid + req.params.convId + uuidv4();
  //console.log("debuttestlive");
  /* On ouvre la connexion avec notre client */
  sseManager.open(id, res);
  //console.log(sseManager.clients);

  /* On envoie le nombre de clients connectés à l'ensemble des clients */
  sseManager.broadcast({
    id: Date.now(),
    type: "count",
    data: sseManager.count(),
  });

  /* en cas de fermeture de la connexion, on supprime le client de notre manager */
  req.on("close", () => {
    /* En cas de deconnexion on supprime le client de notre manager */
    sseManager.delete(id);
    /* On envoie le nouveau nombre de clients connectés */
    sseManager.broadcast({
      id: Date.now(),
      type: "count",
      data: sseManager.count(),
    });
  });
  console.log("fintestlive");
  next();
};
const createconv = async (req, res, next) => {
  const idconv = uuidv4();
  const { part1, part2 } = req.body;
  console.log(idconv);
  console.log(part1);
  console.log(part2);
  const newconv = {
    id: idconv,
    participants: [part1, part2],
    messages: [],
  };
  DUMMY_CONV.push(newconv);
  const usr1index = DUMMY_USER.findIndex((usr) => usr.id == part1);

  DUMMY_USER[usr1index].conversation = DUMMY_USER[
    usr1index
  ].conversation.concat(idconv);
  const usr2index = DUMMY_USER.findIndex((usr) => usr.id == part2);
  DUMMY_USER[usr2index].conversation = DUMMY_USER[
    usr2index
  ].conversation.concat(idconv);
  console.log(DUMMY_USER);
  console.log(DUMMY_CONV);

  if (idconv) {
    res.json(idconv);
  } else {
    res.status(404);
    res.json({ message: "UserId doesn not exist" });
  }
};
const postmsg = async (req, res, next) => {
  console.log("s");
  console.log(JSON.stringify(req.body));
  const convId = req.params.convid;
  const userId = req.params.uid;
  const myconv = DUMMY_CONV.find((conv) => conv.id == convId);

  const parts = myconv.participants.filter((part) => part != userId);
  console.log(parts);
  if (myconv) {
    myconv.messages.push({
      from: userId,
      date: new Date(),
      body: req.body.value,
    });
    //console.log(myconv);
    parts.forEach((part) => {
      /* sseManager.unicast(`${part}${convId}`, {
        id: Date.now(),
        type: "message",
        data: sseManager.count(),
      }); */
      sseManager.broadcast2(`${part}${convId}`, {
        id: Date.now(),
        type: "message",
        data: sseManager.count(),
      });
    });

    res.json(myconv);
  } else {
    res.status(404);
    res.json({ message: "Conv doesn not exist" });
  }
};
var sse = new SSE(["array", "containing", "initial", "content"]);

const router = express.Router();
const router2 = express.Router();
const router3 = express.Router();
const router4 = express.Router();
const router5 = express.Router();
const router6 = express.Router();
const router7 = express.Router();
const router8 = express.Router();
const router11 = express.Router();

router8.get("/:convId", getPartsbyConvId);
router.get("/alluser", getAllUsers);
router7.get("/:uid", getConvsbyUserId);
router.get("/:pid", getUserbyId);
router2.get("/:convid", getConvbyId);
router2.post("/", createconv);
router3.post("/:convid/:uid", postmsg);
router5.get("/hello", testlive);
router6.get("/live/:convId/:uid", testlive2);
router6.delete("/", quitlive);
router11.post("/log", login);
router11.post(
  "/sgnp",
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  signup
);

//router4.get("/:uid/:convId", sse.init);
let count = 0;
/* setInterval(()=>{
  count++
  console.log(count);
  sse.send(count, 'CustomEvent');
},1000) */

app.use("/api/user/", router);
app.use("/api/conv/w/", router7);
app.use("/api/conv/wp/", router8);
app.use("/api/conv/", router2);
app.use("/api/conv/", router3);
app.use("/api/stream/", router4);
app.use("/stream/", router5);
app.use("/stream/", router6);
app.use("/api/auth", router11);
app.use((error, req, res, next) => {
  console.log(error.message);
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknow error appears" });
});
app.listen(process.env.PORT || 5000);
