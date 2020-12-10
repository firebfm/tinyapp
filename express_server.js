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
    if (users[user].email === reqBodyEmail && users[user].password === reqBodyPassword) {
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

function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

app.use(express.static('public'));

app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
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

app.get("/login", (req, res) => {
  const templateVars = { user: req.cookies["user_id"] };
  res.render("login", templateVars);
});

app.get("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    let urlDatabaseForUser =  urlsForUser(req.cookies["user_id"].id);
    const templateVars = { user: req.cookies["user_id"], urls: urlDatabaseForUser };
    res.render("urls_index", templateVars);
  } else {
    res.render("urls_index", {user: null});
  }
});

app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    const templateVars = { user: req.cookies["user_id"] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user: req.cookies["user_id"], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
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
  urlDatabase[code] = {
    longURL: req.body.longURL,
    userID: req.cookies["user_id"].id
  };
  res.redirect(`/urls/${code}`);
  console.log('URLDATABASE IS ' + JSON.stringify(urlDatabase));
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Editing a short url into a new long url, button in urls_show
app.post("/urls/:shortURL", (req, res) => {
  let newLongURL = req.body.newLongURL;
  urlDatabase[req.params.shortURL].longURL = newLongURL;
  res.redirect(`/urls/${req.params.shortURL}`);
});

app.post("/login", (req, res) => {
  if (emailAlreadyExists(req.body.email)) {
    let id = verifyUser(req.body.email, req.body.password);
    if (id) {
      res.cookie('user_id', users[id]);
      res.redirect('/urls');
    } else {
      res.status(403).send('Wrong password');
    }
  } else {
    res.status(403).send('Error: Email cannot be found');
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  console.log('Logout success!');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});