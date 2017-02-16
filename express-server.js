const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 8080;

const users = {
  '0Jh9jK': {
    id: '0Jh9jK',
    email: 'dood@whatever.com',
    password: '$2a$10$C9zfa9PERq2u/N72vEi6Du1gier2lS8XpP.neblA0/2i7PyjBmxmC'
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
    "url": "http://www.lighthouselabs.ca"
  },
  "9sm5xK": {
    "id": "9sm5xK",
    "owner": "dv4d3r",
    "url": "http://www.google.com"
  }
};

function urlsForUser(id) {
  return Object.values(urlDatabase).filter((short) => {
    return short.owner === id;
  });
}

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(function(req, res, next) {
  res.locals.email = '';
  if (users[req.cookies.user_id]) {
    res.locals.email = users[req.cookies.user_id].email;
    res.locals.urls = urlsForUser(req.cookies.user_id);
  }
  next();
});

//Redirect from root
app.get("/", (req, res) => {
  if (res.locals.email) {
    res.redirect("/urls");
  } else {
    res.render("login");
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
    users[userID] = {
      "id": userID,
      "email": req.body.email,
      "password": bcrypt.hashSync(req.body.password, 10)
    };
    res.cookie("user_id", userID);
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
  if (!existingUser) {
    res.status(403).send("User with that e-mail does not exist");
  } else if (bcrypt.compareSync(req.body.password, existingUser.password)) {
    res.cookie("user_id", existingUser.id);
    res.redirect("/");
  } else {
    res.status(403).send("Password incorrect");
  }
  console.log(users);
});

//Show urls index
app.get("/urls", (req, res) => {
  if (res.locals.email) {
    res.render("urls_index");
  } else {
    res.status(401).send(`<a href="/login">Login</a> to see your ShortURLs.`);
  }
});

//New URL form
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//Create new url
app.post("/urls", (req, res) => {
  //TODO: make sure generatedshortURL does not conflict
  let shortURL = generateHash();
  urlDatabase[shortURL] = {
    "id": shortURL,
    "owner": req.cookies.user_id,
    "url": req.body.longURL
  };
  res.redirect(`/urls/${shortURL}`);
});

//GET individual URL page (with update form)
app.get("/urls/:id", (req, res) => {
  res.render("urls_show", { shortURL: req.params.id, longURL: urlDatabase[req.params.id].url } );
});

//Update an existing URL
app.post("/urls/:id", (req, res) => {
  if (urlDatabase[req.params.id].owner === req.cookies.user_id) {
    urlDatabase[req.params.id].url = req.body.longURL;
    res.redirect("/urls");
  }
});

//Redirect user to the long URL to which a shortened URL is assigned
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(302, longURL);
});

//Delete a URL combo
app.post("/urls/:id/delete", (req, res) => {
  if (urlDatabase[req.params.id].owner === req.cookies.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});

//Logout route
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/");
});

const server = app.listen(port, () => {
  const address = server.address();
  console.log(address);
  console.log(`Server listening on ${address.port}`);
});
