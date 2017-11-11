var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "user3RandomID": {
    id: "user3RandomID",
    email: "me@me.com",
    password: "me"
  }

}
var urlDatabase = {
  "b2xVn2": {"longURL" : "http://www.lighthouselabs.ca",
             "userID" : "userRandomID",
           },

  "9sm5xK": {"longURL" : "http://www.google.com",
             "userID" : "user2RandomID",
           }
};

function generateRandomString() {
  return Math.random().toString(36).substr(2,6);
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
  let userURLs = {}
  for (let shortURL in urlDatabase) {
    if(urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs
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

app.set("view engine", "ejs")
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));


// specific routes
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  let user = users[req.cookies["user_id"]] ;
  if (!user) {
    return res.redirect("/login")
  }
  let shortURL = req.params.id;
  let longURL = req.body["longURL"]
  let templateVars = {
    user: user,
    urls: urlsForUser(user.id),
  };
  res.render("urls_index", templateVars);

});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  let longURL = req.body["longURL"];
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: req.cookies.user_id
  };

  console.log(longURL)
  res.redirect("/urls/");
});

app.get("/urls/new", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let templateVars = { user: user,
                       urls: urlDatabase, };
  //const {email} = req.body
  //const foundUser = findUser
  if(user) {
    res.render("urls_new", templateVars
    )
  } else {res.redirect("/login");
}

});


app.get("/urls/:id", (req, res) => {
  let user = users[req.cookies["user_id"]];
  let templateVars = { shortURL: req.params.id,
                       urls : urlDatabase,
                       user: user,
                     }
  res.render("urls_show", templateVars)

})

app.post("/urls/:id", (req, res) => {
 let shortURL = req.params.id;
 let user = users[req.cookies["user_id"]];
  if(urlDatabase[shortURL].userID === user.id) {
    //to update the url with the longurl
    urlDatabase[shortURL].longURL =req.body.longURL;
    res.redirect("/urls/")
  } else {
    res.status(403);
    res.send('403: Not authorizerd to edit')
  }
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  console.log(longURL)
  res.redirect(longURL.longURL);
});

app.post("/urls/:id/delete", (req, res) => {
  let shortURL = req.params.id;
  let user = users[req.cookies["user_id"]];


  if(urlDatabase[shortURL].userID === user.id) {
    delete urlDatabase[shortURL];
    res.redirect("/urls")
    console.log(user.id)
  } else {
    res.status(403);
    res.send('403: Not authorized to delete');
  }
});

app.post("/login", (req, res) => {

  const { email, password } = req.body;

  const user = findUserByEmail(email);

  if (user && user.password === password) {
    res.cookie("user_id",user.id)
    res.redirect("/");
  } else {
    res.status(403);
    res.send({error: 'the password and user do not match'});
  }

});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
})

app.get("/register", (req,res) => {
  res.render("register");
})

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  let user_id = generateRandomString();

  if (email === "" || password === "") {
    res.status(400);
    res.send("Please input something")
  };

 if (emailCheck(email)) {
     res.status(400);
     res.send("Email already exists")
  } else{

    users[user_id] = {
      id: user_id,
      email: req.body.email,
      password: req.body.password,
    };

    res.cookie("user_id", user_id)

    res.redirect("/urls");

  }

})

app.get("/login", (req, res) => {

  res.render("login")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

