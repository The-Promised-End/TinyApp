var express = require("express");
var app = express();
const bcrypt = require('bcrypt');
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
var cookieSession = require('cookie-session')

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['secretKey'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

// THE ABOVE SECTION IS THE STUFF OF REQUIRING THE NPMS ETC.


// THE BELOW IS THE DATABASE SESSION
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync('password', 10),

  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync('password', 10),
  },
  "user3RandomID": {
    id: "user3RandomID",
    email: "me@me.com",
    password: bcrypt.hashSync('password', 10),
  }

};
var urlDatabase = {
  "b2xVn2": {"longURL": "http://www.lighthouselabs.ca",
    "userID": "userRandomID"
  },

  "9sm5xK": {"longURL": "http://www.google.com",
    "userID": "user2RandomID"
  }
};

//DATABASE STUFF ENDS HERE.

//USER DEFINED FUNCTIONS

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

function emailCheck(email) {
  for (user in users) {
    if (users[user]["email"] === email) {
      return true;
    }
  }
}

function findUser(user_id) {
  for (user in users) {
    if (users[user]["user_id"] === user_id) {
      return user;
    }
  }
}

function urlsForUser(id) {
  let userURLs = {};
  for (let shortURL in urlDatabase) {
    if(urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
}

function findUserByEmail(email) {
  let foundUser = false;
  for (let id in users) {
    const user = users[id];

    if (user.email === email) {
      foundUser = user;
    }
  }
  return foundUser;
}

// USER DEFINED FUNCTIONS ENDS HERE.

// ALL THE ROUTES START HERE.

// specific routes
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {

  let user= users[req.session.user_id];

  if (!user) {
    return res.redirect("/login");
  }
  let shortURL = req.params.id;
  let longURL = req.body["longURL"];
  let templateVars = {
    user: user,
    urls: urlsForUser(user.id)
  };
  res.render("urls_index", templateVars);

});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body["longURL"];
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: req.session.user_id
  };
  res.redirect("/urls/");
});

app.get("/urls/new", (req, res) => {
  let user = users[req.session["user_id"]];
  let templateVars = { user: user,
    urls: urlDatabase };

  if(user) {
    res.render("urls_new", templateVars
    );
  } else {
    res.redirect("/login");
  }

});


app.get("/urls/:id", (req, res) => {
  let user = users[req.session["user_id"]];
  let templateVars = { shortURL: req.params.id,
    urls: urlDatabase,
    user: user
  };
  res.render("urls_show", templateVars);

});

app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let user = users[req.session["user_id"]];

  if(urlDatabase[shortURL].userID === user.id) {
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect("/urls/");
  } else {
    res.status(403);
    res.send('403: Not authorized to edit');
  }
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL.longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  let user = users[req.session["user_id"]];

  if(urlDatabase[shortURL].userID === user.id) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.status(403);
    res.send('403: Not authorized to delete');
  }
});

app.get("/login", (req, res) => {

  res.render("login");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = findUserByEmail(email);

  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(403);
    res.send({error: 'the password and user do not match'});
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let user_id = generateRandomString();

  if (email === "" || password === "") {
    res.status(400);
    res.send("input needed");
  }

  if (emailCheck(email)) {
    res.status(400);
    res.send("Email already exists");
  } else{

      users[user_id] = {
      id: user_id,
      email: req.body.email,
      password: bcrypt.hashSync(password, 10),
    };
    req.session.user_id = user_id;

    res.redirect("/urls");

  }

});

app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/login");
});


app.listen(PORT, () => {
  console.log('Example app listening on port ${PORT}!');
});