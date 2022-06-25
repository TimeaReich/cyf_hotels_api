const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors);
app.use(express.json());
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
// const pool = new Pool({
//   user: "timea",
//   host: "localhost",
//   database: "cyf_hotels",
//   password: "password",
//   port: 5432,
// });
app.get("/", (req, res) => {
  res.send("hi, i am working hard");
});
app.get("/hotels/:hotelId", (req, res) => {
  const hotelId = Number(req.params.hotelId);
  pool
    .query("SELECT name FROM hotels WHERE hotels.id=$1", [hotelId])
    .then((response) => res.json(response))
    .catch((err) => {
      console.error(err);
      res.status(400).send(err);
    });
});
app.get("/hotels", (req, res) => {
  pool
    .query("SELECT * FROM hotels")
    .then((response) => res.json(response.rows))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});
app.get("/customers/:customerId", (req, res) => {
  const customerId = Number(req.params.customerId);
  pool
    .query("SELECT name FROM customers WHERE customers.id=$1", [customerId])

    .then((response) => res.json(response))
    .catch((err) => {
      console.error(err);
      res.status(400).send(err);
    });
});
app.get("/customers", (req, res) => {
  const query = "SELECT * FROM customers ORDER BY customers.name asc";
  pool
    .query(query)
    .then((response) => res.json(response.rows))
    .catch((err) => {
      console.error(err);
      res.status(400).json(err);
    });
});

app.post("/hotels", (req, res) => {
  const newHotelName = req.body.name;
  const newHotelRooms = req.body.rooms;
  const newHotelPostcode = req.body.postcode;
  if (!Number.isInteger(newHotelRooms) || newHotelRooms <= 0) {
    return res
      .status(400)
      .send("The number of rooms should be a positive number.");
  }
  pool
    .query("SELECT * FROM hotels WHERE name=$1", [newHotelName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A hotel with the same name already exists!");
      } else {
        const query =
          "INSERT INTO hotels(name,rooms,postcode) VALUES ($1,$2,$3)";

        pool
          .query(query, [newHotelName, newHotelRooms, newHotelPostcode])
          .then(() => res.send("Hotel created!"))
          .catch((err) => {
            console.error(err);
            res.status(500).json(err);
          });
      }
    });
});
app.put("/customers/:customerId", (req, res) => {
  const validEmail = (email) => {
    return email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
  };
  const customerId = Number(req.params.customerId);
  const newEmail = req.body.email;
  if (
    !Number.isInteger(customerId) ||
    customerId < 0 ||
    (newEmail === "" && !validEmail(newEmail))
  ) {
    return res.status(400).send("Please make sure ID is an integer!");
  }

  pool
    .query("UPDATE customers SET email=$1 WHERE id=$2", [newEmail, customerId])
    .then(() => res.send("Email updated!"))
    .catch((err) => {
      console.error(err);
      res.send(err);
    });
});

app.delete("/customers/:customerId", (req, res) => {
  const customerId = Number(req.params.customerId);
  if (!Number.isInteger(customerId)) {
    return res.status(400).send("Please make sure ID is an integer!");
  }
  pool
    .query("SELECT customers.name FROM customers WHERE customers.id=$1", [
      customerId,
    ])
    .then((result) => {
      if (result.rows.length <= 0) {
        return res.send("No customer with id:" + customerId);
      } else {
        pool.query("DELETE FROM bookings WHERE bookings.customer_id=$1", [
          customerId,
        ]);
        pool
          .query("DELETE FROM customers WHERE id=$1", [customerId])
          .then(() =>
            res.send(`Bookings and customer with id: ${customerId} deleted.`)
          )
          .catch((err) => console.error(err).send(err));
      }
    });
});
let port = process.env.PORT;
console.log(port);
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
