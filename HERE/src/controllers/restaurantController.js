const { MongoClient } = require("mongodb");

const uri = "mongodb://127.0.0.1:27017/eggyDB";

module.exports = function (app, resto) {
  app.get("/", function (req, resp) {
    resp.render("main", {
      layout: "index",
      title: "My Home page",
    });
  });
  
  app.get("/view-establishment.hbs", function (req, resp) {
    MongoClient.connect(uri)
      .then((client) => {
        console.log("Connected to MongoDB");
        const dbo = client.db("eggyDB");
        const collName = dbo.collection("restaurants");
        const { stars } = req.query;

        let filter = {};
        if (stars) {
          const selectedRatings = Array.isArray(stars) ? stars.map(Number) : [Number(stars)];
          // Construct an array of filters for each selected rating
          const ratingFilters = selectedRatings.map(selectedRating => {
            // Calculate the rating range for each selected rating
            const minRating = selectedRating;
            const maxRating = selectedRating + 1;
            return { main_rating: { $gte: minRating, $lt: maxRating } };
          });
          // Combine the filters using the $or operator
          filter = { $or: ratingFilters };
        }

        const cursor = collName.find(filter);

        Promise.all([cursor.toArray()])
          .then(function ([restaurants]) {
            console.log("Data fetched successfully");
            const restaurant_row1 = restaurants.slice(0, 3);
            const restaurant_row2 = restaurants.slice(3, 6);
            const restaurant_row3 = restaurants.slice(6);
            resp.render("view-establishment", {
              layout: "index",
              title: "View Establishments",
              restaurant_row1,
              restaurant_row2,
              restaurant_row3
            });
          })
          .catch(function (error) {
            console.error("Error fetching data:", error);
            resp.status(500).send("Error fetching data");
          })
          .finally(() => {
            client.close();
          });
      })
      .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
        resp.status(500).send("Error connecting to MongoDB");
      });
});


};
