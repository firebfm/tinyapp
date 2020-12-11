const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
const { getUserByEmail, generateRandomString } = require('./helpers.js');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['foobar', 'applesauce']
}));
app.set("view engine", "ejs");

const users = {
  "y12345": {
    id: "y12345",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey", 10)
  },
  "qwerty": {
    id: "qwerty",
    email: "user2@example.com",
    password: bcrypt.hashSync("1234", 10)
  }
};

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

// return user if email and password match
const verifyUser = (reqBodyEmail, reqBodyPassword) => {
  const keys = Object.keys(users);
  for (const user of keys) {
    let hashMatch = bcrypt.compareSync(reqBodyPassword, users[user].password);
    if (users[user].email === reqBodyEmail && hashMatch) {
      return user;
    }
  }
  return null;
};

// get all urls that belong to user
function urlsForUser(id) {
  const newObj = {};
  const keys = Object.keys(urlDatabase);
  for (const key of keys) {
    if (urlDatabase[key].userID === id) {
      newObj[key] = (urlDatabase[key]);
    }
  }
  return newObj;
}

// check if shortURL belongs to user, if cookies id matches shorturl user id
const matchShortURLFunc = (req) => {
  let matchShortURL = false;
  // if logged in, statement is required because can't check id of undefined cookie
  if (req.session.user_id) {
    if (urlDatabase[req.params.shortURL].userID === req.session.user_id.id) {
      matchShortURL = true;
    }
  }
  return matchShortURL;
};

// root page redirect
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// registration page
app.get("/register", (req, res) => {
  const templateVars = { user: req.session.user_id };
  res.render("registration", templateVars);
});

// login page
app.get("/login", (req, res) => {
  const templateVars = { user: req.session.user_id };
  res.render("login", templateVars);
});

// show all urls if logged in, else show error message
app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    let urlDatabaseForUser =  urlsForUser(req.session.user_id.id);
    const templateVars = { user: req.session.user_id, urls: urlDatabaseForUser };
    res.render("urls_index", templateVars);
  } else {
    res.render("urls_index", {user: null});
  }
});

// show create new url page
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = { user: req.session.user_id };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

// only show shortURL if it belongs to user
app.get("/urls/:shortURL", (req, res) => {
  if (!urlDatabase.hasOwnProperty(req.params.shortURL)) {
    res.status(404).send("Error: The ShortURL code doesn't exist");
  } else {
    let matchShortURL = matchShortURLFunc(req);
    const templateVars = { user: req.session.user_id, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, matchShortURL: matchShortURL };
    res.render("urls_show", templateVars);
  }
});

// shortURL redirects to actual longURL website
app.get("/u/:shortURL", (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send("Error: The ShortURL code doesn't exist");
  } else {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
});

// register user
app.post("/register", (req, res) => {
  let reqBodyEmail = req.body.email;
  let reqBodyPassword = req.body.password;

  if (!reqBodyEmail || !reqBodyPassword) {
    res.status(400).send('Error: Empty string detected');
  } else if (getUserByEmail(reqBodyEmail, users)) {
    res.status(400).send('Error: Email already registered');
  } else {
    let id = generateRandomString();
    const hashedPassword = bcrypt.hashSync(reqBodyPassword, 10);
    users[id] = {
      id: id,
      email: reqBodyEmail,
      password: hashedPassword
    };
    req.session.user_id = users[id];
    res.redirect(`/urls`);
  }
});

// add new url to database
app.post("/urls", (req, res) => {
  let code = generateRandomString();
  urlDatabase[code] = {
    longURL: req.body.longURL,
    userID: req.session.user_id.id
  };
  res.redirect(`/urls/${code}`);
});

// delete url
app.post("/urls/:shortURL/delete", (req, res) => {
  let matchShortURL = matchShortURLFunc(req);
  if (matchShortURL) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
});

// Editing a short url into a new long url, button in urls_show
app.post("/urls/:shortURL", (req, res) => {
  let matchShortURL = matchShortURLFunc(req);
  if (matchShortURL) {
    let newLongURL = req.body.newLongURL;
    urlDatabase[req.params.shortURL].longURL = newLongURL;
    res.redirect(`/urls/${req.params.shortURL}`);
  }
});

// login if conditions are met
app.post("/login", (req, res) => {
  if (getUserByEmail(req.body.email, users)) {
    let id = verifyUser(req.body.email, req.body.password);
    if (id) {
      req.session.user_id = users[id];
      res.redirect('/urls');
    } else {
      res.status(403).send('Wrong password');
    }
  } else {
    res.status(403).send('Error: Email cannot be found');
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});