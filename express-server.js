const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

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

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, port: PORT };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  //TODO: make sure generatedshortURL does not conflict
  let shortURL = generateShortURL();
  urlDatabase[shortURL] = req.body.longURL;
  console.log(urlDatabase);
  res.send(`http://localhost:${PORT}/u/${shortURL} now redirects to ${req.body.longURL}`);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { urls: urlDatabase, shortURL: req.params.id, port: PORT};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(302, longURL);
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});

generateShortURL();
