const express = require("express");
const app = express();
const PORT = 8080;

const users = { 
  "y12345": {
    id: "y12345", 
    email: "user@example.com", 
    password: "purple-monkey"
  },
 "qwerty": {
    id: "qwerty", 
    email: "user2@example.com", 
    password: "1234"
  }
}

const emailAlreadyExists = (reqBodyEmail) => {
  const keys = Object.keys(users)
  for (const user of keys) {
    if (users[user].email === reqBodyEmail) {
      return true;
    }
  }
  return false;
}

function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

app.use(express.static('public'));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser')
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/register", (req, res) => {
  const templateVars = { user: req.cookies["user_id"] };
  res.render("registration", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { user: req.cookies["user_id"], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: req.cookies["user_id"] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user: req.cookies["user_id"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

// shortURL redirects to actual longURL website
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.post("/register", (req, res) => {
  let reqBodyEmail = req.body.email;
  let reqBodyPassword = req.body.password;

  if (!reqBodyEmail || !reqBodyPassword) {
    res.status(400).send('Error: Empty string detected');
  } else if (emailAlreadyExists(reqBodyEmail)) {
    res.status(400).send('Error: Email already registered');
  } else {
    let id = generateRandomString();
    users[id] = {
      id: id,
      email: req.body.email,
      password: req.body.password
    };
    console.log(req.body);
    res.cookie('user_id', users[id]);
    console.log(users);
    res.redirect(`/urls`);
  }
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  let code = generateRandomString();
  urlDatabase[code] = req.body.longURL;
  res.redirect(`/urls/${code}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Editing a short url into a new long url, button in urls_show
app.post("/urls/:shortURL", (req, res) => {
  let newLongURL = req.body.newLongURL;
  urlDatabase[req.params.shortURL] = newLongURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  console.log('Username is ' + req.body.username);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('user');
  console.log('Logout success!');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});