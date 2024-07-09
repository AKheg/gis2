const express = require("express")
const router = express.Router()

router.get("/", function (req, res, next) {
  if (req.user) {
    res.redirect("/admin");
    //res.render('index', { username: req.user.username, graves: req.gravesData });
  } else {
    res.render("index", { graves: req.gravesData });
  }
});

module.exports = router;
