const HttpError = require("../model/http-err");
const SSEManager = require("../LiveModel/ssemanager");
const Conv = require("../model/conv-model");

const sseManager = new SSEManager();

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
