const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(function(req, res, next) {
  res.locals.username = req.cookies.username;
  next();
});

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

let templateVars = { urls: urlDatabase };

function generateShortURL() {
  const short = [];
  const base62Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++) {
    short[i] = base62Chars.charAt(Math.floor(Math.random() * base62Chars.length));
  }
  return(short.join(''));
}

//Redirect from root
app.get("/", (req, res) => {
  if (res.locals.username) {
    res.redirect("/urls");
  } else {
    res.render("login", templateVars);
  }
});

//Get login route
app.get("/login", (req, res) => {
  //templateVars.username = req.cookies.username;
  if (res.locals.username) {
    res.redirect("/");
  } else {
    res.render("login");
  }
});

//Login route
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/");
});

//Show urls index
app.get("/urls", (req, res) => {
  //templateVars.username = req.cookies.username;
  res.render("urls_index", templateVars);
  //console.log(req.query);
});

//New URL form
app.get("/urls/new", (req, res) => {
  //templateVars.username = req.cookies.username;
  res.render("urls_new");
});

//Create new url
app.post("/urls", (req, res) => {
  //TODO: make sure generatedshortURL does not conflict
  let shortURL = generateShortURL();
  urlDatabase[shortURL] = req.body.longURL;
  console.log(req.headers);
  res.redirect(`/urls/${shortURL}`);
});

//GET individual URL page (with update form)
app.get("/urls/:id", (req, res) => {
  templateVars.shortURL = req.params.id;
  //templateVars.username = req.cookies.username;
  res.render("urls_show", templateVars);
  //TODO add confirmation message
});

//Update an existing URL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

//Redirect user to the long URL to which a shortened URL is assigned
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(302, longURL);
});

//Delete a URL combo
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  //TODO add confirmation message
  res.redirect("/urls");
});

//Logout route
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/");
});

const server = app.listen(port, () => {
  const address = server.address();
  console.log(address);
  console.log(`Server listening on ${address.port}`);
});
