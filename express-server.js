const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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
  //TODO Handle logged in and logged out according to tech specs
  redirect("/urls");
});

//Show urls index
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, port: PORT };
  res.render("urls_index", templateVars);
  //console.log(req.query);
});

//New URL form
app.get("/urls/new", (req, res) => {
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
  let templateVars = { urls: urlDatabase, shortURL: req.params.id, port: PORT};
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

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});
