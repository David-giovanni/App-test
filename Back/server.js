const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcrypt");

const app = express();
const port = 4000;

const url = "mongodb://localhost:27017/Test";

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

MongoClient.connect(url)
  .then((client) => {
    const db = client.db("Test");
    const productsCollection = db.collection("Products");
    const usersCollection = db.collection("Users");

    app.get("/", (req, res) => {
      res.send("API is working");
    });

    // Route pour l'inscription d'un utilisateur
    app.post("/Register", async (req, res) => {
      try {
        const { firstName, lastName, email, password } = req.body;

        // Vérifier si l'email existe déjà
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
          return res.status(400).send({ message: "Email already exists" });
        }

        // Insérer l'utilisateur dans la base de données avec mot de passe crypté
        const newUser = {
          firstName,
          lastName,
          email,
          password: bcrypt.hashSync(password, 10), // Utilisation de bcrypt pour crypter le mot de passe
        };
        const result = await usersCollection.insertOne(newUser);

        if (result.insertedId) {
          res.status(201).send({ message: "User registered successfully" });
        } else {
          throw new Error("Failed to insert user");
        }
      } catch (err) {
        console.error("Error registering user", err);
        res.status(500).send("Error registering user");
      }
    });

    // Route pour la connexion d'un utilisateur
    app.post("/Login", async (req, res) => {
      try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await usersCollection.findOne({ email });
        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }

        // Vérifier si le mot de passe est correct
        if (!bcrypt.compareSync(password, user.password)) {
          return res.status(401).send({ message: "Invalid password" });
        }

        res.status(200).send({ message: "Login successful", user: user });
      } catch (err) {
        console.error("Error logging in user", err);
        res.status(500).send("Error logging in user");
      }
    });

    // Créer un nouveau produit
    app.post("/Products", async (req, res) => {
      try {
        const product = req.body;
        const result = await productsCollection.insertOne(product);
        if (result.insertedId) {
          const insertedProduct = await productsCollection.findOne({
            _id: result.insertedId,
          });
          io.emit("productAdded", insertedProduct); // Émettre un événement Socket.IO
          res.status(201).json(insertedProduct);
        } else {
          throw new Error("Erreur lors de l'insertion du produit");
        }
      } catch (err) {
        console.error("Erreur lors de la création du produit", err);
        res.status(500).send("Erreur lors de la création du produit");
      }
    });

    app.get("/Products", async (req, res) => {
      try {
        const products = await productsCollection
          .find(
            {},
            {
              projection: {
                name: 1,
                type: 1,
                price: 1,
                rating: 1,
                warranty_years: 1,
                available: 1,
              },
            }
          )
          .toArray();
        res.status(200).json(products);
      } catch (err) {
        console.error("Erreur lors de la récupération des produits", err);
        res.status(500).send("Erreur lors de la récupération des produits");
      }
    });

    // Supprimer un produit
    app.delete("/Products/:id", async (req, res) => {
      try {
        const productId = req.params.id;
        if (!ObjectId.isValid(productId)) {
          return res.status(400).send({ message: "Invalid product ID" });
        }
        const result = await productsCollection.deleteOne({
          _id: new ObjectId(productId),
        });
        if (result.deletedCount === 1) {
          io.emit("productDeleted", productId); // Émettre un événement Socket.IO
          res.status(200).send({ message: "Produit supprimé avec succès" });
        } else {
          res.status(404).send({ message: "Produit non trouvé" });
        }
      } catch (err) {
        console.error("Erreur lors de la suppression du produit", err);
        res.status(500).send("Erreur lors de la suppression du produit");
      }
    });

    app.put("/Products/:id", async (req, res) => {
      try {
        const productId = req.params.id;
        if (!ObjectId.isValid(productId)) {
          return res.status(400).send({ message: "Invalid product ID" });
        }
        const product = req.body;
        const result = await productsCollection.updateOne(
          { _id: new ObjectId(productId) },
          { $set: product }
        );
        if (result.modifiedCount === 1) {
          const updatedProduct = await productsCollection.findOne({
            _id: new ObjectId(productId),
          });
          io.emit("productUpdated", updatedProduct); // Émettre un événement Socket.IO
          res.status(200).send({ message: "Produit modifié avec succès" });
        } else {
          res.status(404).send({ message: "Produit non trouvé" });
        }
      } catch (err) {
        console.error("Erreur lors de la modification du produit", err);
        res.status(500).send("Erreur lors de la modification du produit");
      }
    });

    io.on("connection", (socket) => {
      console.log("Un utilisateur est connecté");

      socket.on("disconnect", () => {
        console.log("Un utilisateur est déconnecté");
      });
    });

    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Erreur de connexion à la base de données", err);
    process.exit(1); // Arrêter l'application en cas d'erreur de connexion
  });

// Gestionnaire global des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});
