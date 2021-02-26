const HttpError = require("../model/http-err");
const SSEManager = require("../LiveModel/ssemanager");

const sseManager = new SSEManager();

const entrytest = async (req, res, next) => {
  const error = new HttpError("Error Not any user", 404);
  res.status(201).json({
    userId: "existinguser.id",
    email: "existinguser.email",
    token: "token",
  });
};

const entry = async (req, res, next) => {
  const id = req.userData.userId;

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
exports.entry = entry;
