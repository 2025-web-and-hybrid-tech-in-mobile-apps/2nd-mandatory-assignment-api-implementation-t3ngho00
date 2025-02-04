const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const jwt = require("jsonwebtoken");
app.use(express.json()); // for parsing application/json
const passport = require("passport");
const PassportJwt = require("passport-jwt");
const { ExtractJwt, Strategy: JwtStrategy } = PassportJwt;

// ------ WRITE YOUR SOLUTION HERE BELOW ------//

// Your solution should be written here
const users = [
  {
    userHandle: "DukeNukem",
    password: "123456",
  },
];
const highscores = [
  {
    level: "1",
    userHandle: "DukeNukem",
    score: 5,
    timestamp: "2019-08-24T14:15:22Z",
  },
];

const secretKey = "myjwtsecret";

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secretKey,
    },
    (jwtPayload, done) => {
      const user = users.find((u) => u.userHandle === jwtPayload.userHandle);
      return user ? done(null, user) : done(null, false);
    }
  )
);

app.use(express.json());
app.use(passport.initialize());

//sign up route
app.post("/signup", (req, res) => {
  const { userHandle, password } = req.body;
  if (!userHandle || !password)
    return res.status(400).send("Invalid request body");
  if (userHandle.length < 6 || password.length < 6)
    return res.status(400).send("Invalid request body");
  users.push({ userHandle: userHandle, password: password });
  console.log(users);
  return res.status(201).send("User registered successfully");
});

app.post("/login", (req, res) => {
  const { userHandle, password } = req.body;
  if (Object.keys(req.body).length > 2) {
    return res.status(400).send("Bad request");
  }

  if (
    !userHandle ||
    !password ||
    userHandle.length < 6 ||
    password.length < 6 ||
    typeof userHandle != "string" ||
    typeof password != "string"
  ) {
    return res.status(400).send("Bad request");
  }

  const user = users.find(
    (user) => user.userHandle == userHandle && user.password == password
  );

  if (!user) {
    return res.status(401).send("Incorrect username or password");
  }

  const token = jwt.sign({ userHandle: userHandle }, "myjwtsecret");
  res.status(200).json({ jsonWebToken: token });
});

//authenticate JWT
const authenticateJWT = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) return res.sendStatus(401);
  const token = header.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, "myjwtsecret", (err, user) => {
    if (err) return res.sendStatus(401);
    req.user = user.userHandle;
    next();
  });
};

//Post a high score
app.post("/high-scores", passport.authenticate("jwt", { session: false }), (req, res) => {
  const { level, userHandle, score, timestamp } = req.body;
  if (!level || !userHandle || !score || !timestamp) return res.sendStatus(400);
  const verifyUserHandle = req.user.userHandle;
  if (userHandle != verifyUserHandle) return res.sendStatus(401);
  highscores.push({
    level: level.toString(),
    userHandle: userHandle,
    score: score,
    timestamp: timestamp,
  });
  res.sendStatus(201);
});

//Get high scores
app.get("/high-scores", (req, res) => {
  const { level, page = 1 } = req.query;
  if (!level) return res.sendStatus(400);

  const filteredHighscores = highscores
    .filter((highscore) => highscore.level === level.toString())
    .sort((a, b) => b.score - a.score);

  const pageSize = 20;
  const paginatedHighscores = filteredHighscores.slice((page - 1) * pageSize, page * pageSize);

  return res.json(paginatedHighscores);
});

//------ WRITE YOUR SOLUTION ABOVE THIS LINE ------//

let serverInstance = null;
module.exports = {
  start: function () {
    serverInstance = app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  },
  close: function () {
    serverInstance.close();
  },
};