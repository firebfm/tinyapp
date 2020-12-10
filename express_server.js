const express = require("express");
const app = express();
const PORT = 8080;

const bcrypt = require('bcrypt');

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

const emailAlreadyExists = (reqBodyEmail) => {
  const keys = Object.keys(users)
  for (const user of keys) {
    if (users[user].email === reqBodyEmail) {
      return true;
    }
  }
  return false;
};

const verifyUser = (reqBodyEmail, reqBodyPassword) => {
  const keys = Object.keys(users);
  for (const user of keys) {
    let hashMatch = bcrypt.compareSync(reqBodyPassword, users[user].password)
    if (users[user].email === reqBodyEmail && hashMatch) {
      return user;
    }
  }
  return null;
};

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

// check if cookies id matches shorturl user id
const matchShortURLFunc = (req) => {
  let matchShortURL = false;
  // if logged in, statement is required because can't check id of undefined cookie
  if (req.session.user_id) {
    if (urlDatabase[req.params.shortURL].userID === req.session.user_id.id) {
      matchShortURL = true;
    }
  }
  return matchShortURL;
}

function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

app.use(express.static('public'));

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  keys: ['foobar', 'applesauce']
}));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/register", (req, res) => {
  const templateVars = { user: req.session.user_id };
  res.render("registration", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: req.session.user_id };
  res.render("login", templateVars);
});

app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    let urlDatabaseForUser =  urlsForUser(req.session.user_id.id);
    const templateVars = { user: req.session.user_id, urls: urlDatabaseForUser };
    res.render("urls_index", templateVars);
  } else {
    res.render("urls_index", {user: null});
  }
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = { user: req.session.user_id };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:shortURL", (req, res) => {
  let matchShortURL = matchShortURLFunc(req);
  const templateVars = { user: req.session.user_id, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, matchShortURL: matchShortURL };
  res.render("urls_show", templateVars);
});

// shortURL redirects to actual longURL website
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
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
    const hashedPassword = bcrypt.hashSync(reqBodyPassword, 10);
    users[id] = {
      id: id,
      email: reqBodyEmail,
      password: hashedPassword
    };
    console.log(req.body);
    req.session.user_id = users[id];
    console.log(users);
    res.redirect(`/urls`);
  }
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  let code = generateRandomString();
  urlDatabase[code] = {
    longURL: req.body.longURL,
    userID: req.session.user_id.id
  };
  res.redirect(`/urls/${code}`);
  console.log('URLDATABASE IS ' + JSON.stringify(urlDatabase));
});

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

app.post("/login", (req, res) => {
  if (emailAlreadyExists(req.body.email)) {
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
  console.log('Logout success!');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});