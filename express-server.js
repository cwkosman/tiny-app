const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

const app = express();
const port = process.env.PORT || 8080;

const users = {
  '0b1w4n': {
    id: '0b1w4n',
    email: 'uncleben@tatooine.com',
    password: '$2a$10$xfHRwqy0GUHPd3hTx.uV..VwLmz3RcFbZqoNn0I3f0zOwVWcGeg6m'
  },
  "dv4d3r": {
    id: 'dv4d3r',
    email: 'vader@empire.com',
    password: '$2a$10$3UodVb9hjyRPzk690DmHcelYjDmNaFTv05U8OtDFxNg191bM8ZjgC'
  }
};

function generateHash() {
  const short = [];
  const base62Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++) {
    short[i] = base62Chars.charAt(Math.floor(Math.random() * base62Chars.length));
  }
  return(short.join(''));
}

const urlDatabase = {
  "b2xVn2": {
    "id": "b2xVn2",
    "owner": "dv4d3r",
    "url": "http://www.lighthouselabs.ca",
    "created": new Date(1487011192000),
    "visits": 2
  },
  "9sm5xK": {
    "id": "9sm5xK",
    "owner": "dv4d3r",
    "url": "http://www.google.com",
    "created": new Date(1487191894000),
    "visits": 1
  },
  "7Gjy67": {
    "id": "7Gjy67",
    "owner": "0b1w4n",
    "url": "http://www.reddit.com",
    "created": new Date(1487282450000),
    "visits": 0
  }
};

function urlsForUser(id) {
  return Object.values(urlDatabase).filter((url) => {
    return url.owner === id;
  });
}

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'tiny-development']
}));
app.use(function(req, res, next) {
  res.locals.email = '';
  if (users[req.session.userId]) {
    res.locals.email = users[req.session.userId].email;
  }
  next();
});

//Redirect from root
app.get("/", (req, res) => {
  if (res.locals.email) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

//Get register route
app.get("/register", (req, res) => {
  if (res.locals.email) {
    res.redirect("/");
  } else {
    res.render("register");
  }
});

//POST register route
app.post("/register", (req, res) => {
  let emailExists = Object.values(users).some((user) => {
    return user.email === req.body.email;
  });
  if (emailExists) {
    res.status(400).send("Email already in use.");
  } else if (!req.body.email || !req.body.password) {
    res.status(400).send("Specify both your email and a password.");
  } else {
    let userID = generateHash();
    if (users[userID]) {
      while (users[userID]) {
        userID = generateHash();
      }
    }
    users[userID] = {
      "id": userID,
      "email": req.body.email,
      "password": bcrypt.hashSync(req.body.password, 10)
    };
    req.session.userId = userID;
    res.redirect("/");
  }
});

//Get login route
app.get("/login", (req, res) => {
  if (res.locals.email) {
    res.redirect("/");
  } else {
    res.render("login");
  }
});

//Login route
app.post("/login", (req, res) => {
  let existingUser = Object.values(users).find((user) => {
    return user.email === req.body.email;
  });
  if (!existingUser || !(bcrypt.compareSync(req.body.password, existingUser.password))) {
    res.status(403).send("Incorrect credentials");
  } else {
    req.session.userId = existingUser.id;
    res.redirect("/");
  }
});

//Show urls index
app.get("/urls", (req, res) => {
  if (res.locals.email) {
    res.render("urls_index", res.locals.urls = urlsForUser(req.session.userId));
  } else {
    res.status(401).send(`You are not logged in.<br><a href="/login">Login</a> to see your ShortURLs.`);
  }
});

//New URL form
app.get("/urls/new", (req, res) => {
  if (res.locals.email) {
    res.render("urls_new");
  } else {
    res.status(401).send(`You are not logged in.<br><a href="/login">Login</a> to create a new ShortURL.`);
  }
});

//Create new url
app.post("/urls", (req, res) => {
  let shortURL = generateHash();
  if (urlDatabase[shortURL]) {
    while(urlDatabase[shortURL]) {
      shortURL = generateHash();
    }
  }
  urlDatabase[shortURL] = {
    "id": shortURL,
    "owner": req.session.userId,
    "url": req.body.longURL,
    "created": new Date(),
    "visitLog": {},
    "visits": 0
  };
  res.redirect(`/urls/${shortURL}`);
});

//GET individual URL page (with update form)
app.get("/urls/:id", (req, res) => {
  if (!(urlDatabase.hasOwnProperty(req.params.id))) {
    res.status(404).send("Not found<br>This ShortURL does not exist.");
  } else if (!(res.locals.email)) {
    res.status(401).send(`You are not logged in.<br><a href="/login">Login</a> to view this ShortURL.`);
  } else if (urlDatabase[req.params.id].owner !== req.session.userId) {
    res.status(403).send(`Unauthorized: you are not the onwer of this ShortURL.`);
  } else {
    res.render("urls_show", { url: urlDatabase[req.params.id] } );
  }
});

//Update an existing URL
app.post("/urls/:id", (req, res) => {
  if (!(urlDatabase.hasOwnProperty(req.params.id))) {
    res.status(404).send("Not found<br>This ShortURL does not exist.");
  } else if (!(res.locals.email)) {
    res.status(401).send(`You are not logged in.<br><a href="/login">Login</a> to view this ShortURL.`);
  } else if (urlDatabase[req.params.id].owner !== req.session.userId) {
    res.status(403).send(`Unauthorized: you are not the onwer of this ShortURL.`);
  } else {
    urlDatabase[req.params.id].url = req.body.longURL;
    res.redirect("/urls");
  }
});

//Redirect user to the long URL to which a shortened URL is assigned
app.get("/u/:shortURL", (req, res) => {
  if (!(urlDatabase.hasOwnProperty(req.params.shortURL))) {
    res.status(404).send("Not found<br>This shortURL is unassigned.");
  } else {
    let alias = urlDatabase[req.params.shortURL];
    if (!req.cookies.visitorId) {
      res.cookie("visitorId", generateHash());
    }
    res.redirect(302, alias.url);
    alias.visits++;
  }
});

//Delete a URL combo
app.post("/urls/:id/delete", (req, res) => {
  if (urlDatabase[req.params.id].owner === req.session.userId) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});

//Logout route
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

const server = app.listen(port, () => {
  const address = server.address();
  console.log(address);
  console.log(`Server listening on ${address.port}`);
});
