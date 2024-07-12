import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { CardActionArea } from "@mui/material";
import CardMedia from "@mui/material/CardMedia";
import Image from "../Assets/phone_035.jpg";

const socket = io("http://localhost:4000");

const Home = () => {
  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productType, setProductType] = useState("");
  const [productRating, setProductRating] = useState("");
  const [productWarrantyYears, setProductWarrantyYears] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://localhost:4000/Products");
      setProducts(response.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des produits", err);
    }
  };

  useEffect(() => {
    socket.on("productAdded", (newProduct) => {
      console.log("Nouveau produit ajouté :", newProduct);
      // Mettre à jour l'état local des produits ou effectuer d'autres actions
    });
  }, []);

  useEffect(() => {
    fetchProducts();

    socket.on("productAdded", (newProduct) => {
      setProducts((prevProducts) => [...prevProducts, newProduct]);
    });

    socket.on("productDeleted", (deletedProductId) => {
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product._id !== deletedProductId)
      );
    });

    socket.on("productUpdated", (updatedProduct) => {
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product._id === updatedProduct._id ? updatedProduct : product
        )
      );
    });

    return () => {
      socket.off("productAdded");
      socket.off("productDeleted");
      socket.off("productUpdated");
    };
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const newProduct = {
        name: productName,
        price: Number(productPrice),
        type: productType,
        rating: Number(productRating),
        warranty_years: Number(productWarrantyYears),
      };
      await axios.post("http://localhost:4000/Products", newProduct);
      setProductName("");
      setProductPrice("");
      setProductType("");
      setProductRating("");
      setProductWarrantyYears("");
    } catch (err) {
      console.error("Erreur lors de l'ajout du produit", err);
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await axios.delete(`http://localhost:4000/Products/${id}`);
    } catch (err) {
      console.error("Erreur lors de la suppression du produit", err);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductPrice(product.price);
    setProductType(product.type);
    setProductRating(product.rating);
    setProductWarrantyYears(product.warranty_years);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const updatedProduct = {
        name: productName,
        price: Number(productPrice),
        type: productType,
        rating: Number(productRating),
        warranty_years: Number(productWarrantyYears),
      };
      await axios.put(
        `http://localhost:4000/Products/${editingProduct._id}`,
        updatedProduct
      );
      setEditingProduct(null);
      setProductName("");

      setProductPrice("");
      setProductType("");
      setProductRating("");
      setProductWarrantyYears("");
    } catch (err) {
      console.error("Erreur lors de la mise à jour du produit", err);
    }
  };

  return (
    <div className="bg-[#242424] min-h-screen">
      <div className="text-center gap-20 flex mx-auto justify-center text-white font-bold pt-2">
        <a
          className="border rounded-xl p-2 hover:border-purple-500 hover:text-purple-500 transition-colors duration-300"
          href="/login"
        >
          login
        </a>
        <a
          className="border rounded-xl p-2 hover:border-purple-500 hover:text-purple-500 transition-colors duration-300"
          href="/register"
        >
          register
        </a>
      </div>
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-white text-center pt-10">
          PRODUITS DISPONIBLES
        </h1>
        <form
          className="mb-4"
          onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
        >
          <div className="justify-center flex flex-wrap">
            <input
              type="text"
              name="name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Nom du produit"
              className="border p-2 mr-2 mb-4 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <input
              type="number"
              name="price"
              value={productPrice}
              onChange={(e) => setProductPrice(e.target.value)}
              placeholder="Prix du produit"
              className="border p-2 mr-2 mb-4 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <input
              type="text"
              name="type"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="Type de produit"
              className="border p-2 mr-2 mb-4 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
            <input
              type="number"
              name="rating"
              value={productRating}
              onChange={(e) => {
                const value = e.target.value;
                if (value <= 5) {
                  setProductRating(value);
                } else {
                  setProductRating(5);
                }
              }}
              placeholder="Note sur 5"
              className="border p-2 mr-2 mb-4 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              max={5}
              required
            />
            <input
              type="number"
              name="warranty_years"
              value={productWarrantyYears}
              onChange={(e) => setProductWarrantyYears(e.target.value)}
              placeholder="Années de garantie"
              className="border p-2 mr-2 mb-4 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div className="flex justify-center mt-5">
            <button
              type="submit"
              className="bg-blue-500 rounded-xl text-white p-2"
            >
              {editingProduct ? "Mettre à jour" : "Ajouter"}
            </button>
            {editingProduct && (
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setProductName("");
                  setProductPrice("");
                  setProductType("");
                  setProductRating("");
                  setProductWarrantyYears("");
                }}
                className="bg-gray-500 rounded-xl text-white p-2 ml-2"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
        <ul className="text-white xl:grid xl:grid-cols-4 xl:pt-10 mx-auto xl:p-20 mt-10 ">
          {products.map((product) => (
            <li
              key={product._id}
              className="flex mb-4 justify-center m-auto items-center"
            >
              <Card
                sx={{
                  width: 300,
                  backgroundColor: "#161616",
                  color: "#fff",
                  borderRadius: "20px",
                }}
              >
                <CardActionArea className="rounded-xl">
                  <CardMedia
                    className="w-full h-60"
                    component="img"
                    image={Image}
                    alt="Produit"
                    sx={{
                      objectFit: "cover",
                      objectPosition: "center",
                    }}
                  />
                  <CardContent className="p-4">
                    <Typography
                      className="text-center"
                      gutterBottom
                      variant="h5"
                      component="div"
                    >
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="gray">
                      Prix : {product.price}$
                    </Typography>
                    <Typography variant="body2" color="gray">
                      Type : {product.type}
                    </Typography>
                    <Typography variant="body2" color="gray">
                      Note : {product.rating}
                    </Typography>
                    <Typography variant="body2" color="gray">
                      Garantie : {product.warranty_years} an(s)
                    </Typography>
                  </CardContent>
                  <div className="flex justify-center p-4">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="bg-yellow-500 text-white p-2 mr-2 rounded hover:bg-yellow-600 transition-colors duration-300"
                    >
                      Éditer
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Êtes-vous sûr de vouloir supprimer ce produit ?"
                          )
                        ) {
                          handleDeleteProduct(product._id);
                        }
                      }}
                      className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors duration-300"
                    >
                      Supprimer
                    </button>
                  </div>
                </CardActionArea>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
